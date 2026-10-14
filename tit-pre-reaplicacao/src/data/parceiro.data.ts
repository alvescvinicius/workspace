export type ParceiroData = {
  idParceiro: number
  nome: string
  cnpj: string
  razaoSocial: any
  inscricaoEstadual: any
  inscricaoMunicipal: any
  tipoParceiro: number
  ativoParceiro: string
  matrizOuFilial: string
  historicoStatus: any
  statusCadastro: string
  idBalcao: number
  chaveParceiro: string
  regraParceiro: string
  dataInclusao: any
  dataAlteracao: string
  usuario: any
  enderecos: Array<any>
  itensComercializacao: Array<{
    inicioComercializacao: string
    fimComercializacao?: string
    dataAprovacao: string
    dataElaboracao: string
    dataInclusao: string
    dataAlteracao?: string
    idParceiroPlano: number
    idParceiro: number
    idPlano: number
    nomeItemComercializacao: string
    idProduto: number
    codStatus: string
    idFamiliaProduto: number
    loginAprovacao: string
    loginElaboracao: string
    indClienteSorte?: string
    idModalidadeSorteio?: number
    formatoPremiacao?: string
    valorPremiacao?: number
    usuario: string
    CobrancaClientes: Array<{
      dataInclusao: string
      dataAlteracao?: string
      idCobrancaCliente: number
      idParceiroPlano: number
      permiteAgendamento: string
      quantidadeAgendamento?: number
      possuiTeimosinha: string
      quantidadeTentativas?: number
      tipoCustoCobranca: string
      custoCobranca: number
      usuario: string
      parceiroCanal: {
        idParceiroCanal: number
        canal: {
          idCanal: number
          descCanalVenda: string
        }
      }
      formaPagamento: {
        idFormaPagamento: number
        codFormaPagamento: string
        descFormaPagamento: string
      }
    }>
  }>
  dadosBancarios: Array<any>
  contatos: Array<any>
  balcao: {
    idBalcao: number
    descricao: string
  }
  parceiroCanals: Array<{
    idParceiroCanal: number
    canal: {
      idCanal: number
      descCanalVenda: string
    }
    valores: Array<{
      idValores: number
      valor: number
      tipoValor: string
      valorMaximoTicket?: number
      idParceiroCanal: number
      dataInclusao: string
      dataAlteracao?: string
      usuario: string
    }>
  }>
  acordoOperacionalParceiro: {
    valorMinimoComissao: any
  }
};
