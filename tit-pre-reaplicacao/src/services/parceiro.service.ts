import { LRUCache } from "lru-cache";
import { retry } from "@brcap/utils";
import { container } from "../container/container.js";
import type { ParceiroData } from "../data/parceiro.data.js";
import { getProperty } from "../properties/properties.js";
import { RETRY_OPTIONS } from "../properties/server-settings.js";
import { makeRequest } from "../utils/http/request.utils.js";

const properties = await getProperty('rgt-batch-resgate-final');

export class ParceiroService {

    #cache = new LRUCache<number, Promise<ParceiroData | undefined>>({ max: 64 });

    async buscarParceiro(idParceiro: string | number): Promise<ParceiroData | undefined> {
        const key = Number(idParceiro);

        if (!this.#cache.has(key)) {
            const response = retry(
                () => makeRequest(`${properties.urls.parceiro}${key}`).then(res => res.body()),
                RETRY_OPTIONS
            )
                .then(res => (Array.isArray(res) ? res[0] : res) as ParceiroData | undefined)
                .catch(err => {
                    this.#cache.delete(key);
                    throw err;
                });

            this.#cache.set(key, response);
        }

        return await this.#cache.get(key)!;
    }
}

container.register(ParceiroService);
