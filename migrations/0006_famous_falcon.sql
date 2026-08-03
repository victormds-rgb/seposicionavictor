CREATE TABLE IF NOT EXISTS "ativo_conhecimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"conteudo_textual" text NOT NULL,
	"origem" text,
	"frequencia_uso" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
