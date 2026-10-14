/**
 * Subconjunto da property `rgt-batch-resgate-final` usado por esta aplicação.
 * A chave é reaproveitada para manter as mesmas URLs, tópicos e códigos do fluxo normal de resgate final.
 */
export type RgtBatchResgateFinalProperty = {
    urls: {
        parceiro: string;
        planos: string;
        solicitacoes: string;
    };
    topicArn: {
        resgateFinalPagamento: string;
    };
    formaCredito: {
        reaplicacao: number;
    };
    tiposSolicitacoes: {
        RESGATE_FINAL: string;
        CONTA_DE_CREDITO: string;
    };
    tiposCompromissoPagamento: {
        RESGATE_FINAL: number;
    };
    tipoAtendimento: {
        REGISTRO_SEM_PENDENCIAS: number;
    };
    canalSolicitacao: {
        BB: number;
    };
    statusSolicitacao: {
        ANDAMENTO: { id: number };
        PAGAMENTO_PENDENTE: { id: number };
        PAGAMENTO_BLOQUEADO: { id: number };
        CONCLUIDO: { id: number };
        ERRO: { id: number };
        CANCELADO_POR_GRAVAME: { id: number };
        NAO_AUTORIZADA: { id: number };
        NAO_PROCESSADO: { id: number };
    };
};
