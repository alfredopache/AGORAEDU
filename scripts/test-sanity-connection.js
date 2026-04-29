const fs = require('fs')
const path = require('path')
const https = require('https')

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  const obj = {}
  for (let line of lines) {
    line = line.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.substring(0, idx).trim()
    let val = line.substring(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    obj[key] = val
  }
  return obj
}

const envFile = path.resolve(process.cwd(), '.env.local')
const envObj = parseDotEnv(envFile)
Object.keys(envObj).forEach(k => { if (process.env[k] === undefined) process.env[k] = envObj[k] })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-13'
const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_KEY || process.env.SANITY_GROQ_API_KEY

if (!projectId || !dataset) {
  console.error('Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET')
  process.exit(1)
}

const query = '*[_type == "post"][0..2]{_id,_type,title}'
const q = encodeURIComponent(query)
const urlStr = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${q}`

console.log('Requesting:', urlStr)

const u = new URL(urlStr)
const options = {
  hostname: u.hostname,
  path: u.pathname + u.search,
  method: 'GET',
  port: u.port || 443,
  headers: {
    Accept: 'application/json',
  },
}
if (groqKey) options.headers.Authorization = `Bearer ${groqKey}`

const req = https.request(options, res => {
  let body = ''
  res.setEncoding('utf8')
  res.on('data', d => body += d)
  res.on('end', () => {
    console.log('HTTP status:', res.statusCode)
    try {
      const json = JSON.parse(body)
      console.log('Response keys:', Object.keys(json))
      if (Array.isArray(json.result)) {
        console.log('Result length:', json.result.length)
        console.log('Sample result:', JSON.stringify(json.result.slice(0,3), null, 2))
      } else {
        console.log('Full response:', JSON.stringify(json, null, 2))
      }
    } catch (e) {
      console.log('Non-JSON response body:', body)
    }
  })
})
req.on('error', err => {
  console.error('Request error:', err.message || err)
})
req.end()
