/**
 * extract-asignatura-questions.mjs
 *
 * Builds a metadata index for all PDF exams inside data/asignaturas.
 * AccesoIA uses this index to know which official exams exist per subject.
 *
 * Run once (or after adding new PDFs):
 *   node scripts/extract-asignatura-questions.mjs
 */

import { join, dirname, basename, extname, relative } from 'path'
import { fileURLToPath } from 'url'
import { readdir, stat, writeFile } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT = join(__dirname, '..')
const ASIGNATURAS_DIR = join(ROOT, 'data', 'asignaturas')

const SUBJECT_GROUPS = {
  matematicas: { keywords: ['matem'],                                                       label: 'Matemáticas',                                                scope: 'ambito_cientifico' },
  ingles:      { keywords: ['ingl', 'english', 'lengua extran'],                            label: 'Inglés',                                                     scope: 'ambito_linguistico' },
  lengua:      { keywords: ['lengua', 'llengua', 'literatura', 'castellan', 'valenci'],     label: 'Lengua y Literatura',                                        scope: 'ambito_linguistico' },
  tid:         { keywords: ['ticd', 'tid', 'tractament', 'tratamiento de la inform'],       label: 'Tratamiento de la Información y Competencia Digital',        scope: 'ambito_cientifico' },
  opcion_a:    { keywords: ['opcion a', 'opció a', 'humanidades', 'historia', 'geograf', 'econom', 'empresa'], label: 'Opción A – Humanidades y CC. Sociales (GS)', scope: 'ambito_linguistico' },
  opcion_b:    { keywords: ['opcion b', 'opció b', 'tecnolog', 'dibujo', 'dibuix', 'industrial'], label: 'Opción B – Tecnología (GS)',                           scope: 'ambito_cientifico' },
  opcion_c:    { keywords: ['opcion c', 'opció c', 'biolog', 'ciencias de la tierra', 'ciencies de la terra', 'quimica', 'química'], label: 'Opción C – Ciencias (GS)', scope: 'ambito_cientifico' },
}

function classifyFile(filePath) {
  const key = filePath.toLowerCase().replace(/[_-]/g, ' ')
  for (const [group, { keywords }] of Object.entries(SUBJECT_GROUPS)) {
    if (keywords.some(k => key.includes(k))) return group
  }
  return null
}

async function walkDir(dir, results = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await walkDir(full, results)
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.pdf') results.push(full)
  }
  return results
}

function extractTopic(filename) {
  const c = basename(filename, extname(filename)).replace(/[_-]/g, ' ').toLowerCase()
  if (/historia/.test(c))              return 'Historia del Mundo Contemporáneo'
  if (/geograf/.test(c))               return 'Geografía'
  if (/econom|empresa/.test(c))        return 'Economía de la Empresa'
  if (/tecnolog|industrial/.test(c))   return 'Tecnología Industrial'
  if (/dibujo|dibuix/.test(c))         return 'Dibujo Técnico'
  if (/biolog/.test(c))                return 'Biología y CC. de la Tierra'
  if (/fisic.*quim|quim.*fisic/.test(c)) return 'Física y Química'
  if (/física|fisica/.test(c))         return 'Física'
  if (/quim/.test(c))                  return 'Química'
  if (/parte\s+com[uú]n|part\s+com[uú]|parte\s+comun/.test(c)) return 'Parte Común'
  if (/parte\s+espec|part\s+espec/.test(c)) return 'Parte Específica'
  return basename(filename, extname(filename)).replace(/[_-]/g, ' ').trim()
}

async function main() {
  console.log('Indexando PDFs en', ASIGNATURAS_DIR)
  const allPdfs = await walkDir(ASIGNATURAS_DIR)
  console.log(allPdfs.length, 'PDFs encontrados\n')

  const grouped = {}
  let unclassified = 0
  for (const pdf of allPdfs) {
    const group = classifyFile(pdf)
    if (!group) { console.log('Sin clasificar:', basename(pdf)); unclassified++; continue }
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(pdf)
  }

  const masterIndex = { generatedAt: new Date().toISOString(), subjects: {} }

  for (const [group, pdfs] of Object.entries(grouped)) {
    const { label, scope } = SUBJECT_GROUPS[group]
    console.log('\n' + label, '-', pdfs.length, 'PDFs')
    const items = await Promise.all(pdfs.map(async pdf => {
      const info = await stat(pdf)
      return {
        filename: basename(pdf),
        path: relative(ROOT, pdf).replace(/\\/g, '/'),
        topic: extractTopic(basename(pdf)),
        sizeKb: Math.round(info.size / 1024),
      }
    }))
    items.sort((a, b) => a.filename.localeCompare(b.filename, 'es'))

    const outFile = join(ASIGNATURAS_DIR, group + '_index.json')
    await writeFile(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), subject: group, label, scope, count: items.length, items }, null, 2), 'utf-8')
    console.log('  Guardado:', outFile.replace(ROOT, ''), '(' + items.length + ' PDFs)')

    masterIndex.subjects[group] = {
      label, scope, count: items.length,
      indexFile: 'data/asignaturas/' + group + '_index.json',
      topics: [...new Set(items.map(i => i.topic))],
    }
  }

  await writeFile(join(ASIGNATURAS_DIR, 'index.json'), JSON.stringify(masterIndex, null, 2), 'utf-8')
  console.log('\nIndice maestro generado. Asignaturas:', Object.keys(grouped).length, '| Sin clasificar:', unclassified)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
