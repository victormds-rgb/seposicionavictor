# Registros Brutos / Inbox Universal

**Status:** implementado na Sprint 2 (captura, classificação assistida por IA, fluxo de confirmação humana, busca/filtros). Pipeline de transcrição/OCR para entradas binárias (áudio, imagem, PDF, vídeo, print, documento) **não** implementado — ver limitação registrada no relatório da Sprint 2.

## Responsabilidade

Porta de entrada universal de qualquer informação não estruturada (texto, áudio, imagem, PDF, vídeo, print, e-mail, documento, link, mensagem, observação, transcrição), classificada com assistência de IA sob confirmação humana.

## Entidades

RegistroBruto (Aggregate Root), RegistroBrutoDestino

## Sprint de implementação

Sprint 2 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo desta entidade/contexto, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema.
