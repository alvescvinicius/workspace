import { readFileSync } from "node:fs";

export type Argumentos = {
    titulos: number[];
    dryRun: boolean;
};

function valorDoArgumento(args: string[], nome: string): string | undefined {
    const comIgual = args.find(arg => arg.startsWith(`--${nome}=`));
    if (comIgual) return comIgual.slice(`--${nome}=`.length);

    const indice = args.indexOf(`--${nome}`);
    return indice >= 0 ? args[indice + 1] : undefined;
}

/** Aceita JSON (`[1,2,3]`) ou lista separada por vírgula, espaço, ponto e vírgula ou quebra de linha. */
function parseLista(entrada: string): number[] {
    const texto = entrada.trim();
    let valores: unknown[];

    if (texto.startsWith('[')) {
        const json = JSON.parse(texto);
        if (!Array.isArray(json)) throw new Error('A lista de títulos em JSON deve ser um array.');
        valores = json;
    } else {
        valores = texto.split(/[\s,;]+/).filter(Boolean);
    }

    const ids = valores.map(v => Number(v));
    const invalidos = valores.filter((_, i) => !Number.isSafeInteger(ids[i]) || ids[i] <= 0);
    if (invalidos.length > 0) throw new Error(`IDs de título inválidos: ${invalidos.join(', ')}`);

    return [...new Set(ids)];
}

/**
 * Ordem de prioridade da lista de títulos:
 *   --titulos=1,2,3  |  --arquivo=titulos.txt  |  variável TITULOS_REAPLICACAO
 */
export function lerArgumentos(args: string[]): Argumentos {
    const dryRun = args.includes('--dry-run') || process.env.DRY_RUN === 'true';

    const titulosArg = valorDoArgumento(args, 'titulos');
    const arquivoArg = valorDoArgumento(args, 'arquivo');

    const entrada = titulosArg
        ?? (arquivoArg ? readFileSync(arquivoArg, 'utf-8') : undefined)
        ?? process.env.TITULOS_REAPLICACAO;

    if (!entrada || entrada.trim().length === 0) {
        throw new Error(
            "Informe os títulos: --titulos=123,456 | --arquivo=titulos.txt | TITULOS_REAPLICACAO='[123,456]'"
        );
    }

    const titulos = parseLista(entrada);
    if (titulos.length === 0) throw new Error('Informe ao menos um ID de título.');

    return { titulos, dryRun };
}
