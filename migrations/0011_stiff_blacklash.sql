ALTER TABLE "lead" ADD COLUMN "canal_origem" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "campanha" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "interesse" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "ultimo_contato_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "proximo_contato_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "motivo_perda" text;