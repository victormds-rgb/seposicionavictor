"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@infra/auth/supabase-server";
import { logarFalhaEPropagar } from "@infra/logging/logger";
import { env } from "@config/env";
import { emailAutorizadoParaCadastro } from "./allowlist";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAMANHO_MINIMO_SENHA = 6;

function redirecionarComErro(mensagem: string): never {
  redirect(`/cadastro?erro=${encodeURIComponent(mensagem)}`);
}

/**
 * Server Action de cadastro — Sprint 40 (Ativação do Primeiro Acesso).
 * Único mecanismo de criação de credencial: Supabase Auth
 * (`signUp`). Nenhuma senha é lida/gravada pela aplicação — só
 * repassada ao SDK oficial.
 *
 * Allowlist (src/app/cadastro/allowlist.ts) é checada ANTES de chamar
 * o Supabase — mesmo tratamento de erro para "fora da allowlist" e
 * "e-mail já cadastrado", para não revelar se o e-mail já existe.
 */
export async function signUp(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (!nome || !email || !senha || !confirmarSenha) {
    redirecionarComErro("Preencha todos os campos.");
  }
  if (!REGEX_EMAIL.test(email)) {
    redirecionarComErro("E-mail inválido.");
  }
  if (senha.length < TAMANHO_MINIMO_SENHA) {
    redirecionarComErro(`A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }
  if (senha !== confirmarSenha) {
    redirecionarComErro("As senhas não coincidem.");
  }
  if (!emailAutorizadoParaCadastro(email, env.SIGNUP_ALLOWED_EMAILS)) {
    redirecionarComErro("Este cadastro ainda não está disponível para este e-mail.");
  }

  let resultado;
  try {
    const supabase = await createSupabaseServerClient();
    resultado = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });
  } catch (erro) {
    logarFalhaEPropagar("cadastro.signUp", erro);
  }

  if (resultado.error) {
    redirecionarComErro("Não foi possível criar a conta. Tente novamente em instantes.");
  }

  // Supabase não retorna erro para e-mail já cadastrado (evita
  // enumeração) — sinaliza via `identities: []` no usuário retornado.
  // Mesma mensagem da allowlist, pelo mesmo motivo: nunca confirmar
  // para quem tenta se cadastrar se um e-mail já existe ou não.
  if (resultado.data.user && resultado.data.user.identities?.length === 0) {
    redirecionarComErro("Este cadastro ainda não está disponível para este e-mail.");
  }

  if (!resultado.data.session) {
    redirect("/cadastro?sucesso=confirme-seu-email");
  }

  redirect("/dashboard");
}
