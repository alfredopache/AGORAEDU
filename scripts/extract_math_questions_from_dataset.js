const fs = require('fs');
const path = require('path');

const DATA_JSON = path.join(__dirname, '..', 'data', 'W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json');
const OUT_DIR = path.join(__dirname, '..', 'data', 'asignaturas');
const OUT_FILE = path.join(OUT_DIR, 'math_questions_from_dataset.json');

function safeGet(obj, key) {
  return obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : null;
}

function isMathEntry(q) {
  if (!q) return false;
  const materia = (safeGet(q, 'Materia') || '').toString();
  if (/matem/i.test(materia)) return true;
  const alias = (safeGet(q, 'ALIAS_PREGUNTA') || '').toString();
  if (/matem/i.test(alias)) return true;
  const tema = (safeGet(q, 'Tema') || '').toString();
  if (/matem/i.test(tema)) return true;
  // Heurística: preguntas con símbolos matemáticos o números seguidos de operaciones
  const pregunta = (safeGet(q, 'Pregunta') || '').toString();
  if (/[0-9]+\s*[+\-×x\*\/=√^()]/.test(pregunta)) return true;
  return false;
}

function normalize(q) {
  return {
    id: safeGet(q, 'ID'),
    year: safeGet(q, 'Año') || safeGet(q, 'Year') || null,
    materia: safeGet(q, 'Materia') || null,
    competencia: safeGet(q, 'Competencia') || null,
    tipo: safeGet(q, 'Tipo') || null,
    pregunta: safeGet(q, 'Pregunta') || null,
    tema: safeGet(q, 'Tema') || null,
    dificultad: safeGet(q, 'Dificultad') || null,
    explicacion: safeGet(q, 'Explicación') || safeGet(q, 'Explicacion') || null,
    pista: safeGet(q, 'Pista') || null,
    opciones: safeGet(q, 'OPCIONES_CERRADAS') || null,
    respuesta_correcta: safeGet(q, 'RESPUESTA_CORRECTA') || null,
    rubrica: safeGet(q, 'RUBRICA_MODELO') || null,
    tiempo_estimado: safeGet(q, 'TIEMPO_ESTIMADO') || null,
    nivel_taxonomia: safeGet(q, 'NIVEL_TAXONOMIA') || null,
    alias: safeGet(q, 'ALIAS_PREGUNTA') || null,
    fuente: 'W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json'
  };
}

function main() {
  if (!fs.existsSync(DATA_JSON)) {
    console.error('Dataset JSON not found at', DATA_JSON);
    process.exit(1);
  }
  const raw = fs.readFileSync(DATA_JSON, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing dataset JSON:', e && e.message ? e.message : e);
    process.exit(1);
  }
  const dataset = parsed.dataset_preguntas || parsed['dataset_preguntas'] || [];
  const math = dataset.filter(isMathEntry).map(normalize);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), count: math.length, items: math }, null, 2), 'utf8');
  console.log('Math questions extracted:', math.length, '->', OUT_FILE);
}

main();
