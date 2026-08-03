CREATE TABLE IF NOT EXISTS "cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"setor" text,
	"tem_autoridade_real" boolean,
	"aceita_diagnostico" boolean,
	"sinal_nao_cumprimento" boolean,
	"classificacao_resultante" text,
	"urgencia_financeira" text,
	"status" text DEFAULT 'lead' NOT NULL,
	"origem_lead_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agendamento_comercial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"google_calendar_event_id" text,
	"data_hora" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'agendado' NOT NULL,
	"reuniao_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"origem_lead" text,
	"sdr_responsavel" text,
	"temperatura" text,
	"ticket_estimado" numeric(12, 2),
	"status_comercial" text DEFAULT 'novo' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qualificacao_lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"resumo_qualificacao" text,
	"dores_identificadas" jsonb,
	"objecoes" text,
	"proximo_passo" text,
	"documentos_enviados" jsonb,
	"links_relevantes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cliente" ADD CONSTRAINT "cliente_origem_lead_id_lead_id_fk" FOREIGN KEY ("origem_lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agendamento_comercial" ADD CONSTRAINT "agendamento_comercial_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agendamento_comercial" ADD CONSTRAINT "agendamento_comercial_reuniao_id_reuniao_id_fk" FOREIGN KEY ("reuniao_id") REFERENCES "public"."reuniao"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualificacao_lead" ADD CONSTRAINT "qualificacao_lead_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
