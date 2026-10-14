export const USUARIO_APLICACAO = "tit-pre-reaplicacao";

export const NOME_FILA_PAGAMENTO = "filaResgateFinalPagamento";

/** Valor de `origem` no envelope gravado em TIT_REAPLICACAO_TB.REAPLICA_PREVIA_ORIGEM. */
export const ORIGEM_REGISTRO_ENVIO = "tit-pre-reaplicacao";

/** Mesma action usada pelo rgt-batch-resgate-final para atualizar o status da solicitação. */
export const ACAO_ATUALIZA_STATUS_SOLICITACAO = 'atualizaStatusSolicitacao';

export const GRAVA_NOTIFICACAO = {
    ERRO: 0,
    OK: 1
} as const;

export const DATE_FORMAT = {
    DATA_SOMENTE: "YYYY-MM-DD",
    PADRAO: "YYYY-MM-DD HH:mm:ss",
} as const;
