-- Fundação: clientes, tarefas e carteiras saem do JSON único (connect_state 'workspace') e vão para tabelas.
-- Cada linha guarda em `dados` o objeto completo, como a tela usa; as colunas servem para filtrar e checar permissão.
-- `versao` evita que duas pessoas sobrescrevam a mesma linha sem perceber.
-- O JSON antigo NÃO é apagado: fica como backup.
CREATE TABLE IF NOT EXISTS `carteiras` (
	`id` text PRIMARY KEY NOT NULL,
	`consultora` text DEFAULT '' NOT NULL,
	`equipe` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `carteiras` (`id`,`consultora`,`equipe`,`updated_at`)
SELECT w.id,
       coalesce((SELECT json_extract(s.payload,'$.walletInfo.'||w.id||'.owner') FROM `connect_state` s WHERE s.id='workspace'),''),
       coalesce((SELECT json_extract(s.payload,'$.walletTeams.'||w.id) FROM `connect_state` s WHERE s.id='workspace'),'{}'),
       CAST(strftime('%s','now') AS INTEGER)*1000
FROM (SELECT 'C1' AS id UNION ALL SELECT 'C2' UNION ALL SELECT 'C3' UNION ALL SELECT 'C4') w;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `clientes` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text DEFAULT '' NOT NULL,
	`carteira_id` text DEFAULT 'C1' NOT NULL,
	`situacao` text DEFAULT 'ativo' NOT NULL,
	`dados` text NOT NULL,
	`versao` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `clientes_carteira_idx` ON `clientes` (`carteira_id`);
--> statement-breakpoint
-- Situação do cliente: lead, onboarding, ativo, pausado, inativo, cancelado. Vazio ou desconhecido = ativo.
INSERT INTO `clientes` (`id`,`nome`,`carteira_id`,`situacao`,`dados`,`created_at`,`updated_at`)
SELECT json_extract(c.value,'$.id'),
       coalesce(json_extract(c.value,'$.name'),''),
       coalesce(nullif(json_extract(c.value,'$.wallet'),''),'C1'),
       CASE WHEN json_extract(c.value,'$.status') IN ('lead','onboarding','ativo','pausado','inativo','cancelado') THEN json_extract(c.value,'$.status') ELSE 'ativo' END,
       c.value,
       CAST(strftime('%s','now') AS INTEGER)*1000, CAST(strftime('%s','now') AS INTEGER)*1000
FROM `connect_state` s, json_each(s.payload,'$.clients') c
WHERE s.id='workspace';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tarefas` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`mes` text DEFAULT '' NOT NULL,
	`etapa` text DEFAULT 'briefing' NOT NULL,
	`responsavel` text DEFAULT '' NOT NULL,
	`cancelada` integer DEFAULT 0 NOT NULL,
	`dados` text NOT NULL,
	`versao` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tarefas_cliente_idx` ON `tarefas` (`cliente_id`,`mes`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tarefas_responsavel_idx` ON `tarefas` (`responsavel`);
--> statement-breakpoint
INSERT INTO `tarefas` (`id`,`cliente_id`,`mes`,`etapa`,`responsavel`,`cancelada`,`dados`,`created_at`,`updated_at`)
SELECT json_extract(t.value,'$.id'),
       coalesce(json_extract(t.value,'$.clientId'),''),
       coalesce(json_extract(t.value,'$.month'),''),
       coalesce(nullif(json_extract(t.value,'$.workflowStage'),''),'briefing'),
       coalesce(json_extract(t.value,'$.currentOwner'),''),
       CASE WHEN json_extract(t.value,'$.cancelled') THEN 1 ELSE 0 END,
       t.value,
       CAST(strftime('%s','now') AS INTEGER)*1000, CAST(strftime('%s','now') AS INTEGER)*1000
FROM `connect_state` s, json_each(s.payload,'$.tasks') t
WHERE s.id='workspace';
