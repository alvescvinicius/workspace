import { container } from "../container/container.js";
import { TituloReaplicacaoData } from "../data/titulo.data.js";
import { CAPITALIZACAO_DB } from "../database/database.js";
import { getProperty } from "../properties/properties.js";

const properties = await getProperty('rgt-batch-resgate-final');

const listaStatusIgnorados = [
    properties.statusSolicitacao.CONCLUIDO.id,
    properties.statusSolicitacao.ERRO.id,
    properties.statusSolicitacao.CANCELADO_POR_GRAVAME.id,
    properties.statusSolicitacao.NAO_AUTORIZADA.id,
    properties.statusSolicitacao.NAO_PROCESSADO.id
];

export class TituloRepository {

    #database = container.get(CAPITALIZACAO_DB);

    /**
     * Mesma query de `obterTitulosPagamentoResgateFinal` do rgt-batch-resgate-final,
     * filtrando apenas pela lista de títulos informada (sem filtro de data, status do título,
     * parceiros ignorados ou limite), já que a lista é definida pelo usuário.
     *
     * Retorna somente títulos com solicitação RF em PAGAMENTO_PENDENTE ou PAGAMENTO_BLOQUEADO
     * e registro em SOL_SOLICITACAO_PAGAMENTO_TB.
     */
    async obterTitulosParaReaplicacao(titulos: number[]): Promise<TituloReaplicacaoData[]> {
        const sql = `
            SELECT
                tit.ID_TITULO as idTitulo,
                tit.STATUS as statusTitulo,
                tit.DATA_FIM_VIGENCIA as dataFimVigencia,
                tit.ID_PARCEIRO as idParceiro,
                tit.ID_ITEM_COMERCIALIZACAO as idItemComercializacao,
                tit.CPF_CNPJ_TITULAR as cpfCnpjTitular,
                tit.CPF_CNPJ_SUBSCRITOR as cpfCnpjSubscritor,
                tit.NUM_TITULO as numTitulo,
                ITENS_DA_SORTE as itensDaSorte,
                tit.ID_PLANO as idPlano,
                tit.ID_CANAL as idCanal,
                titSerie.NUM_SERIE as numSerie,
                ven.PROTOCOLO_ATENDIMENTO as protocoloAtendimento,
                tit.NOME_TITULAR as nomeTitular,
                tit.TIPO_PESSOA_TITULAR tipoPessoaTitular,
                tit.IND_REAPLICACAO_RENOVACAO as indRenovacaoReaplicacaoAutomatica,
                tit.NOME_SUBSCRITOR as nomeSubscritor,
                tit.TIPO_PESSOA_SUBSCRITOR tipoPessoaSubscritor,
                ven.UF_RESIDENCIAL_TITULAR as ufResidencialTitular,
                ven.UF_CORRESP_SUBSCRITOR as ufResidencialSubscritor,
                tit.VALOR_PRIMEIRA_PARCELA as valorPrimeiraParcela,
                ven.ID_REGISTRO_VENDA as idVenda,
                ven.UF_VENDA as ufVenda,
                ven.DATA_DEBITO as dataDebito,
                ven.ID_FORMA_PAGAMENTO as idFormaPagamento,
                pppt.LOGIN_APROVACAO as loginAprovacao,
                sst.ID_SOLICITACAO as idSolicitacao,
                sst.ID_STATUS_SOLICITACAO as idStatusSolicitacao,
                sspt.ID_SOLICITACAO_PAGAMENTO as idSolicitacaoPagamento,
                sst.DATA_SOLICITACAO as dataSolicitacao,
                sst.SALDO_CAPITALIZADO as saldoCapitalizado,
                sspt.VALOR as valor,
                sst2.ID_SOLICITACAO AS idSolicitacaoAlteracaoConta
            FROM
                TIT_TITULO_TB tit
            INNER JOIN
                TIT_SERIE_TB titSerie
                    ON tit.ID_SERIE = titSerie.ID_SERIE and titSerie.ID_PLANO = tit.ID_PLANO
            INNER JOIN
                VEN_REGISTRO_VENDA_TB ven
                    ON ven.ID_REGISTRO_VENDA = tit.ID_VENDA
            INNER JOIN
                SOL_SOLICITACAO_TB sst
                    ON sst.ID_TITULO = tit.ID_TITULO
                    AND sst.TP_SOLICITACAO = :tipoSolicitacao
                    AND sst.ID_STATUS_SOLICITACAO IN (:listaStatus)
            INNER JOIN
                SOL_SOLICITACAO_PAGAMENTO_TB sspt
                    ON sspt.ID_SOLICITACAO = sst.ID_SOLICITACAO
            LEFT JOIN
                PRD_PARCEIRO_PLANO_TB pppt
                    ON pppt.ID_PARCEIRO_PLANO = ven.ID_ITEM_COMERCIALIZACAO
            LEFT JOIN
                SOL_SOLICITACAO_TB sst2
                    ON sst2.ID_TITULO = tit.ID_TITULO
                    AND sst2.TP_SOLICITACAO = :tipoAlteracaoConta
                    AND sst2.ID_STATUS_SOLICITACAO NOT IN (:listaStatusIgnorados)
            WHERE
                tit.ID_TITULO IN (:titulos)
            ORDER BY tit.ID_TITULO asc
        `;

        return await this.#database.query<TituloReaplicacaoData>(sql, {
            tipoSolicitacao: properties.tiposSolicitacoes.RESGATE_FINAL,
            tipoAlteracaoConta: properties.tiposSolicitacoes.CONTA_DE_CREDITO,
            listaStatus: [
                properties.statusSolicitacao.PAGAMENTO_PENDENTE.id,
                properties.statusSolicitacao.PAGAMENTO_BLOQUEADO.id
            ],
            listaStatusIgnorados,
            titulos
        }, 'obterTitulosParaReaplicacao');
    }

    /** Marca o título como reaplicação (mesmo indicador lido pelo rgt-batch-resgate-final). */
    async marcarComoReaplicacao(idTitulo: number) {
        return await this.#database.update('TIT_TITULO_TB', {
            updateValues: { IND_REAPLICACAO_RENOVACAO: 'S' },
            where: { ID_TITULO: idTitulo },
            name: 'marcarComoReaplicacao'
        });
    }
}

container.register(TituloRepository);
