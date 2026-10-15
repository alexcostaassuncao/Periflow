CREATE TABLE IF NOT EXISTS `projetos` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente` text NOT NULL,
	`link` text DEFAULT '' NOT NULL,
	`tipo` text DEFAULT 'Site' NOT NULL,
	`mes` text NOT NULL,
	`criado_em` text DEFAULT '' NOT NULL,
	`inicio` text DEFAULT '' NOT NULL,
	`entrega` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Em Processo' NOT NULL,
	`owner_id` text DEFAULT '' NOT NULL,
	`owner_name` text DEFAULT '' NOT NULL,
	`pago` integer DEFAULT 0 NOT NULL,
	`historico_transferencias` text DEFAULT '[]' NOT NULL,
	`timestamp` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projeto_notas` (
	`id` text PRIMARY KEY NOT NULL,
	`projeto_id` text NOT NULL REFERENCES `projetos`(`id`) ON DELETE CASCADE,
	`title` text DEFAULT '' NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`date` text NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`is_alert` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `projeto_notas_projeto_idx` ON `projeto_notas` (`projeto_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projeto_empresas` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipos` text DEFAULT '[]' NOT NULL,
	`tem_suporte` integer DEFAULT 0 NOT NULL,
	`suporte_inicio` text DEFAULT '' NOT NULL,
	`suporte_fim` text DEFAULT '' NOT NULL,
	`dia_lembrete` text DEFAULT '' NOT NULL,
	`link_grupo_whatsapp` text DEFAULT '' NOT NULL,
	`webhook_url` text DEFAULT '' NOT NULL,
	`codigo_loja` text DEFAULT '' NOT NULL,
	`usuario_loja` text DEFAULT '' NOT NULL,
	`senha_loja` text DEFAULT '' NOT NULL,
	`dominio` text DEFAULT '' NOT NULL,
	`usuario_dominio` text DEFAULT '' NOT NULL,
	`senha_dominio` text DEFAULT '' NOT NULL,
	`provedor_dominio` text DEFAULT 'Registro Br' NOT NULL,
	`ultimo_lembrete_enviado` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
