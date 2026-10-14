import dayjs from "dayjs";
import { Throttle } from "@brcap/concurrency";
import { Notification, uuidv7 } from "@brcap/notification";
import { SNSConfig, SNSDriver } from "@brcap/notification-sns";
import { container } from "../container/container.js";
import { MensagemFilaPgtoDTO } from "../data/mensagem-filas.data.js";
import { getProperty } from "../properties/properties.js";
import { CONCURRENCY, CONCURRENCY_INTERVAL } from "../properties/server-settings.js";
import { GRAVA_NOTIFICACAO, NOME_FILA_PAGAMENTO } from "../properties/static.js";
import { NotificacaoRepository } from "../repositories/notificacao.repository.js";
import { getLogger } from "../utils/logger.js";

const properties = await getProperty('rgt-batch-resgate-final');
const logger = getLogger('NotificacaoService');

export class NotificacaoService {

    #notificacaoRepository = container.get(NotificacaoRepository);
    #throttleSNS = new Throttle({ maxConcurrency: CONCURRENCY.SNS, interval: CONCURRENCY_INTERVAL.SNS });
    #notification?: Notification<SNSDriver, SNSConfig>;

    get topicArn() {
        return properties.topicArn.resgateFinalPagamento;
    }

    async mensagemJaEnviada(idSolicitacao: number): Promise<boolean> {
        return this.#notificacaoRepository.mensagemReaplicacaoJaEnviada(idSolicitacao, NOME_FILA_PAGAMENTO);
    }

    /**
     * Publica a mensagem na fila de pagamento de resgate final (mesmo tópico, subject e
     * formato do rgt-batch-resgate-final) e registra o resultado na RGT_SOLICITACAO_NOTIFICACAO.
     *
     * @returns messageId retornado pelo SNS.
     */
    async enviarNotificacaoPagamento(
        mensagem: MensagemFilaPgtoDTO,
        idTitulo: number,
        idSolicitacao: number,
        dataSolicitacao: string
    ): Promise<string | undefined> {
        const topicArn = this.topicArn;
        const dtoMonitoramento = { idTitulo, idSolicitacao, dataSolicitacao };

        return await this.#throttleSNS.run(async () => {
            try {
                if (!this.#notification) {
                    this.#notification = new Notification({ driver: SNSDriver, topic: topicArn, logger });
                }

                const [result] = await this.#notification.publish([
                    { body: JSON.stringify(mensagem), id: uuidv7(), subject: NOME_FILA_PAGAMENTO }
                ]);

                if (!result?.success) {
                    throw (result as any)?.reason ?? new Error('Falha desconhecida ao publicar no SNS');
                }

                const messageId = (result as any).messageId as string | undefined;
                logger.info(`Mensagem enviada: ${NOME_FILA_PAGAMENTO} - ${topicArn} - ${messageId}`);

                await this.#gravar(mensagem, topicArn, dtoMonitoramento, idSolicitacao, GRAVA_NOTIFICACAO.OK);
                return messageId;
            } catch (err) {
                logger.error(`Erro ao enviar mensagem para ${NOME_FILA_PAGAMENTO}`, err);
                await this.#gravar(mensagem, topicArn, dtoMonitoramento, idSolicitacao, GRAVA_NOTIFICACAO.ERRO);
                throw err;
            }
        });
    }

    async #gravar(mensagem: unknown, topicArn: string, dtoMonitoramento: unknown, idSolicitacao: number, status: number) {
        try {
            await this.#notificacaoRepository.gravaResgateNotificacao({
                idSolicitacao,
                nomeFila: NOME_FILA_PAGAMENTO,
                topicArn,
                dto: mensagem,
                dtoMonitoramento,
                status,
                dataInsercao: dayjs.utc().toDate()
            });
        } catch (err) {
            // Não interrompe o fluxo: o envio já aconteceu (ou já falhou).
            logger.error(`Não foi possível gravar na RGT_SOLICITACAO_NOTIFICACAO (status ${status})`, err);
        }
    }
}

container.register(NotificacaoService);
