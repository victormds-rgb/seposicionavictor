/**
 * Logger técnico estruturado — Sprint 0 (Fundação).
 *
 * Distinto de `event_log` (DATABASE.md): este logger é para depuração
 * de infraestrutura (erros de conexão, falhas de integração), nunca
 * para observabilidade de domínio (ARCHITECTURE.md, seção 14;
 * CODING_GUIDELINES.md, seção 12). Nenhuma ferramenta de
 * observabilidade altera comportamento do domínio.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  // Sprint 0: saída estruturada em stdout/stderr, consumível por
  // qualquer coletor de log da plataforma de deploy (Vercel).
  // Substituição por serviço externo de observabilidade, se um dia
  // necessária, deve ocorrer apenas nesta implementação — nenhum
  // outro módulo deve chamar console.* diretamente.
  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};

/**
 * Registra a exceção capturada e a relança — usado nos pontos de
 * captura de exceção das Server Actions (Sprint 14 — Hardening Final,
 * item 6). Comportamento externo idêntico ao de simplesmente deixar a
 * exceção propagar (Next.js continua vendo o mesmo erro); a única
 * diferença é que agora fica um log estruturado antes.
 */
export function logarFalhaEPropagar(contexto: string, erro: unknown): never {
  logger.error(contexto, { erro: erro instanceof Error ? erro.message : String(erro) });
  throw erro;
}
