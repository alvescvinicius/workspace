export type SituacaoTitulo =
    | 'SUCESSO'          // preparado, mensagem enviada e solicitação em andamento
    | 'SIMULADO'         // --dry-run: nada foi gravado nem publicado
    | 'IGNORADO'         // não elegível (motivo em `mensagem`)
    | 'ERRO';            // falha durante o processamento (motivo em `mensagem`)

export type ResultadoTitulo = {
    idTitulo: number;
    situacao: SituacaoTitulo;
    mensagem?: string;

    idSolicitacao?: number;
    idSolicitacaoPagamento?: number;
    saldoCapitalizado?: number;
    reaplicacaoInserida?: boolean;
    mensagemJaEnviada?: boolean;
    messageId?: string;
    etapaConcluida?: 'VALIDACAO' | 'PREPARACAO' | 'ENVIO' | 'STATUS';

    /** Mensagem montada (preenchida sempre no --dry-run). */
    mensagemFila?: unknown;
};
