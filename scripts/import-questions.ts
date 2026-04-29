import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

dotenv.config({ path: '.env.local' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_WRITE_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
})

function mapSubject(materia?: string) {
  if (!materia) return 'general'
  const m = materia.toLowerCase()
  if (m.includes('matem')) return 'matematicas'
  if (m.includes('ingl')) return 'ingles'
  if (m.includes('leng')) return 'lengua'
  if (m.includes('hist') || m.includes('geogr') || m.includes('social')) return 'sociales'
  if (m.includes('natur') || m.includes('cienc')) return 'sociales'
  return 'general'
}

function mapDifficulty(d?: any) {
  const n = Number(d)
  if (isNaN(n)) return d === 'avanzado' ? 'avanzado' : 'intermedio'
  if (n <= 1) return 'basico'
  if (n === 2) return 'intermedio'
  return 'avanzado'
}

function parseClosedOptions(raw?: string) {
  if (!raw) return []
  // Split by pipes, semicolons or newlines
  const parts = raw.split(/\s*\|\s*|;|\r?\n/).map(s => s.trim()).filter(Boolean)
  const cleaned = parts.map(p => p.replace(/^[A-Z]\)\s*/i, '').replace(/^[A-Z]\.\s*/i, '').replace(/^\([A-Z]\)\s*/i, '').trim())
  return cleaned
}

function parseCorrectIndex(resp: string | undefined, options: string[]) {
  if (!resp) return -1
  const r = resp.toString().trim()
  // Try letter A/B/C
  const letter = r.match(/^["']?([A-Z])[\)\.]?/i)
  if (letter) {
    const idx = letter[1].toUpperCase().charCodeAt(0) - 65
    if (idx >= 0 && idx < options.length) return idx
  }
  // Try numeric index like 1, 2, 3 (common in some exports)
  const num = r.match(/^([1-9])[\)\.]?$/)
  if (num) {
    const idx = Number(num[1]) - 1
    if (idx >= 0 && idx < options.length) return idx
  }
  // Try single letter anywhere
  const letter2 = r.match(/([A-Z])(?!.*[A-Z])/) // last letter
  if (letter2) {
    const idx = letter2[1].toUpperCase().charCodeAt(0) - 65
    if (idx >= 0 && idx < options.length) return idx
  }
  // Try to match by text
  const lowResp = r.replace(/^"|"$/g, '').toLowerCase()
  for (let i = 0; i < options.length; i++) {
    const opt = options[i].toLowerCase()
    if (opt === lowResp || opt.includes(lowResp) || lowResp.includes(opt)) return i
  }
  return -1
}

async function run() {
  const fileArg = process.argv[2] || 'data/W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json'
  const filePath = path.join(process.cwd(), fileArg)
  if (!fs.existsSync(filePath)) {
    console.error('No se encontró el archivo:', filePath)
    process.exit(1)
  }

  console.log('Leyendo archivo:', filePath)
  const raw = fs.readFileSync(filePath, 'utf8')
  let json
  try {
    json = JSON.parse(raw)
  } catch (err) {
    console.error('Error parseando JSON:', err)
    process.exit(1)
  }

  const items = json.dataset_preguntas || json.dataset || []
  console.log('Preguntas encontradas:', items.length)

  let imported = 0
  let skipped = 0
  const report: Array<{ id: string; status: string; reason?: string }> = []

  for (const item of items) {
    try {
      const idUnico = item.ID_Unico || (item.ID ? `ID-${item.ID}` : undefined)
      const _id = idUnico ? `examQuestion-${idUnico}` : undefined

      const optionsText = parseClosedOptions(item.OPCIONES_CERRADAS || item.OPCIONES || '')
      const correctIndex = parseCorrectIndex(item.RESPUESTA_CORRECTA || item.RESPUESTA_MODELO || item.RESPUESTA_MODELO_EXCELENTE || '', optionsText)

      const doc: any = {
        _type: 'examQuestion',
        question: item.Pregunta || item.question || ('Sin enunciado ' + (item.ID || '')),
        subject: mapSubject(item.Materia),
        topic: item.Tema || item.SUBTEMA || item.topic || '',
        difficulty: mapDifficulty(item.Dificultad),
        explanation: [item.Explicación, item.RUBRICA_MODELO, item.RESPUESTA_MODELO_EXCELENTE].filter(Boolean).join('\n\n'),
        source: {
          name: item.FUENTE || item.FUENTE_TEXTO || item.FUENTE_TIEMPO || 'Desconocida',
          year: item.Año || null,
          region: item.FUENTE_TEXTO || item.FUENTE || 'Nacional',
        },
        tags: [item.Materia, item.Tema, item.SUBTEMA].filter(Boolean),
        isActive: (String(item.APTA_MOTOR || item.APTA_CHATBOT || item.APTA_MOTOR === true || item.APTA_CHATBOT === true) || '').toString().toLowerCase().startsWith('s'),
        // conservar campo original para trazabilidad
        original: item,
      }

      if (optionsText.length > 0) {
        doc.options = optionsText.map((t: string, i: number) => ({ text: t, isCorrect: i === correctIndex }))
      }

      if (_id) doc._id = _id

      // Create or replace
      if (doc._id) {
        await client.createOrReplace(doc)
      } else {
        await client.create(doc)
      }

      imported++
      report.push({ id: doc._id || doc.question.substring(0, 30), status: 'imported' })
    } catch (err:any) {
      skipped++
      report.push({ id: item.ID_Unico || item.ID || 'unknown', status: 'error', reason: String(err.message || err) })
      console.error('Error importando item', item.ID_Unico || item.ID, err)
    }
  }

  console.log(`Import completo — importadas: ${imported}, saltadas: ${skipped}`)
  fs.writeFileSync(path.join(process.cwd(), 'data', 'import-report.json'), JSON.stringify({ imported, skipped, report }, null, 2))
  console.log('Reporte guardado en data/import-report.json')
}

run().catch(err => { console.error(err); process.exit(1) })
