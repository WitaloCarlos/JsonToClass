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

const ParseEngines = {
    CSHARP: 'csharp',
    CSHARP_WRAPPER: 'csharp_w',
    TYPESCRIPT: 'typescript',
    JAVASCRIPT: 'javascript'
}

class ParsedField {
    constructor(type, innerType, name) {
        this.type = type;
        this.innerType = innerType; // Only used with array
        this.name = name;
    }

    toComparableString() {
        return `-${this.name.toLowerCase()}-${this.type.toLowerCase()}-${this.innerType ? this.innerType.toLowerCase() : ParsedTypes.NONE}-`;
    }
}

const EngineCsharp = {
    classHeader: (className) => {
        return 'public class ' + className + ' {\n\n';
    },
    classFields: (fields) => {

        let fieldBody = '';
        fields.forEach(field => {
            fieldBody += `\tpublic ${EngineCsharp.getType(field)} ${field.type !== ParsedTypes.ARRAY ? checkSnakeCase(field.name, true) : checkSnakeCase(arrayName(field.name), true)}  {get; set;}\n`;
        })

        return fieldBody;
    },
    classBottom: () => {
        return '\n}\n\n';
    },
    getType: (field) => {

        let resType = '';

        switch (field.type) {

            default:
            case ParsedTypes.STRING:
                resType = 'string'
                break;
            case ParsedTypes.BOOLEAN:
                resType = 'bool'
                break;
            case ParsedTypes.CHAR:
                resType = 'char'
                break;
            case ParsedTypes.DATE:
                resType = 'Date'
                break;
            case ParsedTypes.DOUBLE:
                resType = 'double'
                break;
            case ParsedTypes.FLOAT:
                resType = 'float'
                break;
            case ParsedTypes.LONG:
                resType = 'long'
                break;
            case ParsedTypes.INTEGER:
                resType = 'int'
                break;
            case ParsedTypes.NONE:
                resType = field.innerType;
                break;
            case ParsedTypes.ARRAY:
                resType = `List<${field.innerType}>`
                break;

        }

        return resType;

    }

}

const classPool = [];
const compareFields = (targetClass) => {

    let res = '';

    const comp = targetClass.fields.map(f => f.toComparableString());
    classPool.forEach(c => {
        const base = c.fields.map(f => f.toComparableString());
        if (!res && comp.filter(field => base.includes(field)).length === targetClass.fields.length) {
            res = c.className;
        }
    });

    return res;
};

const generate = (engine) => {
    let generated = '';
    const buildEngine = getEngine(engine);
    classPool.forEach(c => {
        generated += c.build(buildEngine);
    });

    return generated;
}

class ParsedClass {
    constructor() {
        this.className = '';
        this.fields = [];
        this.subClasses = [];
    }

    // TODO refac, if a class arealdy exists 
    build(engine) {
        
        let resultClass = '';

        resultClass += buildEngine.classHeader(this.className);
        resultClass += buildEngine.classFields(this.fields);
        resultClass += buildEngine.classBottom();


        return resultClass;

    }

}

const getEngine = (engine) => {


    switch (engine) {
        default:
        case ParseEngines.CSHARP:
            return EngineCsharp;
    }


}

const capitalizeString = (s) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const uncapitalizeString = (s) => {
    return s.charAt(0).toLowerCase() + s.slice(1);
}

const arrayName = (s) => {
    return s.toLowerCase().endsWith('s') ? s : s + 's';
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


const parse = (jsonTarget, resultClassName) => {
    const parsedClass = new ParsedClass();
    parsedClass.className = checkSnakeCase(resultClassName, true);

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

        const varName = checkSnakeCase(key, false);
        switch (val) {
            case 'number':

                if (varVal.toString().includes('.') || varVal.toString().includes(',')) {
                    if (varVal.toString().includes('f')) {
                        parsedClass.fields.push(new ParsedField(ParsedTypes.FLOAT, ParsedTypes.NONE, varName));
                    } else {
                        parsedClass.fields.push(new ParsedField(ParsedTypes.DOUBLE, ParsedTypes.NONE, varName));
                    }
                } else {
                    if (varVal.toString().length > 8) {
                        parsedClass.fields.push(new ParsedField(ParsedTypes.LONG, ParsedTypes.NONE, varName));
                    } else {
                        parsedClass.fields.push(new ParsedField(ParsedTypes.INTEGER, ParsedTypes.NONE, varName));
                    }
                }


                break;
            case 'boolean':
                parsedClass.fields.push(new ParsedField(ParsedTypes.BOOLEAN, ParsedTypes.NONE, varName));
                break;
            default:
            case 'string':
                if (varVal && varVal.length === 1) {
                    parsedClass.fields.push(new ParsedField(ParsedTypes.CHAR, ParsedTypes.NONE, varName));
                } else {
                    parsedClass.fields.push(new ParsedField(ParsedTypes.STRING, ParsedTypes.NONE, varName));
                }

                break;
            case 'date':
                parsedClass.fields.push(new ParsedField(ParsedTypes.DATE, ParsedTypes.NONE, varName));
                break;
            case 'object':

                const newElement = parse(jsonTarget[key], key);
                const clashCheck = compareFields(newElement);
                let fieldType = newElement.className;

                if (!clashCheck) {
                    classPool.push(newElement);
                } else {
                    fieldType = clashCheck;
                }

                parsedClass.fields.push(new ParsedField(ParsedTypes.NONE, fieldType, varName));
                break;
            case 'array':

                let arrayType = 'string';

                if (jsonTarget[key].length > 0) {

                    arrayType = typeof jsonTarget[key][0];

                    if (val === 'object' && typeof jsonTarget[key].getMonth === 'function') {

                        arrayType = 'Date';

                    } else if (arrayType == 'object') {
                        const newElement = parse(jsonTarget[key][0], arrayType);
                        const clashCheck = compareFields(newElement);
                        arrayType = newElement.className;
                        if (!clashCheck) {
                            classPool.push(newElement);
                        } else {
                            arrayType = clashCheck;
                        }
                    }
                }

                parsedClass.fields.push(new ParsedField(ParsedTypes.ARRAY, arrayType, varName));
                break;
        }

    })


    if (!compareFields(parsedClass))
        classPool.push(parsedClass);

    return parsedClass;

}


parse(jsonSample, 'Sample');
const retClasses = generate(ParseEngines.CSHARP);

console.log(retClasses);