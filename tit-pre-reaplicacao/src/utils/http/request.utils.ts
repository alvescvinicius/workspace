import { ProxyAgent, request } from "undici";
import { HttpError } from "./http-error.js";
import { HttpResponse } from './http-response.js';
import { tryParse } from "./parse.utils.js";
import { getLogger } from "../logger.js";
import type { IncomingHttpHeaders } from "node:http";

const logger = getLogger('makeRequest');
const proxyAgent = typeof process.env.http_proxy === 'string'
    ? new ProxyAgent(process.env.http_proxy)
    : undefined;

type RequestMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';

export type RequestOptions = {
    responseType: 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text' | 'auto';
}

/**
 * 
 * @param {string} url 
 * @param {RequestMethod} [method] Defaults to GET.
 * @param {*} [body]
 * @param {IncomingHttpHeaders | Array.<string>} [headers]
 * @param {RequestOptions} [options]
 * @returns {Promise.<HttpResponse>}
 */
export const makeRequest = async (url: string, method?: RequestMethod, body?: any, headers?: IncomingHttpHeaders | Array<string>, options?: RequestOptions): Promise<HttpResponse> => {
    const bodyType = typeof body === "string" ? 'text/plain' : 'application/json';
    body = typeof body === "string" ? body : JSON.stringify(body);
    method = method ?? 'GET';
    headers = {
        'Content-Type': bodyType,
        ...headers
    };

    const start = process.hrtime.bigint();

    try {
        const res = await request(url, {
            method,
            body,
            headers,
            dispatcher: proxyAgent
        });

        if (res.statusCode > 99 && res.statusCode < 400) {
            const end = process.hrtime.bigint();
            logger.info(`Request: [${method} - ${((end - start) / 1_000_000n)}ms] ${url} - ${res.statusCode}`);
            const request = new HttpResponse(res, options);
            return request;
        }

        const textBody = await res.body.text();
        const resBody = tryParse(textBody) ?? textBody;

        const end = process.hrtime.bigint();
        logger.error(`Request: [${method} - ${((end - start) / 1_000_000n)}ms] ${url} - ${res.statusCode}`);

        if (body)
            logger.error(`Request Body:`, body);

        if (resBody)
            logger.error(`Response Body:`, resBody);

        throw new HttpError(
            res.statusCode,
            url,
            body,
            resBody
        );
    } catch (err) {
        if (err instanceof HttpError)
            throw err;

        const end = process.hrtime.bigint();
        logger.error(`Request: [${method} - ${((end - start) / 1_000_000n)}ms] ${url}`);
        logger.error(err);
        throw err;
    }
};
