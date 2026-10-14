import type { Dispatcher } from 'undici';
import { tryParse } from './parse.utils.js';
import type { RequestOptions } from './request.utils.js';

export class HttpResponse {

    #response: Dispatcher.ResponseData;
    #options: RequestOptions | undefined;

    constructor(response: Dispatcher.ResponseData, options?: RequestOptions) {
        this.#response = response;
        this.#options = options;
    }

    async body(): Promise<string | any | undefined> {
        const responseType = this.#options?.responseType ?? 'auto';
        if (responseType === 'auto') {
            const body = await this.#response.body.text();
            if (body.trim().length === 0)
                return undefined;

            const json = tryParse(body);
            if (json)
                return json;

            return body;
        }

        return await this.#response.body[responseType]();
    }

    get statusCode() {
        return this.#response.statusCode;
    }

    get headers() {
        return this.#response.headers;
    }
}
