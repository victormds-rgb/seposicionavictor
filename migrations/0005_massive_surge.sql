CREATE TABLE IF NOT EXISTS "peca_conteudo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tema_id" uuid,
	"framework_id" uuid,
	"canal" text NOT NULL,
	"serie_fixa_id" uuid,
	"pilar_id" uuid NOT NULL,
	"status" text DEFAULT 'rascunho' NOT NULL,
	"origem_tipo" text NOT NULL,
	"origem_case_id" uuid,
	"origem_build_log_id" uuid,
	"peca_origem_id" uuid,
	"conteudo_texto" text,
	"data_publicacao" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peca_conteudo" ADD CONSTRAINT "peca_conteudo_tema_id_tema_mapeado_id_fk" FOREIGN KEY ("tema_id") REFERENCES "public"."tema_mapeado"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peca_conteudo" ADD CONSTRAINT "peca_conteudo_framework_id_framework_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."framework"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peca_conteudo" ADD CONSTRAINT "peca_conteudo_serie_fixa_id_serie_fixa_id_fk" FOREIGN KEY ("serie_fixa_id") REFERENCES "public"."serie_fixa"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peca_conteudo" ADD CONSTRAINT "peca_conteudo_pilar_id_pilar_id_fk" FOREIGN KEY ("pilar_id") REFERENCES "public"."pilar"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peca_conteudo" ADD CONSTRAINT "peca_conteudo_origem_case_id_case_id_fk" FOREIGN KEY ("origem_case_id") REFERENCES "public"."case"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peca_conteudo" ADD CONSTRAINT "peca_conteudo_origem_build_log_id_build_log_id_fk" FOREIGN KEY ("origem_build_log_id") REFERENCES "public"."build_log"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peca_conteudo" ADD CONSTRAINT "peca_conteudo_peca_origem_id_peca_conteudo_id_fk" FOREIGN KEY ("peca_origem_id") REFERENCES "public"."peca_conteudo"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_peca_conteudo_pilar_status" ON "peca_conteudo" USING btree ("pilar_id","status","data_publicacao");