import { LRUCache } from "lru-cache";
import { retry } from "@brcap/utils";
import { container } from "../container/container.js";
import type { PlanoData } from "../data/plano.data.js";
import { getProperty } from "../properties/properties.js";
import { RETRY_OPTIONS } from "../properties/server-settings.js";
import { makeRequest } from "../utils/http/request.utils.js";

const properties = await getProperty('rgt-batch-resgate-final');

export class PlanoService {

    #cache = new LRUCache<number, Promise<PlanoData | undefined>>({ max: 128 });

    async buscarPlano(idPlano: string | number): Promise<PlanoData | undefined> {
        const key = Number(idPlano);

        if (!this.#cache.has(key)) {
            const response = retry(
                () => makeRequest(`${properties.urls.planos}${key}`).then(res => res.body()),
                RETRY_OPTIONS
            )
                .then(res => (Array.isArray(res) ? res[0] : res) as PlanoData | undefined)
                .catch(err => {
                    this.#cache.delete(key);
                    throw err;
                });

            this.#cache.set(key, response);
        }

        return await this.#cache.get(key)!;
    }
}

container.register(PlanoService);
