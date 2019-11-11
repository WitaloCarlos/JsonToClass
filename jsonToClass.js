const jsonSample = {
    typeA: "a",
    typeB: 123,
    typeC: Date.now(),
    typeD: 1.2,
    typeE: { subA: 0, subB: "b" },
    typeF: [{ subA: 0, subB: "b" }, { subA: 0, subB: "b" }],
    type_g: 'yey',
    TypeH: false,
    typeI: new Date(),
    typeJ: [0, 2, 3],
    typeK: [true, false, true],
    typeL: 'a'
}

const ParsedTypes = {
    INTEGER: 'int',
    DOUBLE: 'double',
    LONG: 'long',
    FLOAT: 'float',
    STRING: 'string',
    CHAR: 'char',
    BOOLEAN: 'boolean',
    DATE: 'date',
    ARRAY: 'array',
    NONE: 'none'
}

class ParsedField {
    constructor(type, innerType, name) {
        this.type = type;
        this.innerType = innerType; // Only used with array
        this.name = name;
    }

    toComparableString() {
        return `-${this.name}-${this.type}-${this.innerType ? this.innerType : ParsedTypes.NONE}-`;
    }
}

class ParsedClassPool {
    constructor() {
        this.classes = [];
    }

    compareFields(targetClass) {

        let res = '';
        const comp = targetClass.fields.map(f => f.toComparableString());
        this.classes.forEach(c => {
            const base = c.fields.map(f => f.toComparableString());
            if (!res && comp.filter(field => base.includes(field)).length === targetClass.fields.length) {
                res = c.className;
            }
        });

        return res;
    }
}

class ParsedClass {
    constructor() {
        this.className = '';
        this.fields = [];
        this.subClasses = [];
    }

    // TODO refac, if a class arealdy exists 
    compareFields(targetFields) {
        const comparison = Object.assign(this.fields);
        let target = Object.assign(targetFields);
        target = target.map(f => f.toComparableString());

        return comparison.map(f => f.toComparableString()).filter(field => target.includes(field)).length === this.fields.length;
    }

}

const capitalizeString = (s) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const uncapitalizeString = (s) => {
    return s.charAt(0).toLowerCase() + s.slice(1);
}

const checkSnakeCase = (s, captalize) => {
    if (s.includes('_') || s.includes('-')) {
        const divider = s.includes('_') ? '_' : '-';
        const parts = s.split(divider);
        let result = '';

        for (let i = 0; i < parts.length; i++) {
            if (i === 0 && !captalize) {
                result += uncapitalizeString(parts[i]);
            } else {
                result += capitalizeString(parts[i]);
            }

        }

        return result;
    } else {
        return captalize ? capitalizeString(s) : uncapitalizeString(s);
    }
}

const isSubClassClash = (subClasses, newClass) => {

    const newClassParts = newClass.split(' {\n');

    return subClasses.some(s => s.includes(newClassParts[1]));
}

const classPool = new ParsedClassPool();

const parse = (jsonTarget, resultClassName, language) => {
    const subClasses = [];

    const parsedClass = new ParsedClass();
    parsedClass.className = resultClassName;

    let resultClass = 'public class ' + checkSnakeCase(resultClassName, true) + ' {\n';
    const objKeys = Object.keys(jsonTarget);
    objKeys.forEach(key => {
        let val = typeof jsonTarget[key];
        const varVal = jsonTarget[key];

        if (val === 'object' && typeof varVal.getMonth === 'function') {
            val = 'date';
        }

        if (val === 'object' && Array.isArray(jsonTarget[key])) {
            val = 'array';
        }

        console.log(val);
        const varName = checkSnakeCase(key, false);
        switch (val) {
            case 'number':

                if (varVal.toString().includes('.') || varVal.toString().includes(',')) {
                    resultClass += '\n public double ' + varName + ' {get; set;}';
                    parsedClass.fields.push(new ParsedField(ParsedTypes.DOUBLE, ParsedTypes.NONE, varName));

                    // TODO check float
                } else {
                    if (varVal.toString().length > 8) {
                        resultClass += '\n public long ' + varName + ' {get; set;}';
                        parsedClass.fields.push(new ParsedField(ParsedTypes.DOUBLE, ParsedTypes.LONG, varName));
                    } else {
                        resultClass += '\n public int ' + varName + ' {get; set;}';
                        parsedClass.fields.push(new ParsedField(ParsedTypes.DOUBLE, ParsedTypes.INTEGER, varName));
                    }
                }


                break;
            case 'boolean':
                resultClass += '\n public bool ' + varName + ' {get; set;}';
                parsedClass.fields.push(new ParsedField(ParsedTypes.BOOLEAN, ParsedTypes.NONE, varName));
                break;
            default:
            case 'string':
                if (varVal && varVal.length === 1) {
                    resultClass += '\n public char ' + varName + ' {get; set;}';
                    parsedClass.fields.push(new ParsedField(ParsedTypes.CHAR, ParsedTypes.NONE, varName));
                } else {
                    resultClass += '\n public string ' + varName + ' {get; set;}';
                    parsedClass.fields.push(new ParsedField(ParsedTypes.STRING, ParsedTypes.NONE, varName));
                }

                break;
            case 'date':
                resultClass += '\n public Date ' + varName + ' {get; set;}';
                parsedClass.fields.push(new ParsedField(ParsedTypes.DATE, ParsedTypes.NONE, varName));
                break;
            case 'object':
                const newElement = parse(jsonTarget[key], key, language);
                const clashCheck = classPool.compareFields(newElement);
                let fieldType = newElement.className;

                if (!clashCheck) {
                    classPool.classes.push(newElement);
                } else {
                    fieldType = clashCheck;
                }

                parsedClass.fields.push(new ParsedField(fieldType, ParsedTypes.NONE, varName));
                resultClass += '\n public ' + checkSnakeCase(key, true) + ' ' + varName + ' {get; set;}';
                break;
            case 'array':
                let arrayType = 'string';

                if (jsonTarget[key].length > 0) {

                    arrayType = typeof jsonTarget[key][0];

                    if (val === 'object' && typeof jsonTarget[key].getMonth === 'function') {
                        arrayType = 'Date';
                    } else if (arrayType == 'object') {
                        const newElement = parse(jsonTarget[key][0], arrayType, language);
                        const clashCheck = classPool.compareFields(newElement);
                        arrayType = newElement.className;
                        if (!clashCheck) {
                            classPool.classes.push(newElement);
                        } else {
                            arrayType = clashCheck;
                        }
                    }
                }
                parsedClass.fields.push(new ParsedField(ParsedTypes.ARRAY, arrayType, varName));
                resultClass += '\n public List<' + arrayType + '> ' + key + 's {get; set;}';
                break;
        }

    })

    resultClass += '\n}\n';

    subClasses.forEach(sub => {
        resultClass += '\n\n' + sub;
    })

    classPool.push(parsedClass);

    return resultClass;

}




console.log(parse(jsonSample, 'Sample', 'C#'));