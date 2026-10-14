/**
 * Parser de CSV exportado do eKyte — formato "Atividades por Workspace"
 * Encoding: UTF-8 com BOM (0xFEFF)
 * Delimitador: ;
 * Campos entre aspas duplas
 *
 * Colunas esperadas:
 * Workspace | Novas (Tarefas) | Concluídas (Tarefas) | Atrasaram (Tarefas) |
 * Esforço (Tarefas) | Qtd. Peças (Tarefas) | Quantidade de formulários (Tarefas) |
 * Quantidade de publicações (Tarefas) | Novos (Tickets) | Concluídos (Tickets) |
 * Esforço (Tickets) | Esforço (Outros) | Esforço (Total)
 */

function cleanCell(s = '') {
  return s.replace(/^["'\s]+|["'\s]+$/g, '').trim();
}

function toInt(s = '') {
  const n = parseInt(cleanCell(s), 10);
  return isNaN(n) ? 0 : n;
}

function splitLine(line, delim = ';') {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === delim && !inQ) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// Normaliza nome de cabeçalho para chave interna
function normalizeHeader(raw) {
  const s = raw.toLowerCase()
    .replace(/[^\w\s()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (s.includes('workspace')) return 'workspace';
  if (s.includes('nova') && s.includes('tarefa')) return 'novas';
  if (s.includes('conclu') && s.includes('tarefa')) return 'concluidas';
  if (s.includes('atrasaram') && s.includes('tarefa')) return 'atrasaram';
  if (s.includes('esfor') && s.includes('tarefa')) return 'esforco';
  if (s.includes('pe') && s.includes('tarefa')) return 'qtd_pecas';
  if (s.includes('formul') && s.includes('tarefa')) return 'qtd_formularios';
  if (s.includes('publica') && s.includes('tarefa')) return 'qtd_publicacoes';
  if (s.includes('nova') && s.includes('ticket')) return 'novos_tickets';
  if (s.includes('conclu') && s.includes('ticket')) return 'concluidos_tickets';
  return null;
}

/**
 * Parseia CSV do eKyte e retorna array de registros EkyteWorkspace
 * @param {string} text — conteúdo bruto do arquivo
 * @param {string} mesReferencia — "YYYY-MM"
 * @param {string} nomeArquivo
 * @returns {Array<Object>}
 */
export function parseEkyteCsv(text, mesReferencia = '', nomeArquivo = '') {
  // Remove BOM UTF-8
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r?\n/).filter(l => l.trim());

  if (lines.length < 2) return [];

  const delim = lines[0].includes(';') ? ';' : ',';
  const rawHeaders = splitLine(lines[0], delim).map(cleanCell);
  const mappedHeaders = rawHeaders.map(normalizeHeader);

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim).map(cleanCell);
    if (cells.every(c => !c)) continue;

    const row = {};
    mappedHeaders.forEach((field, idx) => {
      if (field) row[field] = cells[idx] || '';
    });

    if (!row.workspace) continue;

    const workspace = row.workspace.trim().toUpperCase().replace(/\s+/g, ' ');
    const chave_unica = `${workspace}|${mesReferencia}`;

    records.push({
      workspace,
      chave_unica,
      mes_referencia: mesReferencia,
      novas: toInt(row.novas),
      concluidas: toInt(row.concluidas),
      atrasaram: toInt(row.atrasaram),
      esforco: row.esforco || '',
      qtd_pecas: toInt(row.qtd_pecas),
      qtd_formularios: toInt(row.qtd_formularios),
      qtd_publicacoes: toInt(row.qtd_publicacoes),
      novos_tickets: toInt(row.novos_tickets),
      concluidos_tickets: toInt(row.concluidos_tickets),
      ultima_atualizacao_arquivo: nomeArquivo,
    });
  }

  return records;
}