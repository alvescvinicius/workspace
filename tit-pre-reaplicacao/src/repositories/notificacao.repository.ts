import { container } from "../container/container.js";
import { CAPITALIZACAO_DB } from "../database/database.js";
import { GRAVA_NOTIFICACAO } from "../properties/static.js";

export type NotificacaoResgate = {
    idSolicitacao: number;
    nomeFila: string;
    topicArn: string;
    dto: any;
    dtoMonitoramento: any;
    status: number;
    dataInsercao: Date;
};

export class NotificacaoRepository {

    #database = container.get(CAPITALIZACAO_DB);

    /** Mesma gravação de auditoria feita pelo rgt-batch-resgate-final. */
    async gravaResgateNotificacao(notificacao: NotificacaoResgate) {
        await this.#database.insert('RGT_SOLICITACAO_NOTIFICACAO', {
            insertValues: {
                ID_SOLICITACAO: notificacao.idSolicitacao,
                NomeFila: notificacao.nomeFila,
                topicArn: notificacao.topicArn,
                dto: JSON.stringify(notificacao.dto),
                dtoMonitoramento: JSON.stringify(notificacao.dtoMonitoramento),
                status: notificacao.status,
                dataInsercao: notificacao.dataInsercao
            },
            name: 'gravaResgateNotificacao'
        });
    }

    /**
     * Verifica se a mensagem de pagamento como reaplicação já foi enviada com sucesso
     * para a solicitação — evita publicar duas vezes ao reexecutar.
     */
    async mensagemReaplicacaoJaEnviada(idSolicitacao: number, nomeFila: string): Promise<boolean> {
        const rows = await this.#database.query<{ total: number }>(`
            SELECT COUNT(*) AS total
            FROM RGT_SOLICITACAO_NOTIFICACAO
            WHERE ID_SOLICITACAO = :idSolicitacao
              AND NomeFila = :nomeFila
              AND status = :statusOk
              AND dto LIKE '%"reaplicacao":true%'
        `, { idSolicitacao, nomeFila, statusOk: GRAVA_NOTIFICACAO.OK }, 'mensagemReaplicacaoJaEnviada');

        return Number(rows[0]?.total ?? 0) > 0;
    }
}

container.register(NotificacaoRepository);
