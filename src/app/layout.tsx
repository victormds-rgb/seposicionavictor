import type { Metadata, Viewport } from "next";
import "./globals.css";

// Layout raiz mínimo — Sprint 0 (Fundação).
// Navegação global, shell da aplicação e Dashboard pertencem à Sprint 1
// (IMPLEMENTATION_PLAN.md) e não são antecipados aqui.
export const metadata: Metadata = {
  title: "SEPosicionaVictor",
  description: "Sistema Operacional da Marca — Victor Sousa",
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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
