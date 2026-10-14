import dayjs from "dayjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { container } from "../container/container.js";
import { ResultadoTitulo } from "../data/resultado.data.js";
import { getLogger } from "../utils/logger.js";

const logger = getLogger('RelatorioService');

const COLUNAS: Array<keyof ResultadoTitulo> = [
    'idTitulo', 'situacao', 'etapaConcluida', 'idSolicitacao', 'idSolicitacaoPagamento',
    'saldoCapitalizado', 'reaplicacaoInserida', 'mensagemJaEnviada', 'messageId', 'mensagem'
];

function csv(valor: unknown): string {
    if (valor === null || typeof valor === 'undefined') return '';
    const texto = String(valor);
    return /[;"\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

export class RelatorioService {

    /** Grava o resultado em relatorios/ (JSON completo + CSV resumido) e imprime o resumo no log. */
    gerar(resultados: ResultadoTitulo[], dryRun: boolean): { json: string; csv: string } {
        const diretorio = join(process.cwd(), 'relatorios');
        mkdirSync(diretorio, { recursive: true });

        const nome = `pre-reaplicacao${dryRun ? '-dry-run' : ''}-${dayjs().format('YYYYMMDD-HHmmss')}`;
        const arquivoJson = join(diretorio, `${nome}.json`);
        const arquivoCsv = join(diretorio, `${nome}.csv`);

        writeFileSync(arquivoJson, JSON.stringify({ geradoEm: new Date().toISOString(), dryRun, resultados }, null, 2), 'utf-8');
        writeFileSync(
            arquivoCsv,
            [COLUNAS.join(';'), ...resultados.map(r => COLUNAS.map(c => csv(r[c])).join(';'))].join('\n') + '\n',
            'utf-8'
        );

        const contar = (s: ResultadoTitulo['situacao']) => resultados.filter(r => r.situacao === s).length;

        logger.info('='.repeat(60));
        logger.info(`RESUMO${dryRun ? ' (DRY-RUN — nada foi gravado nem enviado)' : ''}`);
        logger.info('='.repeat(60));
        logger.info(`Total     : ${resultados.length}`);
        if (dryRun) logger.info(`Simulados : ${contar('SIMULADO')}`);
        else logger.info(`Sucesso   : ${contar('SUCESSO')}`);
        logger.info(`Ignorados : ${contar('IGNORADO')}`);
        logger.info(`Erros     : ${contar('ERRO')}`);

        for (const r of resultados.filter(r => r.situacao === 'IGNORADO' || r.situacao === 'ERRO')) {
            logger.warn(`  ${r.situacao.padEnd(8)} Título ${r.idTitulo}: ${r.mensagem}`);
        }

        logger.info(`Relatório: ${arquivoJson}`);
        logger.info(`           ${arquivoCsv}`);
        logger.info('='.repeat(60));

        return { json: arquivoJson, csv: arquivoCsv };
    }
}

container.register(RelatorioService);
