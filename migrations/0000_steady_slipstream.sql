CREATE TABLE IF NOT EXISTS "framework" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"estrutura_etapas" jsonb NOT NULL,
	"exemplos_uso" text,
	"status" text DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pilar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"peso_alvo_percentual" numeric(5, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regra_decisao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"estrutura_arvore" jsonb NOT NULL,
	"aplica_a" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "serie_fixa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"dia_semana_padrao" text,
	"framework_tipico_id" uuid,
	"status" text DEFAULT 'ativa' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tema_framework" (
	"tema_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	CONSTRAINT "tema_framework_tema_id_framework_id_pk" PRIMARY KEY("tema_id","framework_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tema_mapeado" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome_tema" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tema_mapeado_nome_tema_unique" UNIQUE("nome_tema")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"actor_tipo" text NOT NULL,
	"actor_id" text,
	"source" text,
	"correlation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fundamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filosofia" text NOT NULL,
	"big_idea" text NOT NULL,
	"frase_ancora" text NOT NULL,
	"manifesto" text NOT NULL,
	"principios_operacionais" jsonb NOT NULL,
	"nao_e" jsonb NOT NULL,
	"status" text DEFAULT 'ativo' NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fundamento_historico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fundamento_id" uuid NOT NULL,
	"versao" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"alterado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"motivo" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serie_fixa" ADD CONSTRAINT "serie_fixa_framework_tipico_id_framework_id_fk" FOREIGN KEY ("framework_tipico_id") REFERENCES "public"."framework"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tema_framework" ADD CONSTRAINT "tema_framework_tema_id_tema_mapeado_id_fk" FOREIGN KEY ("tema_id") REFERENCES "public"."tema_mapeado"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tema_framework" ADD CONSTRAINT "tema_framework_framework_id_framework_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."framework"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fundamento_historico" ADD CONSTRAINT "fundamento_historico_fundamento_id_fundamento_id_fk" FOREIGN KEY ("fundamento_id") REFERENCES "public"."fundamento"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_log_aggregate" ON "event_log" USING btree ("aggregate","aggregate_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_log_correlation" ON "event_log" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_log_created_at" ON "event_log" USING btree ("created_at");