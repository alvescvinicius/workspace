import './main/initialize.js';
import dayjs from 'dayjs';
import { ENVIRONMENT } from '@brcap/env';
import { container } from './container/container.js';
import { CAPITALIZACAO_DB, verificarConexao } from './database/database.js';
import { PreReaplicacaoService } from './services/pre-reaplicacao.service.js';
import { RelatorioService } from './services/relatorio.service.js';
import { lerArgumentos } from './utils/args.js';
import { getLogger } from './utils/logger.js';

const logger = getLogger('index');

let exitCode = 0;

try {
    const { titulos, dryRun } = lerArgumentos(process.argv.slice(2));

    logger.info(`Iniciando tit-pre-reaplicacao: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`);
    logger.info(`Ambiente: ${ENVIRONMENT} | Modo: ${dryRun ? 'DRY-RUN (sem gravação/envio)' : 'EXECUÇÃO'} | Títulos: ${titulos.length}`);
    logger.info(`Títulos: ${titulos.join(', ')}`);

    await verificarConexao();

    const resultados = await container.get(PreReaplicacaoService).executar(titulos, { dryRun });
    container.get(RelatorioService).gerar(resultados, dryRun);

    exitCode = resultados.some(r => r.situacao === 'ERRO') ? 1 : 0;
} catch (err) {
    logger.error('Erro fatal:', err);
    exitCode = 1;
} finally {
    await container.get(CAPITALIZACAO_DB).end()
        .catch(err => logger.error('Falha ao encerrar a conexão com o banco:', err));
}

process.exit(exitCode);
