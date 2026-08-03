import type { NextConfig } from "next";

// Configuração mínima de infraestrutura (Sprint 0).
// Nenhuma regra de negócio ou decisão de UX é definida aqui —
// apenas o necessário para o projeto compilar e executar.
//
// `serverActions.bodySizeLimit` (Sprint 15 — Green Deploy): o padrão do
// Next.js para Server Actions é 1MB, abaixo do limite de negócio de
// upload da Inbox (10MB, ver TAMANHO_MAXIMO_UPLOAD_BYTES em
// src/app/(shell)/inbox/actions.ts). Sem este ajuste, qualquer arquivo
// acima de 1MB era rejeitado pelo próprio Next antes mesmo de chegar à
// validação amigável do Server Action, expondo uma tela de erro com
// stacktrace. 12MB dá margem para o overhead de codificação
// multipart/form-data acima do limite de negócio de 10MB, mantendo um
// teto defensivo — a validação de negócio (com mensagem amigável)
// continua sendo o limite efetivo de 10MB.
//
// `proxyClientMaxBodySize`: limite SEPARADO e independente do
// `bodySizeLimit` acima — o proxy de autenticação (src/proxy.ts,
// renomeado de middleware.ts no Next.js 16) roda em toda rota,
// inclusive POSTs de Server Action, e por padrão só deixa passar os
// primeiros 10MB do corpo da requisição antes mesmo dela chegar à
// Server Action. Mesmo com `bodySizeLimit` maior, um upload de
// exatamente 10MB era truncado aqui, causando "Unexpected end of
// form" ao invés da validação amigável. Mesma margem de 12mb pelo
// mesmo motivo.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    proxyClientMaxBodySize: "12mb",
  },
};

export default nextConfig;
