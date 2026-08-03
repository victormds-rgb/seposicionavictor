CREATE TABLE IF NOT EXISTS "documento_chunk_indexado" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"conteudo_chunk" text NOT NULL,
	"embedding_ref" text,
	"ordem" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documento_oficial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"google_drive_file_id" text NOT NULL,
	"tipo_documento" text NOT NULL,
	"ultima_sincronizacao" timestamp with time zone,
	"hash_conteudo" text,
	"status_indexacao" text DEFAULT 'nao_indexado' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documento_oficial_google_drive_file_id_unique" UNIQUE("google_drive_file_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documento_chunk_indexado" ADD CONSTRAINT "documento_chunk_indexado_documento_id_documento_oficial_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documento_oficial"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
