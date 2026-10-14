export type PlanoData = {
    historicoStatus?: Array<{
        data: string
        codStatus: string
        usuario: string
    }>
    caracteristicasGerais: {
        menorNumeroSorte?: number
        reajustePremioSorteio: {
            descricaoIndicador?: string
            reajustePorParcelaPaga: boolean
            idIndicadorReajuste?: number
            periodoReajusteEmMeses?: number
            reajustePremio: boolean
            indicador?: {
                defasagem: number
                codigo: string
                dataInicioCotacao: string
                indAutomatizado: string
                idIndicadorBase: any
                dataInclusao: string
                usuario: string
                id: any
                perJurosDerivado: any
                regraPoupanca: number
                codigoBacen: any
                descricao: string
            }
        }
        idBancaRisco?: number
        dataAprovacaoSusep: string
        idRegraCombinacao?: number
        numeroProcessoSusep: string
        tamanhoSerie: number
        idModalidadePlano: number
        nomePlano: string
        quantidadeParcelas: number
        quantidadeModalidadesSorteios: number
        prorrogaVigencia: boolean
        linkCondicoesGerais: string
        descModalidadePlano: string
        codTipoPlano: string
        maiorNumeroSorte?: number
        qtdNumeroSorteCombinacao?: number
        valorMaximoParcela: number
        moraPorAtraso: {
            pagamentoResgate: boolean
            pagamentoSorteio: boolean
            jurosPorDiaAtrasado: boolean
            periodicidadeTaxaJuros: string
            taxaJuros: number
            tipoDiaContagem: string
            diasLimiteAtraso: number
        }
        codFipSusep: number
        descricao: any
        percentualDevolucaoModalidade: number
        prazoCaducidade?: number
        valorMinimoParcela: number
        prazoCapitalizacao: number
        descTipoPlano: string
        idPlanoSAP: number
        idTipoPlano: number
        reajusteParcela: {
            descricaoIndicador?: string
            periodoReajuste?: number
            idIndicadorReajuste?: number
            planoReajustaParcela?: boolean
            defasagemDoIndicador?: number
            reducaoParcela?: boolean
        }
        serieInicial: any
        codModalidadeBB: any
        codProdutoBB: any
        maxMesesProrrogaVigencia?: number
        serieGestaoExcecaoDtFixa?: string
        serieGestaoExcecaoToggle?: boolean
        serieGestaoExcecao?: string
        dataFimVigencia?: string
        tituloGeradoExternamente?: string
        apuracaoSorteioExterno?: string
        erroVigenciaMaiorIgualParcelas?: boolean
        erroVigenciaPagamentoMensal?: boolean
        seriePossuiTituloFisico?: string
        serieQtdTituloFisico?: number
        frequenciaCaducidade?: number
    }
    quotas: Array<{
        parcelaFinal: number
        parcelaInicial: number
        percentuais: Array<{
            descQuotaRateio: string
            idTipoQuotaRateio: number
            indTipoQuotaRateio: string
            percentual: number
        }>
    }>
    descStatus: string
    idPlano: number
    provisoes: Array<{
        parcelas: Array<{
            idRateioQuota: number
            descRateioQuota: string
            idModalidadeSorteio?: number
            percentualAporte: number
            parcelaInicial: number
            parcelaFinal: number
            descModalidadeSorteio: string
            indTipoQuotaRateio: string
            percentualBaixa: number
        }>
        descricaoTipoProvisao: string
        descricaoIndicadorCapitalizacao: string
        indicadorAtualizacaoProvisao?: number
        idTipoProvisao: number
        indicadorCapitalizacaoProvisao?: number
        descricaoIndicadorAtualizacao: string
        prazoCorrecao?: string
        taxaJurosProrata?: number
    }>
    dataUltimaAlteracao?: string
    id: string
    codStatus: string
    dataAprovacao?: string
    sorteios: Array<{
        maximoItemSorte?: number
        regraPremiacao: Array<{
            calculo: {
                valorMultiploSorteio: any
                qtdNumerosContemplados: number
                chancePremiacao: number
                operacao?: string
                valorOperacao?: number
            }
            parcelaInicialMultiplo: number
            parcelaFinalMultiplo: number
        }>
        selecaoNumeros?: Array<number>
        descTipoSorteio: string
        idTipoSorteio: number
        idModalidadeSorteio?: number
        quantidadeSorteios?: number
        periodicidade: {
            numeroInicialMesVigencia?: number
            diaSemana?: number
            tipoMesVigencia?: string
            numeroFinalMesVigencia?: number
            meses: Array<number>
            quantidadeFrequencia?: number
            frequencia?: string
            id: any
            descricao?: string
            qtdMesRelacaoAquisicao?: number
        }
        descModalidadeSorteio: string
        algoritmoEspecial?: Array<{
            posicaoNumeroPremio: number
            valor?: number
            valorSubstituicao: number
            variacao: string
        }>
        sorteioAlgoritmoEspecial?: boolean
        contemplacaoObrigatoria?: {
            indContemplacaoObrigatoria?: string
            calculo: {
                valorMultiploSorteio: any
                qtdNumerosContemplados?: number
                operacao?: string
                valorOperacao?: number
            }
            minimoTitulosContemplacaoObrigatoria?: number
        }
        valorMaximoSorteio?: number
    }>
    resgates: {
        resgateFinal: {
            idResgate: number
            codigo: string
            descricao: string
        }
        resgateAntecipado?: {
            carenciaMesesVigencia: number
            penalizacao?: Array<{
                percentual: number
                parcelaMesFim: number
                parcelaMesinicio: number
            }>
            codigo: string
            idResgate: number
            descricao: string
            carenciaPagamentos?: number
        }
        resgateCompulsorio?: {
            idResgate: number
            codigo: string
            descricao: string
        }
        resgateParcial?: {
            formatoLimiteMaximo: string
            codigo: string
            valorLimiteMinimo: number
            idResgate: number
            meses: Array<number>
            carenciaMesesVigencia: number
            quantidadeIntervalo: number
            formatoIntervaloResgates: string
            valorLimiteMaximo: number
            formatoLimiteMinimo: string
            carenciaPagamentos: number
            descricao: string
        }
    }
    usuarioInstituidor?: string
    idModalidadePlano: any
}