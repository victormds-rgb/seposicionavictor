import type { Config } from "tailwindcss";

// Design Tokens — FDE (Sprint de Redesign de Produto, Fase 2).
// Cores/raio/sombra lêem as CSS variables definidas em globals.css —
// ver o comentário lá para a proposta de identidade completa.
// Aditivo: as classes Tailwind "cruas" (zinc-900, blue-50 etc.) usadas
// nas 11 páginas existentes continuam funcionando normalmente; estes
// tokens ficam disponíveis para os componentes novos e a página de
// demonstração até a Fase 2-F aplicar ao restante do produto.
const withOpacity = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Nomes dedicados (não `sans`/`mono`) de propósito: o Preflight
      // do Tailwind aplica `theme.fontFamily.sans` a `html` — se esses
      // fossem `sans`/`mono`, a fonte das 11 páginas existentes mudaria
      // sem nenhuma delas ser tocada. `font-geist`/`font-geist-mono`
      // são opt-in, só usados pelos componentes novos e pela página de
      // demonstração até a Fase 2-F.
      fontFamily: {
        geist: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        "geist-mono": ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: withOpacity("--surface"),
          raised: withOpacity("--surface-raised"),
          sunken: withOpacity("--surface-sunken"),
        },
        border: {
          subtle: withOpacity("--border-subtle"),
          DEFAULT: withOpacity("--border-default"),
        },
        ink: {
          primary: withOpacity("--ink-primary"),
          secondary: withOpacity("--ink-secondary"),
          tertiary: withOpacity("--ink-tertiary"),
        },
        primary: {
          DEFAULT: withOpacity("--primary"),
          hover: withOpacity("--primary-hover"),
          foreground: withOpacity("--primary-foreground"),
          tint: withOpacity("--primary-tint"),
        },
        accent: {
          DEFAULT: withOpacity("--accent"),
          hover: withOpacity("--accent-hover"),
          foreground: withOpacity("--accent-foreground"),
          tint: withOpacity("--accent-tint"),
        },
        success: {
          DEFAULT: withOpacity("--success"),
          foreground: withOpacity("--success-foreground"),
          tint: withOpacity("--success-tint"),
        },
        warning: {
          DEFAULT: withOpacity("--warning"),
          foreground: withOpacity("--warning-foreground"),
          tint: withOpacity("--warning-tint"),
        },
        danger: {
          DEFAULT: withOpacity("--danger"),
          foreground: withOpacity("--danger-foreground"),
          tint: withOpacity("--danger-tint"),
        },
        info: {
          DEFAULT: withOpacity("--info"),
          foreground: withOpacity("--info-foreground"),
          tint: withOpacity("--info-tint"),
        },
        ring: withOpacity("--ring"),
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        elevated: "var(--shadow-elevated)",
      },
    },
  },
  plugins: [],
};

export default config;
