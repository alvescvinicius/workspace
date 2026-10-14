import dayjs from "dayjs";
import { Concurrency } from "@brcap/concurrency";
import { container } from "../container/container.js";
import { CAPITALIZACAO_DB } from "../database/database.js";
import { createMensagemFilaPgto } from "../data/mensagem-filas.data.js";
import { ResultadoTitulo } from "../data/resultado.data.js";
import { SolicitacaoData } from "../data/solicitacao.data.js";
import { TituloReaplicacaoData } from "../data/titulo.data.js";
import { getProperty } from "../properties/properties.js";
import { CONCURRENCY, CONCURRENCY_INTERVAL } from "../properties/server-settings.js";
import { DATE_FORMAT, ORIGEM_REGISTRO_ENVIO } from "../properties/static.js";
import { ReaplicacaoRepository } from "../repositories/reaplicacao.repository.js";
import { SolicitacaoRepository } from "../repositories/solicitacao.repository.js";
import { TituloRepository } from "../repositories/titulo.repository.js";
import { createRequestContext, getLogger } from "../utils/logger.js";
import { NotificacaoService } from "./notificacao.service.js";
import { ParceiroService } from "./parceiro.service.js";
import { PlanoService } from "./plano.service.js";
import { SolicitacaoService } from "./solicitacao.service.js";

const properties = await getProperty('rgt-batch-resgate-final');
const logger = getLogger('PreReaplicacaoService');

export type OpcoesExecucao = {
    dryRun: boolean;
};

/**
 * Prepara títulos para reaplicação por exceção e envia a mensagem de pagamento
 * de resgate final como reaplicação. A partir daí o consumidor da fila de pagamento
 * segue o fluxo normal (contabilização e tributos) e o tit-batch-reaplicacao
 * processa o registro criado na TIT_REAPLICACAO_TB.
 *
 * Etapas por título:
 *   1. Validação  — solicitação RF pendente/bloqueada, saldo e 1ª parcela, reaplicação em andamento
 *                   e trava para títulos do fluxo de exceção antigo (REAPLICA_PREVIA_ORIGEM com prévia).
 *   2. Preparação — (transação) IND_REAPLICACAO_RENOVACAO='S', SOL_PGT como reaplicação,
 *                   insert na TIT_REAPLICACAO_TB (C, REAPLICA_DATA_ATUAL='S').
 *   3. Envio      — mensagem na filaResgateFinalPagamento com reaplicacao=true (pula se já enviada)
 *                   e registro da mensagem enviada em TIT_REAPLICACAO_TB.REAPLICA_PREVIA_ORIGEM.
 *   4. Status     — solicitação em ANDAMENTO, como o fluxo normal.
 *
 * A regra de gravame NÃO é aplicada (definição da reaplicação por exceção).
 */
export class PreReaplicacaoService {

    #database = container.get(CAPITALIZACAO_DB);
    #tituloRepository = container.get(TituloRepository);
    #solicitacaoRepository = container.get(SolicitacaoRepository);
    #reaplicacaoRepository = container.get(ReaplicacaoRepository);
    #parceiroService = container.get(ParceiroService);
    #planoService = container.get(PlanoService);
    #solicitacaoService = container.get(SolicitacaoService);
    #notificacaoService = container.get(NotificacaoService);

