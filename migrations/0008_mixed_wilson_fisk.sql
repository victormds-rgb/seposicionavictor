CREATE TABLE IF NOT EXISTS "alerta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"condicao_gatilho" text NOT NULL,
	"entidade_relacionada_tipo" text,
	"entidade_relacionada_id" uuid,
	"status" text DEFAULT 'ativo' NOT NULL,
	"data_disparo" timestamp with time zone DEFAULT now() NOT NULL,
	"data_resolucao" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auditoria_drift" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_execucao" timestamp with time zone DEFAULT now() NOT NULL,
	"pecas_avaliadas" jsonb NOT NULL,
	"percentual_falha" numeric(5, 2),
	"recomendacao_gerada" text,
	"status" text DEFAULT 'agendada' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
