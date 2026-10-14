import { RetryOptions } from "@brcap/utils";
import { RgtBatchResgateFinalProperty } from "./rgt-batch-resgate-final.property.js";

export type Properties = {
    'capitalizacao_db': any;
    'rgt-batch-resgate-final': RgtBatchResgateFinalProperty;
};

export const CONCURRENCY = {
    EXECUTION: 4,
    SERVICES: 4,
    SNS: 4
} as const;

export const CONCURRENCY_INTERVAL = {
    EXECUTION: undefined,
    SERVICES: undefined,
    SNS: 1000
} as const;

export const RETRY_OPTIONS: RetryOptions = {
    attempts: 3,
    delay: 100,
    exponentialBackoff: true
};