    async executar(titulosInformados: number[], opcoes: OpcoesExecucao): Promise<ResultadoTitulo[]> {
        const registros = await this.#tituloRepository.obterTitulosParaReaplicacao(titulosInformados);

        // Agrupa por título para detectar mais de uma solicitação RF pendente/bloqueada.
        const porTitulo = new Map<number, TituloReaplicacaoData[]>();
        for (const registro of registros) {
            const id = Number(registro.idTitulo);
            porTitulo.set(id, [...(porTitulo.get(id) ?? []), registro]);
        }

        const resultados: ResultadoTitulo[] = [];

        for (const idTitulo of titulosInformados) {
            const encontrados = porTitulo.get(idTitulo) ?? [];
            if (encontrados.length === 0) {
                resultados.push({
                    idTitulo,
                    situacao: 'IGNORADO',
                    mensagem: 'Título sem solicitação de resgate final em PAGAMENTO_PENDENTE/PAGAMENTO_BLOQUEADO com solicitação de pagamento.'
                });
            } else if (encontrados.length > 1) {
                resultados.push({
                    idTitulo,
                    situacao: 'ERRO',
                    mensagem: `Título possui ${encontrados.length} solicitações RF elegíveis (${encontrados.map(e => e.idSolicitacao).join(', ')}). Tratar manualmente.`
                });
            }
        }

        const elegiveis = [...porTitulo.values()].filter(lista => lista.length === 1).map(lista => lista[0]);
        logger.info(`Títulos informados: ${titulosInformados.length} | com solicitação elegível: ${elegiveis.length}`);

        await Concurrency.forEach<TituloReaplicacaoData>({
            maxConcurrency: CONCURRENCY.EXECUTION,
            concurrencyInterval: CONCURRENCY_INTERVAL.EXECUTION,
            input: elegiveis,
            task: async (titulo) => createRequestContext(async () => {
                resultados.push(await this.#processarTitulo(titulo, opcoes));
            }, `pre-reaplicacao-tit-${titulo.idTitulo}`)
        });

        // Mantém a ordem informada pelo usuário no relatório.
        const ordem = new Map(titulosInformados.map((id, i) => [id, i]));
        return resultados.sort((a, b) => (ordem.get(a.idTitulo) ?? 0) - (ordem.get(b.idTitulo) ?? 0));
    }

    async #processarTitulo(titulo: TituloReaplicacaoData, { dryRun }: OpcoesExecucao): Promise<ResultadoTitulo> {
        const idTitulo = Number(titulo.idTitulo);
        const base: Pick<ResultadoTitulo, 'idTitulo' | 'idSolicitacao' | 'idSolicitacaoPagamento' | 'saldoCapitalizado'> = {
            idTitulo,
            idSolicitacao: titulo.idSolicitacao,
            idSolicitacaoPagamento: titulo.idSolicitacaoPagamento,
            saldoCapitalizado: titulo.saldoCapitalizado ?? undefined
        };
        let etapaConcluida: ResultadoTitulo['etapaConcluida'];

        try {
            // ---------------------------------------------------------------
            // 1. Validação
            // ---------------------------------------------------------------
            const ignorar = (mensagem: string): ResultadoTitulo => {
                logger.warn(`Título ${idTitulo} ignorado: ${mensagem}`);
                return { ...base, situacao: 'IGNORADO', mensagem };
            };

            if (titulo.saldoCapitalizado === null || typeof titulo.saldoCapitalizado === 'undefined')
                return ignorar('SALDO_CAPITALIZADO da solicitação não preenchido.');

            if (titulo.valorPrimeiraParcela === null || typeof titulo.valorPrimeiraParcela === 'undefined')
                return ignorar('VALOR_PRIMEIRA_PARCELA do título não preenchido.');

            const reaplicacaoAtiva = await this.#reaplicacaoRepository.buscarReaplicacaoAtiva(idTitulo);
            if (reaplicacaoAtiva && reaplicacaoAtiva.status !== 'C')
                return ignorar(`Já existe reaplicação com STATUS='${reaplicacaoAtiva.status}' na TIT_REAPLICACAO_TB.`);

            // Trava do fluxo de exceção antigo: REAPLICA_PREVIA_ORIGEM com JSON de prévia
            // (tit-gera-json-previa) indica saldo já atualizado e AP de tributos já enviado.
            // Reenviar ao pgt-registra-pagamento dobraria a correção e os tributos.
            const origemPrevia = ReaplicacaoRepository.identificarOrigemPrevia(
                reaplicacaoAtiva?.previaOrigem,
                ORIGEM_REGISTRO_ENVIO
            );
            if (origemPrevia === 'FLUXO_ANTIGO')
                return ignorar('Processado pelo fluxo de exceção antigo (REAPLICA_PREVIA_ORIGEM com prévia gerada pelo tit-gera-json-previa). Tratar manualmente.');

            const [parceiro, plano] = await Promise.all([
                this.#parceiroService.buscarParceiro(titulo.idParceiro),
                this.#planoService.buscarPlano(titulo.idPlano)
            ]);
            if (!parceiro) throw new Error(`Parceiro ${titulo.idParceiro} não encontrado.`);
            if (!plano) throw new Error(`Plano ${titulo.idPlano} não encontrado.`);

            const avisos: string[] = [];
            if (titulo.idSolicitacaoAlteracaoConta)
                avisos.push(`Possui alteração de conta de crédito pendente (sol. ${titulo.idSolicitacaoAlteracaoConta}) — não impede a reaplicação.`);

            // ---------------------------------------------------------------
            // Montagem dos dados (mesmos valores do fluxo normal para reaplicação,
            // com a data de hoje por ser REAPLICA_DATA_ATUAL = 'S').
            // ---------------------------------------------------------------
            const hoje = dayjs().format(DATE_FORMAT.DATA_SOMENTE);
            const saldo = Number(titulo.saldoCapitalizado);
            const codFormaCredito = properties.formaCredito.reaplicacao;

            const informacoesSolicitacao: SolicitacaoData = {
                idSolicitacao: titulo.idSolicitacao,
                idSolicitacaoPagamento: titulo.idSolicitacaoPagamento,
                idTitulo,
                dataSolicitacaoResgate: hoje,
                cpfCnpj: titulo.cpfCnpjTitular,
                codTipoAtendimento: properties.tipoAtendimento.REGISTRO_SEM_PENDENCIAS,
                codFormaCredito,
                codBanco: '',
                numeroAgencia: 0,
                codDvAgencia: null,
                numeroConta: 0,
                codDvConta: null,
                protocoloAtendimento: titulo.protocoloAtendimento,
                idParceiro: titulo.idParceiro,
                tipoPessoa: titulo.tipoPessoaTitular,
                idCanalSolicitacao: properties.canalSolicitacao.BB,
                nomeCliente: titulo.nomeTitular,
                reaplicacao: true,
                dataPrevisaoReaplicacao: hoje,
                dataFimVigencia: dayjs.utc(titulo.dataFimVigencia).format(DATE_FORMAT.DATA_SOMENTE),
                saldoCapitalizado: saldo,
                percIsencao: 0
            };

            const mensagemFila = createMensagemFilaPgto(informacoesSolicitacao, titulo, parceiro, plano);
            etapaConcluida = 'VALIDACAO';

            const mensagemJaEnviadaAntes = async () =>
                origemPrevia === 'TIT_PRE_REAPLICACAO'
                || await this.#notificacaoService.mensagemJaEnviada(titulo.idSolicitacao);

            if (dryRun) {
                const mensagemJaEnviada = await mensagemJaEnviadaAntes();
                return {
                    ...base,
                    situacao: 'SIMULADO',
                    mensagem: [
                        reaplicacaoAtiva ? 'TIT_REAPLICACAO_TB já possui registro C (seria reaproveitado).' : 'Registro na TIT_REAPLICACAO_TB seria inserido.',
                        mensagemJaEnviada ? 'Mensagem já enviada anteriormente (não seria reenviada).' : 'Mensagem seria enviada.',
                        ...avisos
                    ].join(' '),
                    mensagemJaEnviada,
                    etapaConcluida,
                    mensagemFila
                };
            }

            // ---------------------------------------------------------------
            // 2. Preparação (transação)
            // ---------------------------------------------------------------
            let reaplicacaoInserida = false;
            await this.#database.transaction(async () => {
                await this.#tituloRepository.marcarComoReaplicacao(idTitulo);
                await this.#solicitacaoRepository.atualizaPagamentoComoReaplicacao({
                    idSolicitacaoPagamento: titulo.idSolicitacaoPagamento,
                    codFormaCredito,
                    dataEnvio: hoje,
                    dataPrevistaPagamento: hoje,
                    valorIr: 0,
                    valorLiquido: saldo
                });
                await this.#solicitacaoRepository.atualizaTitularSolicitacao(
                    titulo.idSolicitacao,
                    titulo.cpfCnpjTitular,
                    titulo.tipoPessoaTitular
                );

                reaplicacaoInserida = await this.#reaplicacaoRepository.inserirReaplicacao(idTitulo, titulo.idSolicitacao);
                if (!reaplicacaoInserida)
                    await this.#reaplicacaoRepository.alinharReaplicacaoCriada(idTitulo, saldo);
            });
            etapaConcluida = 'PREPARACAO';
            logger.info(`Título ${idTitulo} preparado. Reaplicação ${reaplicacaoInserida ? 'inserida' : 'já existia (C)'}.`);

            // ---------------------------------------------------------------
            // 3. Envio da mensagem de pagamento como reaplicação
            // ---------------------------------------------------------------
            let messageId: string | undefined;
            const mensagemJaEnviada = await mensagemJaEnviadaAntes();
            if (mensagemJaEnviada) {
                logger.warn(`Título ${idTitulo}: mensagem de pagamento já enviada anteriormente — não será reenviada.`);
            } else {
                messageId = await this.#notificacaoService.enviarNotificacaoPagamento(
                    mensagemFila,
                    idTitulo,
                    titulo.idSolicitacao,
                    hoje
                );

                // Guarda a mensagem enviada no registro C da TIT_REAPLICACAO_TB.
                // Falha aqui não desfaz o envio: o controle principal é a RGT_SOLICITACAO_NOTIFICACAO.
                await this.#reaplicacaoRepository.registrarEnvioPagamento(idTitulo, {
                    origem: ORIGEM_REGISTRO_ENVIO,
                    enviadoEm: dayjs().format(DATE_FORMAT.PADRAO),
                    idSolicitacao: titulo.idSolicitacao,
                    idSolicitacaoPagamento: titulo.idSolicitacaoPagamento,
                    messageId,
                    mensagem: mensagemFila
                }).catch(err => {
                    avisos.push('Mensagem enviada, mas não foi possível gravá-la em REAPLICA_PREVIA_ORIGEM.');
                    logger.error(`Título ${idTitulo}: falha ao gravar REAPLICA_PREVIA_ORIGEM`, err);
                });
            }
            etapaConcluida = 'ENVIO';

            // ---------------------------------------------------------------
            // 4. Solicitação em ANDAMENTO
            // ---------------------------------------------------------------
            await this.#solicitacaoService.atualizaStatusSolicitacao(
                titulo.idSolicitacao,
                titulo.idSolicitacaoPagamento,
                properties.statusSolicitacao.ANDAMENTO.id
            );
            etapaConcluida = 'STATUS';

            logger.info(`Título ${idTitulo} concluído.`);
            return {
                ...base,
                situacao: 'SUCESSO',
                mensagem: avisos.length ? avisos.join(' ') : undefined,
                reaplicacaoInserida,
                mensagemJaEnviada,
                messageId,
                etapaConcluida
            };
        } catch (err) {
            const mensagem = err instanceof Error ? err.message : String(err);
            logger.error(`Falha no título ${idTitulo} (última etapa concluída: ${etapaConcluida ?? 'nenhuma'})`, err);
            return { ...base, situacao: 'ERRO', mensagem, etapaConcluida };
        }
    }
}

container.register(PreReaplicacaoService);
