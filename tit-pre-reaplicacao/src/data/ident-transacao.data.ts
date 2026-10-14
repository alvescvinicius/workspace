import { stringToNumber } from "../utils/parsers/string-to-number.js";

export class IdentTransacaoDTO {
    codigoSolicitacao: number | undefined;
    dataSolicitacao: string;
    idTitulo: number[] | number;
    idParceiro: number;
    protocoloAtendimentoParceiro: any;
    codigoSolicitacaoPagamento: number | undefined;

    constructor(
        idTitulo: number[] | number,
        codigoSolicitacao: number | undefined,
        dataSolicitacao: string,
        protocoloAtendimentoParceiro: any,
        idParceiro: number,
        idSolicitacaoPagamento: number | undefined
    ) {
        this.codigoSolicitacao = codigoSolicitacao;
        this.dataSolicitacao = dataSolicitacao;
        this.idTitulo = Array.isArray(idTitulo) ? idTitulo : stringToNumber(idTitulo);
        this.idParceiro = stringToNumber(idParceiro); // AGUARDANDO RETORNO DO ESQUADRÃO DE RESERVA/CONTABIL PARA REMOCAO OU NÃO DO CAMPO
        this.protocoloAtendimentoParceiro = protocoloAtendimentoParceiro ? stringToNumber(protocoloAtendimentoParceiro) : protocoloAtendimentoParceiro;
        this.codigoSolicitacaoPagamento = idSolicitacaoPagamento ? stringToNumber(idSolicitacaoPagamento) : undefined;
    }

    static retornaChavePagamento(filaMsg: any) {
        return new IdentTransacaoDTO(
            filaMsg.idTitulo,
            filaMsg.idSolicitacao,
            filaMsg.dataSolicitacaoResgate,
            filaMsg.protocoloAtendimentoParceiro,
            filaMsg.idParceiro,
            filaMsg.idSolicitacaoPagamento
        );
    }
}
