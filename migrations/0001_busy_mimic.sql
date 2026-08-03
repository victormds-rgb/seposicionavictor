CREATE TABLE IF NOT EXISTS "sugestao_ia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_sugestao" text NOT NULL,
	"entidade_origem_tipo" text NOT NULL,
	"entidade_origem_id" uuid NOT NULL,
	"entidade_alvo_tipo" text,
	"entidade_alvo_id" uuid,
	"conteudo_sugerido" jsonb NOT NULL,
	"provider" text,
	"modelo" text,
	"prompt_version" text,
	"temperatura" numeric(3, 2),
	"tokens_input" integer,
	"tokens_output" integer,
	"custo_estimado" numeric(10, 6),
	"tempo_resposta_ms" integer,
	"confianca" numeric(3, 2),
	"origem_da_sugestao" text,
	"status" text DEFAULT 'pendente' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registro_bruto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_entrada" text NOT NULL,
	"conteudo_texto" text,
	"conteudo_binario_ref" text,
	"mime_type" text,
	"tamanho_bytes" bigint,
	"data_captura" timestamp with time zone DEFAULT now() NOT NULL,
	"origem" text NOT NULL,
	"reuniao_id" uuid,
	"status" text DEFAULT 'capturado' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registro_bruto_destino" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registro_bruto_id" uuid NOT NULL,
	"tipo_destino" text NOT NULL,
	"destino_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registro_bruto_destino" ADD CONSTRAINT "registro_bruto_destino_registro_bruto_id_registro_bruto_id_fk" FOREIGN KEY ("registro_bruto_id") REFERENCES "public"."registro_bruto"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sugestao_ia_provider_modelo" ON "sugestao_ia" USING btree ("provider","modelo","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_registro_bruto_status" ON "registro_bruto" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_registro_bruto_data_captura" ON "registro_bruto" USING btree ("data_captura");