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
    typeJ: [0,2,3],
    typeK: [true, false, true],
    typeL: 'a'
}

class ParsedClass {
    constructor() {
        
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

const parse = (jsonTarget, resultClassName, language) => {
    const subClasses = [];
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
                } else {
                    if (varVal.toString().length > 8) {
                        resultClass += '\n public long ' + varName + ' {get; set;}';
                    } else {
                        resultClass += '\n public int ' + varName + ' {get; set;}';
                    }
                }


                break;
            case 'boolean':
                resultClass += '\n public bool ' + varName + ' {get; set;}';
                break;
            default:
            case 'string':
                if (varVal && varVal.length === 1) {
                    resultClass += '\n public char ' + varName + ' {get; set;}';
                } else {
                    resultClass += '\n public string ' + varName + ' {get; set;}';
                }

                break;
            case 'date':
                resultClass += '\n public Date ' + varName + ' {get; set;}';
                break;
            case 'object':
                const newElement = parse(jsonTarget[key], key, language);
                if (!isSubClassClash(subClasses, newElement))
                    subClasses.push(newElement);

                resultClass += '\n public ' + checkSnakeCase(key, true) + ' ' + varName + ' {get; set;}';
                break;
            case 'array':
                let arrayType = 'string';

                if (jsonTarget[key].length > 0) {

                    arrayType = typeof jsonTarget[key][0];

                    if (val === 'object' && typeof jsonTarget[key].getMonth === 'function') {
                        arrayType = 'Date';
                    } else if (arrayType == 'object') {
                        arrayType = checkSnakeCase(key, true);
                        const newElement = parse(jsonTarget[key][0], arrayType, language);
                        if (!isSubClassClash(subClasses, newElement))
                            subClasses.push(newElement);
                    }
                }

                resultClass += '\n public List<' + arrayType + '> ' + key + 's {get; set;}';
                break;
        }

    })

    resultClass += '\n}\n';

    subClasses.forEach(sub => {
        resultClass += '\n\n' + sub;
    })

    return resultClass;

}




console.log(parse(jsonSample, 'Sample', 'C#'));