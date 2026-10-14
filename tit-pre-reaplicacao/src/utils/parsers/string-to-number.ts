export function stringToNumber(value: string | number, type: 'int' | 'float' = 'int') {
    if (value === null || typeof value === 'undefined')
        throw new Error(`Invalid String/Number`);

    if (typeof value === "number")
        return value;

    return type === 'float' ? parseFloat(value) : parseInt(value, 10);
}
