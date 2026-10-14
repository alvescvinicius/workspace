import { STATUS_CODES } from "node:http";

export class HttpError extends Error {
    statusCode: number;
    url: string;
    requestBody?: any;
    body?: any;

    /**
     * Gera um Erro HTTP
     * 
     * @param {number} statusCode 
     * @param {string} url
     * @param {any} [requestBody] 
     * @param {any} [body] 
     */
    constructor(
        statusCode: number,
        url: string,
        requestBody?: any,
        body?: any
    ) {
        super(STATUS_CODES[statusCode] ?? 'Erro interno!');
        this.url = url;
        this.statusCode = statusCode;
        this.requestBody = requestBody;
        this.body = body;
    }

}
