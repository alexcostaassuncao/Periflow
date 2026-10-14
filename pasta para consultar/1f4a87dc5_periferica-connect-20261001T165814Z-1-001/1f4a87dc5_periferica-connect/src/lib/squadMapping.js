/**
 * Mapeamento fixo de clientes por Carteira/Squad
 * Normalização: remove acentos, maiúsculas, espaços extras
 */

export const SQUAD_MAPPING = {
  'Carteira C1': [
    'Elegance Cortinas',
    'Filetto Uniformes',
    'Filleto Uniformes',
    'Parque das Águas',
    'Miner Tecnologia',
    'SEDIA Soluções Texteis',
    'Fontana Team',
    'QÓculos',
    'Qoculos',
    'Darolt & Colere',
    'Casa da Finestra',
    'Eloway',
    'Leal, Viscardi e Zanetti Adv',
    'Leal, Viscard e Zanetti Adv',
    'Supermercados Manenti',
    'Mais Atacadista (Manenti)',
    'Ana Terra Café',
    'ARCTOS',
  ],
  'Carteira C2': [
    'Casa Colonial Hermes',
    'Oficina do Estudo Presen.',
    'Oficina do Estudo Presencial',
    'Oficina do Estudo',
    'Oficina do Estudo Online',
    'Casa da Construção',
    'Supermercado dos Amigos',
    'Globalnet',
    'Mercado Doce',
    'Redeol',
    'Redeol Internet',
    'Kubi',
    'Kubi Telecom',
    'Embutidos Siebert',
    'Air Sell',
    'Airsell Locações',
    'CS Imoveis',
    'M2 Uniformes',
    'Natureza Bistrô',
    'SR Odontologia',
    'Stúdio de Fotos Danda',
    'Bellalima Engenharia',
    'Starfest',
    'SA',
    'SA Distribuidora',
  ],
  'Carteira C3': [
    'Estação Lanches',
    'MFB Engenharia',
    'MFB Condomínios',
    'Trans. Fluorita',
    'M-Con Contabilidade',
    'M-Con Contabilidade',
    'Motel Mais',
    'SA Eletrônicos Distribuid.',
    'SA Eletrônicos Distribuidora',
    'ASQCERT',
    'ASQCERT Certificados',
    'Santo Boteco',
    'JDA Soluções',
    'IcastGlass',
    'Ana Terra Café',
    'BRACEN',
    'BRACEN Sports',
    'GastronSul',
    'Starfest',
    'Grupo CR',
    'Atual Contabilidade',
    'Ecosolar',
    'Inoove Contabilidade',
    'Inoove Contabil',
    'Sorridents Vila Medeiros',
  ],
};

/**
 * Normaliza string: remove acentos, converte para maiúsculas, remove espaços extras
 */
export function normalizeNome(nome = '') {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,\-&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Mapa normalizado para busca rápida: norma => squad
const _normMap = {};
Object.entries(SQUAD_MAPPING).forEach(([squad, clientes]) => {
  clientes.forEach(c => {
    const norm = normalizeNome(c);
    if (!_normMap[norm]) _normMap[norm] = squad;
  });
});

/**
 * Retorna o squad da carteira dado o nome do workspace/cliente
 * Retorna null se não encontrado
 */
export function getSquadForWorkspace(nome = '') {
  const norm = normalizeNome(nome);
  // Busca exata
  if (_normMap[norm]) return _normMap[norm];
  // Busca parcial: se o norm contém ou está contido em alguma chave
  for (const [key, squad] of Object.entries(_normMap)) {
    if (norm.includes(key) || key.includes(norm)) {
      if (Math.abs(norm.length - key.length) <= 8) return squad;
    }
  }
  return null;
}

/**
 * Retorna lista de clientes de um squad
 */
export function getClientesDoSquad(squadNome) {
  return SQUAD_MAPPING[squadNome] || [];
}