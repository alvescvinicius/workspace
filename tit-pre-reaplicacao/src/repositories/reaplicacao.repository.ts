import { container } from "../container/container.js";
import { CAPITALIZACAO_DB } from "../database/database.js";

/** Registro ativo (C = criado, E = em processamento, R = reaplicado) na TIT_REAPLICACAO_TB. */
export type ReaplicacaoAtiva = {
    status: 'C' | 'E' | 'R';
    reaplicaDataAtual: string | null;
    previaOrigem: string | null;
};

/**
 * Conteúdo gravado em REAPLICA_PREVIA_ORIGEM por esta aplicação: a mensagem enviada
 * ao pgt-registra-pagamento, num envelope com `origem` para diferenciar do JSON de prévia
 * gravado pelo fluxo de exceção antigo (tit-gera-json-previa).
 */
export type RegistroEnvioPagamento = {
    origem: string;
    enviadoEm: string;
    idSolicitacao: number;
    idSolicitacaoPagamento: number;
    messageId?: string;
    mensagem: unknown;
};

export type OrigemPrevia = 'VAZIA' | 'TIT_PRE_REAPLICACAO' | 'FLUXO_ANTIGO';

const CONTROLE_REAPLICACAO_INICIAL = JSON.stringify({
    criado: true,
    deParaCriado: false,
    clienteLocalizado: false,
    saldoAtualizadoObtido: false,
    enviadoParaGeracaoTitulo: false,
    tituloGerado: false,
    possuiGravame: false,
    possuiBloqueioJudicial: false
});

export class ReaplicacaoRepository {

    #database = container.get(CAPITALIZACAO_DB);

    async buscarReaplicacaoAtiva(idTitulo: number): Promise<ReaplicacaoAtiva | undefined> {
        const rows = await this.#database.query<ReaplicacaoAtiva>(`
            SELECT STATUS AS status,
                   REAPLICA_DATA_ATUAL AS reaplicaDataAtual,
                   REAPLICA_PREVIA_ORIGEM AS previaOrigem
            FROM TIT_REAPLICACAO_TB
            WHERE ID_TITULO = :idTitulo
              AND STATUS IN ('C', 'E', 'R')
            ORDER BY DATA_INCLUSAO DESC
            LIMIT 1
        `, { idTitulo }, 'buscarReaplicacaoAtiva');

        return rows[0];
    }

    /**
     * Insere o registro de reaplicação com STATUS = 'C' e REAPLICA_DATA_ATUAL = 'S'
     * (a reaplicação usa a data de hoje). Idempotente: não insere se já houver registro C, E ou R.
     *
     * Diferente do tit-prepara-reaplicacao-excecao, o vínculo é feito pelo ID_SOLICITACAO
     * (e não por ID_STATUS_SOLICITACAO = 2), para funcionar também com PAGAMENTO_BLOQUEADO.
     */
    async inserirReaplicacao(idTitulo: number, idSolicitacao: number): Promise<boolean> {
        const result: any = await this.#database.query(`
            INSERT INTO TIT_REAPLICACAO_TB (
                ID_TITULO,
                ID_VENDA,
                CONTROLE_REAPLICACAO,
                STATUS,
                SALDO_CAPITALIZADO,
                DATA_INCLUSAO,
                REAPLICA_DATA_ATUAL
            )
            SELECT
                s.ID_TITULO,
                t.ID_VENDA,
                :controleReaplicacao,
                'C',
                s.SALDO_CAPITALIZADO,
                NOW(),
                'S'
            FROM SOL_SOLICITACAO_TB s
            INNER JOIN TIT_TITULO_TB t ON t.ID_TITULO = s.ID_TITULO
            WHERE s.ID_SOLICITACAO = :idSolicitacao
              AND s.ID_TITULO = :idTitulo
              AND NOT EXISTS (
                  SELECT 1
                  FROM TIT_REAPLICACAO_TB r
                  WHERE r.ID_TITULO = s.ID_TITULO
                    AND r.STATUS IN ('C', 'E', 'R')
              )
        `, { idTitulo, idSolicitacao, controleReaplicacao: CONTROLE_REAPLICACAO_INICIAL }, 'inserirReaplicacao');

        return (result?.affectedRows ?? 0) > 0;
    }

    /**
     * Identifica quem preencheu REAPLICA_PREVIA_ORIGEM:
     *  - VAZIA: ninguém (título nunca passou pelo fluxo antigo nem por esta aplicação);
     *  - TIT_PRE_REAPLICACAO: envelope gravado por esta aplicação (mensagem já enviada);
     *  - FLUXO_ANTIGO: qualquer outro conteúdo (JSON de prévia do tit-gera-json-previa).
     */
    static identificarOrigemPrevia(previaOrigem: string | null | undefined, origemAplicacao: string): OrigemPrevia {
        if (!previaOrigem || previaOrigem.trim() === '') return 'VAZIA';
        try {
            const json = JSON.parse(previaOrigem);
            return json?.origem === origemAplicacao ? 'TIT_PRE_REAPLICACAO' : 'FLUXO_ANTIGO';
        } catch {
            return 'FLUXO_ANTIGO';
        }
    }

    /** Grava em REAPLICA_PREVIA_ORIGEM a mensagem enviada ao pgt-registra-pagamento (registro C). */
    async registrarEnvioPagamento(idTitulo: number, registro: RegistroEnvioPagamento) {
        return await this.#database.update('TIT_REAPLICACAO_TB', {
            updateValues: { REAPLICA_PREVIA_ORIGEM: JSON.stringify(registro) },
            where: { ID_TITULO: idTitulo, STATUS: 'C' },
            name: 'registrarEnvioPagamento'
        });
    }

    /**
     * Para um registro já existente com STATUS = 'C', garante saldo da solicitação
     * e REAPLICA_DATA_ATUAL = 'S'.
     */
    async alinharReaplicacaoCriada(idTitulo: number, saldoCapitalizado: number) {
        return await this.#database.update('TIT_REAPLICACAO_TB', {
            updateValues: {
                SALDO_CAPITALIZADO: saldoCapitalizado,
                REAPLICA_DATA_ATUAL: 'S'
            },
            where: { ID_TITULO: idTitulo, STATUS: 'C' },
            name: 'alinharReaplicacaoCriada'
        });
    }
}

container.register(ReaplicacaoRepository);
