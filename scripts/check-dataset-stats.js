const fs = require('fs')
const path = require('path')
const file = path.join(process.cwd(), 'data', 'W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json')
if (!fs.existsSync(file)) { console.error('File not found', file); process.exit(1) }
const raw = fs.readFileSync(file, 'utf8')
let json
try { json = JSON.parse(raw) } catch (err) { console.error('JSON parse error', err); process.exit(1) }
const items = json.dataset_preguntas || json.dataset || json.items || []

function parseClosedOptions(raw) {
  if (!raw) return []
  const parts = raw.split(/\s*\|\s*|;|\r?\n/).map(s => s.trim()).filter(Boolean)
  return parts.map(p => p.replace(/^[A-Z]\)\s*/i, '').replace(/^[A-Z]\.\s*/i, '').replace(/^\([A-Z]\)\s*/i, '').trim())
}

function parseCorrectIndex(resp, options) {
  if (!resp) return -1
  const r = String(resp).trim()
  const letter = r.match(/^['"]?([A-Z])[\)\.]?/i)
  if (letter) {
    const idx = letter[1].toUpperCase().charCodeAt(0) - 65
    if (idx >= 0 && idx < options.length) return idx
  }
  const letter2 = r.match(/([A-Z])(?!.*[A-Z])/) // last letter
  if (letter2) {
    const idx = letter2[1].toUpperCase().charCodeAt(0) - 65
    if (idx >= 0 && idx < options.length) return idx
  }
  const lowResp = r.replace(/^"|"$/g, '').toLowerCase()
  for (let i = 0; i < options.length; i++) {
    const opt = options[i].toLowerCase()
    if (opt === lowResp || opt.includes(lowResp) || lowResp.includes(opt)) return i
  }
  return -1
}

let total = items.length
let closedCount = 0
let closedWithOpts = 0
let closedWithCorrect = 0

for (const item of items) {
  const opts = parseClosedOptions(item.OPCIONES_CERRADAS || item.OPCIONES || item.OPTIONS || '')
  if (opts.length > 0) {
    closedCount++
    closedWithOpts++
    const corr = parseCorrectIndex(item.RESPUESTA_CORRECTA || item.RESPUESTA_MODELO || item.RESPUESTA_MODELO_EXCELENTE || item.RESPUESTA || '', opts)
    if (corr >= 0) closedWithCorrect++
  }
}

console.log('Total preguntas en dataset:', total)
console.log('Preguntas con opciones detectadas (cerradas):', closedCount)
console.log('De esas, con respuesta correcta detectada:', closedWithCorrect)
console.log('Porcentaje de cerradas con respuesta detectada:', closedCount>0 ? ((closedWithCorrect/closedCount)*100).toFixed(2) + '%' : 'N/A')
