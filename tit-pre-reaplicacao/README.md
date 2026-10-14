# tit-pre-reaplicacao

Prepara uma lista de títulos para **reaplicação por exceção** e envia a mensagem de
pagamento de resgate final **como reaplicação**. A partir daí o restante segue o fluxo
que já existe:

- o consumidor da `filaResgateFinalPagamento` faz a contabilização e os tributos;
- o `tit-batch-reaplicacao` processa o registro criado na `TIT_REAPLICACAO_TB`.

Substitui a sequência manual `tit-prepara-reaplicacao-excecao` → `tit-gera-json-previa` →
`tit-envia-ap-tributos-excecao`.

## O que é feito para cada título

| Etapa | O que acontece |
|---|---|
| 1. Validação | Exige solicitação RF em `PAGAMENTO_PENDENTE` (2) ou `PAGAMENTO_BLOQUEADO` (27) com solicitação de pagamento, `SALDO_CAPITALIZADO` e `VALOR_PRIMEIRA_PARCELA` preenchidos, e nenhuma reaplicação `E`/`R` na `TIT_REAPLICACAO_TB`. **Trava do fluxo antigo:** se `REAPLICA_PREVIA_ORIGEM` tiver a prévia gerada pelo `tit-gera-json-previa`, o título é ignorado (veja abaixo). **A regra de gravame não é aplicada.** |
| 2. Preparação (transação) | `TIT_TITULO_TB.IND_REAPLICACAO_RENOVACAO = 'S'`; `SOL_SOLICITACAO_PAGAMENTO_TB` com forma de crédito = reaplicação, sem dados bancários, IR 0, líquido = saldo e data prevista = hoje; CPF/CNPJ e tipo de pessoa do titular na `SOL_SOLICITACAO_TB`; insert na `TIT_REAPLICACAO_TB` (`STATUS='C'`, `REAPLICA_DATA_ATUAL='S'`, saldo da solicitação). Se já houver registro `C`, ele é reaproveitado e alinhado (saldo e `REAPLICA_DATA_ATUAL='S'`). |
| 3. Envio | Publica no tópico `topicArn.resgateFinalPagamento` a mesma mensagem do `rgt-batch-resgate-final` (`createMensagemFilaPgto`), com `reaplicacao: true`, `codFormaCredito` = reaplicação e `dataPrevisaoReaplicacao` = hoje. Grava o envio na `RGT_SOLICITACAO_NOTIFICACAO` e a mensagem enviada em `TIT_REAPLICACAO_TB.REAPLICA_PREVIA_ORIGEM`. **Não reenvia** se qualquer um dos dois indicar envio anterior. |
| 4. Status | Solicitação em `ANDAMENTO` pela API de solicitações (`x_action=atualizaStatusSolicitacao`), como no fluxo normal. Assim o `rgt-batch-resgate-final` não pega o título de novo. |

Valores usados: **saldo = `SOL_SOLICITACAO_TB.SALDO_CAPITALIZADO`**; datas de efetivação,
previsão de reaplicação e previsão de pagamento = **hoje** (`REAPLICA_DATA_ATUAL='S'`).

Reexecutar é seguro: títulos já concluídos ficam em `ANDAMENTO` e são ignorados, o insert não
duplica e a mensagem não é reenviada.

## Controle de envio e trava do fluxo antigo

Duas marcas indicam que a mensagem já foi enviada ao `pgt-registra-pagamento`:

- `RGT_SOLICITACAO_NOTIFICACAO`: linha com `NomeFila='filaResgateFinalPagamento'`, `status=1` e `"reaplicacao":true` no `dto` para a solicitação;
- `TIT_REAPLICACAO_TB.REAPLICA_PREVIA_ORIGEM` (registro `C`), com o envelope:

```json
{
  "origem": "tit-pre-reaplicacao",
  "enviadoEm": "2026-10-14 10:50:00",
  "idSolicitacao": 123,
  "idSolicitacaoPagamento": 456,
  "messageId": "…",
  "mensagem": { "...": "mensagem enviada à filaResgateFinalPagamento" }
}
```

Se `REAPLICA_PREVIA_ORIGEM` tiver **qualquer outro conteúdo** (a prévia `{dataPrevistaPagamento, valorBruto, …}` gravada pelo
`tit-gera-json-previa`), o título já passou pelo fluxo de exceção antigo: o saldo já foi atualizado e o AP de tributos já foi
enviado. Ele sai como `IGNORADO` para não dobrar a correção nem os tributos no `pgt-registra-pagamento`.

Limitação: um título que passou só pelo `tit-prepara-reaplicacao-excecao` (sem gerar a prévia) não deixa essa marca e não é
barrado, embora o saldo dele já tenha sido recalculado.

## Executar

```sh
npm install

# Simulação: monta as mensagens e mostra o que seria feito, sem gravar nem publicar
npm run dev -- --titulos=21289091,21289064 --dry-run

# Execução
npm run dev -- --titulos=21289091,21289064
npm run dev -- --arquivo=titulos.txt        # um ID por linha (ou separados por vírgula)
TITULOS_REAPLICACAO='[21289091,21289064]' npm run dev
```

Recomendado: rodar sempre com `--dry-run` antes e conferir o relatório.

O processo termina com código `1` se algum título tiver `ERRO`.

## Relatório

Gravado em `relatorios/` a cada execução:

- `pre-reaplicacao-AAAAMMDD-HHmmss.json`: resultado completo por título (no dry-run inclui a mensagem montada);
- `pre-reaplicacao-AAAAMMDD-HHmmss.csv`: resumo (`;` como separador).

Situações: `SUCESSO`, `SIMULADO` (dry-run), `IGNORADO` (não elegível, com o motivo) e `ERRO`
(com a última etapa concluída, para saber de onde retomar).

## Configuração

Lida por `@brcap/env` (properties). Reaproveita as chaves do `rgt-batch-resgate-final`:

- `capitalizacao_db`: conexão. Host `capitalizacao_db_prd` quando `ENVIRONMENT=PRD`, senão `capitalizacao_db`. Pode ser sobrescrito com `DB_HOST`.
- `rgt-batch-resgate-final`: `urls.parceiro`, `urls.planos`, `urls.solicitacoes`, `topicArn.resgateFinalPagamento`, `formaCredito.reaplicacao`, `tiposSolicitacoes`, `tiposCompromissoPagamento`, `tipoAtendimento`, `canalSolicitacao` e `statusSolicitacao`. A `dataMandatoria` **não** é enviada na mensagem, mesmo que exista nas properties, para que o pagamento use a data de hoje.

As credenciais AWS para publicar no SNS precisam estar no ambiente.
