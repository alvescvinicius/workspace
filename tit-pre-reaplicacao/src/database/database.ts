import { container } from '../container/container.js';
import { getLogger } from '../utils/logger.js';
import { ContainerKey } from '@brcap/utils/di';
import { Database } from '@brcap/db';
import { MariaDBDriver, MariaDBDriverOptions } from '@brcap/db-mariadb';
import { ENVIRONMENT } from '@brcap/env';

export const CAPITALIZACAO_DB = new ContainerKey<Database<MariaDBDriver, MariaDBDriverOptions>>('capitalizacao_db');

const logger = getLogger('Database');

// Host conforme o ambiente (mesma regra do tit-gera-json-previa / tit-envia-ap-tributos-excecao).
// Pode ser sobrescrito com DB_HOST.
const host = process.env.DB_HOST ?? (ENVIRONMENT === 'PRD' ? 'capitalizacao_db_prd' : 'capitalizacao_db');

container.register(CAPITALIZACAO_DB, () => {
    logger.info(`Conectando ao banco | ENVIRONMENT: ${ENVIRONMENT} | host: ${host}`);
    return new Database({
        driver: MariaDBDriver,
        property: 'capitalizacao_db',
        host,
        logger: getLogger('Database'),
        connectionLimit: 8,
        decimalAsNumber: true,
    });
});

/** Confirma a conexão e registra em qual banco/host a aplicação está. */
export async function verificarConexao(): Promise<void> {
    const [info] = await container.get(CAPITALIZACAO_DB).query<{ banco: string; host: string; usuario: string }>(
        `SELECT DATABASE() AS banco, @@hostname AS host, USER() AS usuario`,
        {},
        'verificarConexao'
    );
    logger.info(`Conexão ativa → banco: ${info?.banco} | host: ${info?.host} | usuário: ${info?.usuario}`);
}
