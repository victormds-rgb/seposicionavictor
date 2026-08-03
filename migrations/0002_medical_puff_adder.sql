CREATE TABLE IF NOT EXISTS "reuniao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_hora" timestamp with time zone NOT NULL,
	"participantes" jsonb,
	"cliente_id" uuid,
	"projeto_id" uuid,
	"local" text,
	"notas_brutas" text,
	"status" text DEFAULT 'agendada' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "item_agenda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"data_hora" timestamp with time zone NOT NULL,
	"reuniao_id" uuid,
	"tarefa_id" uuid,
	"rotina_fixa_referencia" text,
	"recorrente" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'agendado' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_agenda" ADD CONSTRAINT "item_agenda_reuniao_id_reuniao_id_fk" FOREIGN KEY ("reuniao_id") REFERENCES "public"."reuniao"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_item_agenda_data_hora" ON "item_agenda" USING btree ("data_hora");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registro_bruto" ADD CONSTRAINT "registro_bruto_reuniao_id_reuniao_id_fk" FOREIGN KEY ("reuniao_id") REFERENCES "public"."reuniao"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
