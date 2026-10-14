/** Mesmo formato do SolicitacaoData do rgt-batch-resgate-final (entrada do createMensagemFilaPgto). */
export type SolicitacaoData = {
    idSolicitacao: number;
    idSolicitacaoPagamento: number;

    idTitulo: number;
    dataSolicitacaoResgate: string;
    cpfCnpj: string | number;
    codTipoAtendimento: number;
    codFormaCredito: number;
    codBanco: string;
    numeroAgencia: number;
    codDvAgencia: string | null;
    numeroConta: number;
    codDvConta: string | null;
    protocoloAtendimento: any;
    idParceiro: number;
    tipoPessoa: string;
    idCanalSolicitacao: number;
    nomeCliente: string;
    reaplicacao: boolean;
    dataPrevisaoReaplicacao: string | null;
    dataFimVigencia: string;
    saldoCapitalizado: number;
    percIsencao: number;
};

export type SolicitacaoPagamentoReaplicacaoData = {
    idSolicitacaoPagamento: number;
    codFormaCredito: number;
    dataEnvio: string;
    dataPrevistaPagamento: string;
    valorIr: number;
    valorLiquido: number;
};
