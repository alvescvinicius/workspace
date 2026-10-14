/**
 * Json parse seguro, caso o Json seja inválido o resultado será undefined
 * 
 * @param {string} json 
 * @returns {* | undefined} Undefined em caso de erro
 */
export function tryParse(json: string): any | undefined {
    try {
        return JSON.parse(json);
    } catch (err) {
        return undefined;
    }
}
