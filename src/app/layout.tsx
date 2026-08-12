import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Tipografia — Fase 2 (Redesign de Produto). Geist para UI/títulos,
// Geist Mono reservado a métricas/números/timestamps/IDs (uso
// pontual, não geral — ver proposta de identidade visual).
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Layout raiz mínimo — Sprint 0 (Fundação).
// Navegação global, shell da aplicação e Dashboard pertencem à Sprint 1
// (IMPLEMENTATION_PLAN.md) e não são antecipados aqui.
//
// Sprint 32 — Rebranding para "MeuCMO": só identidade visual/textos.
// Nenhuma rota, domínio, nome de projeto Vercel ou repositório muda —
// ver relatório da Sprint 32.
const NOME_PRODUTO = "FDE";
const SUBTITULO_PRODUTO = "Seu Diretor de Marketing movido por IA.";

export const metadata: Metadata = {
  title: NOME_PRODUTO,
  description: SUBTITULO_PRODUTO,
  manifest: "/manifest.json",
  openGraph: {
    title: NOME_PRODUTO,
    description: SUBTITULO_PRODUTO,
  },
  twitter: {
    card: "summary",
    title: NOME_PRODUTO,
    description: SUBTITULO_PRODUTO,
  },
};

// Sprint 25 (Shell/Responsividade): sem isto, qualquer navegador —
// inclusive celular real — renderiza num viewport virtual de
// ~980-1024px e escala a página inteira em vez de aplicar o layout
// responsivo (`md:`) de fato. Achado durante a validação em
// produção desta sprint, não específico da ferramenta de teste.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // As variáveis --font-geist-sans/--font-geist-mono ficam
    // disponíveis no documento inteiro, mas isso NÃO muda a fonte
    // renderizada de nenhuma página existente — nada hoje referencia
    // essas variáveis. Só os componentes novos (`font-geist`/
    // `font-geist-mono`, ver tailwind.config.ts) e a página de
    // demonstração as usam. Aplicar às 11 páginas é a Fase 2-F.
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
