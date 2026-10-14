const USER_KEY = 'periferica_local_user_v1';
const COLLECTION_PREFIX = 'periferica_local_collection_v1:';
const CHANGE_EVENT = 'periferica:local-data-change';

const clone = value => JSON.parse(JSON.stringify(value));

function readCollection(name) {
  try {
    return JSON.parse(localStorage.getItem(`${COLLECTION_PREFIX}${name}`) || '[]');
  } catch {
    return [];
  }
}

function writeCollection(name, records) {
  localStorage.setItem(`${COLLECTION_PREFIX}${name}`, JSON.stringify(records));
}

function matches(record, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    if (expected === undefined) return true;
    const actual = record[key];
    if (expected === null) return actual == null;
    if (Array.isArray(actual)) return actual.includes(expected);
    return actual === expected;
  });
}

function sortRecords(records, sortBy) {
  if (!sortBy) return records;
  const descending = sortBy.startsWith('-');
  const field = descending ? sortBy.slice(1) : sortBy;
  return records.sort((left, right) => {
    const a = left[field] ?? '';
    const b = right[field] ?? '';
    const result = a > b ? 1 : a < b ? -1 : 0;
    return descending ? -result : result;
  });
}

function notify(name, type, data) {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, {
    detail: { entity_name: name, type, data: clone(data) },
  }));
}

function createEntity(name) {
  return {
    async list(sortBy, limit) {
      const records = sortRecords(readCollection(name), sortBy);
      return clone(typeof limit === 'number' ? records.slice(0, limit) : records);
    },
    async filter(query = {}, sortBy, limit) {
      const records = sortRecords(readCollection(name).filter(record => matches(record, query)), sortBy);
      return clone(typeof limit === 'number' ? records.slice(0, limit) : records);
    },
    async create(data) {
      const now = new Date().toISOString();
      const record = {
        id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        created_date: now,
        updated_date: now,
        ...clone(data),
      };
      writeCollection(name, [...readCollection(name), record]);
      notify(name, 'create', record);
      return clone(record);
    },
    async update(id, updates) {
      const records = readCollection(name);
      const index = records.findIndex(record => record.id === id);
      if (index < 0) throw new Error(`${name} record not found: ${id}`);
      records[index] = { ...records[index], ...clone(updates), updated_date: new Date().toISOString() };
      writeCollection(name, records);
      notify(name, 'update', records[index]);
      return clone(records[index]);
    },
    async delete(id) {
      const records = readCollection(name);
      const removed = records.find(record => record.id === id);
      writeCollection(name, records.filter(record => record.id !== id));
      if (removed) notify(name, 'delete', removed);
      return clone(removed);
    },
    async bulkCreate(items) {
      const created = [];
      for (const item of items) created.push(await this.create(item));
      return created;
    },
    subscribe(callback) {
      const listener = event => {
        if (event.detail.entity_name === name) callback(event.detail);
      };
      window.addEventListener(CHANGE_EVENT, listener);
      return () => window.removeEventListener(CHANGE_EVENT, listener);
    },
  };
}

const entityCache = new Map();
const entities = new Proxy({}, {
  get(_target, name) {
    if (!entityCache.has(name)) entityCache.set(name, createEntity(name));
    return entityCache.get(name);
  },
});

function getUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      const user = JSON.parse(stored);
      ensureUserRecords(user);
      return user;
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }

  const user = {
    id: 'local-admin',
    full_name: 'alex costa',
    email: 'alex@periferica.local',
    role: 'admin',
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  ensureUserRecords(user);
  return user;
}

function ensureUserRecords(user) {
  const users = readCollection('User');
  if (!users.some(record => record.id === user.id)) writeCollection('User', [...users, user]);

  const employees = readCollection('Employee');
  if (!employees.some(record => record.user_id === user.id)) {
    writeCollection('Employee', [...employees, {
      id: 'local-admin-employee',
      user_id: user.id,
      email: user.email,
      full_name: user.full_name,
      position: 'Administrador',
      carteira: 'c1',
      status: 'ativo',
      xp_total: 0,
      current_level: 1,
    }]);
  }
}

function decodeDataUrl(dataUrl) {
  const [, metadata = '', encoded = ''] = dataUrl.match(/^data:([^,]*?),(.*)$/s) || [];
  const binary = metadata.includes(';base64')
    ? Uint8Array.from(atob(encoded), character => character.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(encoded));
  return new TextDecoder().decode(binary);
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  const parseLine = line => {
    const cells = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"' && quoted) {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        cells.push(value.trim());
        value = '';
      } else {
        value += character;
      }
    }
    cells.push(value.trim());
    return cells;
  };
  const headers = parseLine(lines[0]).map(header => header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ''));
  const aliases = {
    name: ['name', 'nome', 'item', 'equipamento'],
    nome: ['nome', 'name', 'item', 'equipamento'],
    code: ['code', 'codigo', 'patrimonio'],
    codigo: ['codigo', 'code', 'patrimonio'],
    quantity: ['quantity', 'quantidade', 'qtd'],
    quantidade: ['quantidade', 'quantity', 'qtd'],
    category: ['category', 'categoria'],
    categoria: ['categoria', 'category'],
    description: ['description', 'descricao'],
    descricao: ['descricao', 'description'],
    status: ['status', 'situacao'],
    location: ['location', 'localizacao'],
    localizacao: ['localizacao', 'location'],
    responsible_name: ['responsiblename', 'responsavel', 'responsavelnome'],
    responsavel: ['responsavel', 'responsiblename', 'responsavelnome'],
    observations: ['observations', 'observacoes'],
    observacoes: ['observacoes', 'observations'],
    numero_serie: ['numeroserie', 'serial', 'serialnumber'],
    modelo: ['modelo', 'model'],
    marca: ['marca', 'brand'],
    setor: ['setor', 'department'],
    data_aquisicao: ['dataaquisicao', 'purchaseDate'],
  };

  return lines.slice(1).map(parseLine).map(cells => {
    const row = {};
    headers.forEach((header, index) => { row[header] = cells[index] ?? ''; });
    return Object.fromEntries(Object.entries(aliases).flatMap(([field, names]) => {
      const header = names.find(name => row[name] !== undefined);
      return header ? [[field, row[header]]] : [];
    }));
  }).filter(row => Object.values(row).some(Boolean));
}

const localApp = {
  entities,
  auth: {
    async me() { return getUser(); },
    async updateMe(updates) {
      const user = { ...getUser(), ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      ensureUserRecords(user);
      return clone(user);
    },
    async logout() { return undefined; },
    async redirectToLogin() { return undefined; },
    async resetPasswordRequest() {
      throw new Error('Recuperação de senha não está disponível no modo local.');
    },
    isAuthenticated() { return true; },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const fileUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        return { file_url: fileUrl };
      },
      async ExtractDataFromUploadedFile({ file_url }) {
        try {
          const text = decodeDataUrl(file_url);
          const items = parseCsv(text);
          return items.length
            ? { status: 'success', output: { items } }
            : { status: 'error', output: { items: [] } };
        } catch {
          return { status: 'error', output: { items: [] } };
        }
      },
    },
  },
};

export { localApp };