import path from "node:path";

/**
 * Local do storageState (cookies de sessão) gerado uma única vez por
 * `auth.setup.ts` e reutilizado por todos os specs autenticados —
 * evita logar via UI em cada teste (mais rápido, e cada teste
 * continua independente porque cada um cria seus próprios dados).
 */
export const STORAGE_STATE_PATH = path.join(__dirname, "..", ".auth", "user.json");
