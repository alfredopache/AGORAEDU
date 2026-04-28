const fs = require('fs')
const path = require('path')
;(function(){
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

  const sampleCount = 10
  const sample = items.slice(0, sampleCount).map(item => {
    const opts = parseClosedOptions(item.OPCIONES_CERRADAS || item.OPCIONES || item.OPTIONS || '')
    const corr = parseCorrectIndex(item.RESPUESTA_CORRECTA || item.RESPUESTA_MODELO || item.RESPUESTA_MODELO_EXCELENTE || item.RESPUESTA || '', opts)
    return {
      id: item.ID_Unico || item.ID,
      tipo: item.Tipo || item.TIPO || (opts.length>0 ? 'Cerrada' : 'Abierta') || 'unknown',
      pregunta: item.Pregunta || item.question || '',
      opciones: opts,
      correctIndex: corr,
      correctText: opts[corr] || null,
      apta_motor: item.APTA_MOTOR,
      apta_chatbot: item.APTA_CHATBOT
    }
  })

  const foundWithCorrect = sample.filter(s => s.correctIndex >= 0).length
  console.log('Total preguntas en dataset:', items.length)
  console.log('Muestra de primeras', sampleCount)
  console.log(JSON.stringify(sample, null, 2))
  console.log(`De la muestra, ${foundWithCorrect}/${sampleCount} tienen respuesta correcta detectada (correctIndex >=0)`)
})()
