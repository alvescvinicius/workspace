import { container } from "../container/container.js";
import { SolicitacaoPagamentoReaplicacaoData } from "../data/solicitacao.data.js";
import { CAPITALIZACAO_DB } from "../database/database.js";

export class SolicitacaoRepository {

    #database = container.get(CAPITALIZACAO_DB);

    /**
     * Grava em SOL_SOLICITACAO_PAGAMENTO_TB os dados de pagamento como reaplicação,
     * do mesmo jeito que o rgt-batch-resgate-final faz para títulos de reaplicação:
     * forma de crédito = reaplicação, sem dados bancários, IR 0 e líquido = saldo.
     */
    async atualizaPagamentoComoReaplicacao(data: SolicitacaoPagamentoReaplicacaoData) {
        return await this.#database.update('SOL_SOLICITACAO_PAGAMENTO_TB', {
            updateValues: {
                CODIGO_FORMA_CREDITO: data.codFormaCredito,
                BANCO: '',
                AGENCIA: 0,
                AGENCIA_DV: null,
                CONTA: 0,
                CONTA_DV: null,
                DATA_ENVIO: data.dataEnvio,
                DATA_PREVISTA_PAGAMENTO: data.dataPrevistaPagamento,
                VALOR_IR: data.valorIr,
                VALOR_LIQUIDO: data.valorLiquido
            },
            where: {
                ID_SOLICITACAO_PAGAMENTO: data.idSolicitacaoPagamento
            },
            name: 'atualizaPagamentoComoReaplicacao'
        });
    }

    /** Atualiza CPF/CNPJ e tipo de pessoa da solicitação com os dados do titular. */
    async atualizaTitularSolicitacao(idSolicitacao: number, cpfCnpj: string | number, tipoPessoa: string) {
        return await this.#database.update('SOL_SOLICITACAO_TB', {
            updateValues: {
                CPF_CNPJ: cpfCnpj,
                TIPO_PESSOA: tipoPessoa
            },
            where: { ID_SOLICITACAO: idSolicitacao },
            name: 'atualizaTitularSolicitacao'
        });
    }
}

container.register(SolicitacaoRepository);
