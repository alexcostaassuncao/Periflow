-- Comercial (PDF págs. 4, 5 e 5.1): funil de leads, linha do tempo de cada lead e log das entradas por formulário.
-- etapa: novo, contato, reuniao, proposta, negociacao, fechado. situacao: andamento, espera, arquivado.
-- whatsapp fica só com dígitos e DDI (ex.: 5548999999999) e email em minúsculas: os dois evitam lead duplicado.
CREATE TABLE IF NOT EXISTS `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text DEFAULT '' NOT NULL,
	`empresa` text DEFAULT '' NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`instagram` text DEFAULT '' NOT NULL,
	`segmento` text DEFAULT '' NOT NULL,
	`interesse` text DEFAULT '' NOT NULL,
	`origem` text DEFAULT '' NOT NULL,
	`utm_source` text DEFAULT '' NOT NULL,
	`utm_campaign` text DEFAULT '' NOT NULL,
	`responsavel_id` text DEFAULT '' NOT NULL,
	`etapa` text DEFAULT 'novo' NOT NULL,
	`situacao` text DEFAULT 'andamento' NOT NULL,
	`espera_motivo` text DEFAULT '' NOT NULL,
	`retomar_em` text DEFAULT '' NOT NULL,
	`arquivo_motivo` text DEFAULT '' NOT NULL,
	`arquivo_obs` text DEFAULT '' NOT NULL,
	`proximo_followup` text DEFAULT '' NOT NULL,
	`observacoes` text DEFAULT '' NOT NULL,
	`triagem` text DEFAULT '{}' NOT NULL,
	`primeiro_contato_em` integer,
	`fechado_em` integer,
	`versao` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `leads_whatsapp_idx` ON `leads` (`whatsapp`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `leads_email_idx` ON `leads` (`email`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `leads_funil_idx` ON `leads` (`situacao`,`etapa`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lead_eventos` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL REFERENCES `leads`(`id`) ON DELETE CASCADE,
	`acao` text NOT NULL,
	`de` text DEFAULT '' NOT NULL,
	`para` text DEFAULT '' NOT NULL,
	`autor_id` text DEFAULT '' NOT NULL,
	`autor_nome` text DEFAULT '' NOT NULL,
	`comentario` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lead_eventos_lead_idx` ON `lead_eventos` (`lead_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lead_entradas` (
	`id` text PRIMARY KEY NOT NULL,
	`recebido_em` integer NOT NULL,
	`origem` text DEFAULT '' NOT NULL,
	`content_type` text DEFAULT '' NOT NULL,
	`payload` text DEFAULT '' NOT NULL,
	`resultado` text NOT NULL,
	`lead_id` text,
	`erro` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lead_entradas_recebido_idx` ON `lead_entradas` (`recebido_em`);
--> statement-breakpoint
-- Leads do CRM antigo (registros CRMLead do JSON de módulos) passam para a tabela nova, com as etapas do PDF.
WITH crm AS (
  SELECT r.value AS v,
         replace(replace(replace(replace(replace(replace(coalesce(json_extract(r.value,'$.data.telefone'),''),' ',''),'-',''),'(',''),')',''),'+',''),'.','') AS tel,
         json_extract(r.value,'$.data.status') AS st
  FROM `connect_state` s, json_each(s.payload,'$.records') r
  WHERE s.id='connect-modules-v1' AND json_extract(r.value,'$.entity')='CRMLead'
)
INSERT OR IGNORE INTO `leads` (`id`,`nome`,`empresa`,`whatsapp`,`email`,`segmento`,`etapa`,`situacao`,`arquivo_motivo`,`arquivo_obs`,`observacoes`,`origem`,`created_at`,`updated_at`)
SELECT json_extract(v,'$.id'),
       coalesce(json_extract(v,'$.data.nome_contato'),''),
       coalesce(json_extract(v,'$.data.nome_empresa'),''),
       CASE WHEN length(tel) IN (10,11) THEN '55'||tel ELSE tel END,
       lower(trim(coalesce(json_extract(v,'$.data.email'),''))),
       coalesce(json_extract(v,'$.data.segmento'),''),
       CASE st WHEN 'reuniao_marcada' THEN 'reuniao' WHEN 'proposta' THEN 'proposta' WHEN 'negociacao' THEN 'negociacao'
               WHEN 'contrato' THEN 'fechado' WHEN 'onboarding' THEN 'fechado' WHEN 'cliente_ativo' THEN 'fechado' ELSE 'novo' END,
       CASE st WHEN 'cancelado' THEN 'arquivado' ELSE 'andamento' END,
       CASE WHEN st='cancelado' THEN CASE json_extract(v,'$.data.motivo_cancelamento')
         WHEN 'sem_retorno' THEN 'nao_respondeu' WHEN 'valor_alto' THEN 'preco' WHEN 'fechou_concorrente' THEN 'outra_empresa'
         WHEN 'desistiu' THEN 'sem_interesse' ELSE 'outro' END ELSE '' END,
       coalesce(json_extract(v,'$.data.observacoes_cancelamento'),''),
       coalesce(json_extract(v,'$.data.observacoes'),''),
       'crm_antigo',
       CAST(strftime('%s','now') AS INTEGER)*1000, CAST(strftime('%s','now') AS INTEGER)*1000
FROM crm WHERE json_extract(v,'$.id') IS NOT NULL;
