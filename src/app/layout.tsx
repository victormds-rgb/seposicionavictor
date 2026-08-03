import type { Metadata } from "next";
import "./globals.css";

// Layout raiz mínimo — Sprint 0 (Fundação).
// Navegação global, shell da aplicação e Dashboard pertencem à Sprint 1
// (IMPLEMENTATION_PLAN.md) e não são antecipados aqui.
export const metadata: Metadata = {
  title: "SEPosicionaVictor",
  description: "Sistema Operacional da Marca — Victor Sousa",
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
