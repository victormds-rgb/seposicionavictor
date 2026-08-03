import type { Config } from "tailwindcss";

// Configuração mínima de infraestrutura (Sprint 0).
// Tokens de design, cores e identidade visual pertencem a um documento
// futuro (DESIGN_SYSTEM.md, não produzido nesta fase) — esta configuração
// existe apenas para permitir que o Tailwind CSS compile corretamente.
const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
