/**
 * Dados do título + solicitação de resgate final.
 * Mesmos campos da query `obterTitulosPagamentoResgateFinal` do rgt-batch-resgate-final,
 * acrescidos do status do título e do status da solicitação para validação/relatório.
 */
export type TituloReaplicacaoData = {
    idTitulo: number;
    statusTitulo: string;
    dataFimVigencia: Date;
    idParceiro: number;
    idItemComercializacao: number;
    cpfCnpjTitular: number;
    cpfCnpjSubscritor: number;
    numTitulo: number;
    itensDaSorte: string;
    idPlano: number;
    idCanal: number;
    numSerie: string;
    protocoloAtendimento: any;
    nomeTitular: string;
    tipoPessoaTitular: string;
    nomeSubscritor: string;
    tipoPessoaSubscritor: string;
    ufResidencialTitular?: string;
    ufResidencialSubscritor?: string;
    valorPrimeiraParcela: number | null;
    idVenda: number;
    ufVenda: string;
    dataDebito: Date | null;
    indRenovacaoReaplicacaoAutomatica: string | null;
    idFormaPagamento: number | null;
    loginAprovacao?: string;

    idSolicitacao: number;
    idStatusSolicitacao: number;
    idSolicitacaoPagamento: number;
    dataSolicitacao: Date;
    saldoCapitalizado: number | null;
    valor: number | null;

    idSolicitacaoAlteracaoConta?: number | null;
};
