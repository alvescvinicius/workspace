import { retry } from "@brcap/utils";
import { container } from "../container/container.js";
import { getProperty } from "../properties/properties.js";
import { RETRY_OPTIONS } from "../properties/server-settings.js";
import { ACAO_ATUALIZA_STATUS_SOLICITACAO } from "../properties/static.js";
import { makeRequest } from "../utils/http/request.utils.js";
import { getLogger } from "../utils/logger.js";

const properties = await getProperty('rgt-batch-resgate-final');
const logger = getLogger('SolicitacaoService');

export class SolicitacaoService {

    /**
     * Atualiza o status da solicitação pela API de solicitações,
     * igual ao rgt-batch-resgate-final (x_action=atualizaStatusSolicitacao).
     */
    async atualizaStatusSolicitacao(idSolicitacao: number, idSolicitacaoPagamento: number, idStatusSolicitacao: number) {
        const url = `${properties.urls.solicitacoes}?x_action=${ACAO_ATUALIZA_STATUS_SOLICITACAO}`;
        logger.trace(`Atualizando status da solicitação ${idSolicitacao} para ${idStatusSolicitacao}`);

        return await retry(
            () => makeRequest(url, 'POST', { idSolicitacao, idSolicitacaoPagamento, idStatusSolicitacao })
                .then(res => res.body()),
            RETRY_OPTIONS
        );
    }
}

container.register(SolicitacaoService);
