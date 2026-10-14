import dayjs from "dayjs";
import { stringToNumber } from "../utils/parsers/string-to-number.js";
import { getProperty } from "../properties/properties.js";
import { IdentTransacaoDTO } from "./ident-transacao.data.js";
import { SolicitacaoData } from "./solicitacao.data.js";
import { TituloReaplicacaoData } from "./titulo.data.js";
import { ParceiroData } from "./parceiro.data.js";
import { PlanoData } from "./plano.data.js";

const properties = await getProperty('rgt-batch-resgate-final');

/**
 * Mensagem da fila de pagamento de resgate final.
 * Cópia do `createMensagemFilaPgto` do rgt-batch-resgate-final, para que o consumidor
 * (pgt-registra-pagamento) receba o mesmo contrato do fluxo normal.
 *
 * Única diferença: NÃO envia `dataMandatoria`. No pgt-registra-pagamento ela tem prioridade
 * sobre a `dataPrevisaoReaplicacao` (e recusa se for anterior a hoje); na reaplicação por
 * exceção a data de pagamento tem que ser a de hoje.
 */
export type MensagemFilaPgtoDTO = {
    codBanco: string | null;
    codDvAgencia: string | null;
    codDvConta: string | null;
    variacaoPoupanca: string | null;
    agenciaContaDv: string | null;
    codFormaCredito: number;
    codIdentEmpresa: string;
    codIdentTransacao: IdentTransacaoDTO;
    cpfCnpj: number;
    corretor: { nomeCorretor: string; cnpj: number | null; };
    dataBaixa: string;
    dataDebito: string | null;
    dataEfetivacao: string;
    idCanal: number;
    idFormaPagamento: number | null;
    idItem: number;
    idOcorrencia: number | null;
    idParceiro: number | null;
    idPlano: number | null;
    idVenda: number | null;
    idTitulo: number | null;
    itensDaSorte: string | null;
    nomeCliente: string;
    nomeParceiro: string;
    nomePlano: string;
    numAgencia: number | null;
    numConta: number | null;
    numSerie: string;
    numTitulo: number | null;
    numeroTitulo: number | null;
    numTituloSerie: string | null;
    percentualIsencao: number;
    tipoCompromisso: number;
    tipoPessoa: string;
    tipoPlano: string;
    tipoSolicitacao: string;
    ufResidencial: string | null;
    valor: number | null;
    valorAplicado: number | null;
    valorBaixaPI: number | null;
    valorBase: number | null;
    valorBasePI: number | null;
    ufVenda: string;
    cpfCnpjSubscritor: string | number;
    nomeSubscritor: string;
    tipoPessoaSubscritor: string;
    ufResidencialSubscritor: string;
    cpfCnpjTitular: string | number;
    nomeTitular: string;
    tipoPessoaTitular: string;
    ufResidencialTitular: string;
    usuarioAprovador: string;
    saldoCapitalizado: number;
    valorPenalidade: number;
    percentualPenalidade: number;
    reaplicacao: boolean;
    dataPrevisaoReaplicacao: string | null;
};

export function createMensagemFilaPgto(dto: SolicitacaoData, titulo: TituloReaplicacaoData, parceiro: ParceiroData, plano: PlanoData): MensagemFilaPgtoDTO {
    const dtoChavePagamento = new IdentTransacaoDTO(
        titulo.idTitulo,
        dto.idSolicitacao,
        dto.dataSolicitacaoResgate,
        titulo.protocoloAtendimento,
        titulo.idParceiro,
        dto.idSolicitacaoPagamento
    );

    return {
        codBanco: dto.codBanco ? dto.codBanco.toString() : null,
        codDvAgencia: dto.codDvAgencia ? dto.codDvAgencia.toString() : null,
        codDvConta: dto.codDvConta ? dto.codDvConta.toString() : null,
        codFormaCredito: dto.codFormaCredito,
        codIdentEmpresa: "BRCAP",
        codIdentTransacao: dtoChavePagamento,
        cpfCnpj: stringToNumber(dto.cpfCnpj),
        corretor: {
            nomeCorretor: parceiro.nome,
            cnpj: stringToNumber(parceiro.cnpj)
        },
        dataBaixa: dayjs.utc(titulo.dataFimVigencia).format('YYYY-MM-DD'),
        dataDebito: titulo.dataDebito ? dayjs.utc(titulo.dataDebito).format('YYYY-MM-DD') : null,
        dataEfetivacao: dto.dataSolicitacaoResgate,
        idCanal: stringToNumber(titulo.idCanal),
        idFormaPagamento: titulo.idFormaPagamento ? stringToNumber(titulo.idFormaPagamento) : null,
        idItem: stringToNumber(titulo.idItemComercializacao),
        idOcorrencia: null,
        idParceiro: stringToNumber(titulo.idParceiro),
        idPlano: stringToNumber(titulo.idPlano),
        idVenda: stringToNumber(titulo.idVenda),
        idTitulo: stringToNumber(titulo.idTitulo),
        itensDaSorte: titulo.itensDaSorte,
        nomeCliente: dto.nomeCliente,
        nomeParceiro: parceiro.nome,
        nomePlano: plano.caracteristicasGerais.nomePlano,
        numAgencia: stringToNumber(dto.numeroAgencia),
        numConta: stringToNumber(dto.numeroConta),
        numSerie: titulo.numSerie,
        numTitulo: stringToNumber(titulo.numTitulo),
        numeroTitulo: stringToNumber(titulo.numTitulo),
        numTituloSerie: titulo.numSerie,
        percentualIsencao: stringToNumber(dto.percIsencao, "float"),
        tipoCompromisso: properties.tiposCompromissoPagamento.RESGATE_FINAL,
        tipoPessoa: dto.tipoPessoa,
        tipoPlano: plano.caracteristicasGerais.codTipoPlano,
        tipoSolicitacao: properties.tiposSolicitacoes.RESGATE_FINAL,
        ufResidencial: titulo.ufResidencialTitular!,
        valor: stringToNumber(dto.saldoCapitalizado, "float"),
        valorAplicado: stringToNumber(titulo.valorPrimeiraParcela!, "float"),
        valorBaixaPI: null,
        valorBase: stringToNumber(dto.saldoCapitalizado, "float"),
        valorBasePI: null,
        ufVenda: titulo.ufVenda,
        cpfCnpjSubscritor: stringToNumber(titulo.cpfCnpjSubscritor),
        nomeSubscritor: titulo.nomeSubscritor,
        tipoPessoaSubscritor: titulo.tipoPessoaSubscritor,
        ufResidencialSubscritor: titulo.ufResidencialSubscritor!,
        cpfCnpjTitular: stringToNumber(titulo.cpfCnpjTitular),
        nomeTitular: titulo.nomeTitular,
        tipoPessoaTitular: titulo.tipoPessoaTitular,
        ufResidencialTitular: titulo.ufResidencialTitular!,
        usuarioAprovador: titulo.loginAprovacao!,
        saldoCapitalizado: dto.saldoCapitalizado,
        valorPenalidade: 0,
        percentualPenalidade: 0,
        reaplicacao: dto.reaplicacao,
        dataPrevisaoReaplicacao: dto.dataPrevisaoReaplicacao,

        variacaoPoupanca: null,
        agenciaContaDv: null,
    };
}
