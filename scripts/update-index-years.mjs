/**
 * Scans every PDF in the subject index files, extracts the exam year from
 * the first 2000 chars of text, and writes a `year` field back to each item.
 *
 * Usage:  node scripts/update-index-years.mjs
 */

import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")
const require = createRequire(import.meta.url)

const INDEX_FILES = [
  "data/asignaturas/lengua_index.json",
  "data/asignaturas/ingles_index.json",
  "data/asignaturas/matematicas_index.json",
  "data/asignaturas/tid_index.json",
  "data/asignaturas/opcion_a_index.json",
  "data/asignaturas/opcion_b_index.json",
  "data/asignaturas/opcion_c_index.json",
]

/** Extract a 4-digit year from a string (2010-2030 range). */
function extractYear(text) {
  // Explicit 4-digit year
  const m4 = text.match(/\b(20(?:1[5-9]|2[0-9]))\b/)
  if (m4) return parseInt(m4[1], 10)
  // 2-digit suffix: _17, -17, " 17"
  const m2 = text.match(/[\s_\-./](1[5-9]|2[0-9])(?:[\s_\-.)]|$)/i)
  if (m2) {
    const y = parseInt(m2[1], 10)
    if (y >= 15 && y <= 35) return 2000 + y
  }
  return null
}

async function extractYearFromPdf(pdfAbsPath) {
  try {
    const pdfParse = require("pdf-parse")
    const buffer = await fs.readFile(pdfAbsPath)
    const data = await pdfParse(buffer, { max: 2 })
    return extractYear((data.text || "").slice(0, 4000))
  } catch (err) {
    console.error(`    PDF parse error for ${path.basename(pdfAbsPath)}: ${err.message}`)
    return null
  }
}

async function processIndex(relPath) {
  const absPath = path.join(projectRoot, relPath)
  let index
  try {
    index = JSON.parse(await fs.readFile(absPath, "utf-8"))
  } catch {
    console.warn(`  ⚠ Cannot read ${relPath}, skipping.`)
    return
  }

  let changed = false
  for (const item of index.items) {
    // Check filename first
    let year = extractYear(item.filename) ?? extractYear(item.topic ?? "")
    if (!year) {
      // Try to read from PDF content
      const pdfAbs = path.join(projectRoot, item.path)
      year = await extractYearFromPdf(pdfAbs)
    }
    if (year && item.year !== year) {
      item.year = year
      changed = true
    }
  }

  if (changed) {
    await fs.writeFile(absPath, JSON.stringify(index, null, 2), "utf-8")
    console.log(`  ✓ Updated ${relPath}`)
  } else {
    console.log(`  – No changes in ${relPath}`)
  }
}

console.log("Updating index year fields from PDF content…\n")
for (const rel of INDEX_FILES) {
  process.stdout.write(`Processing ${path.basename(rel)}… `)
  await processIndex(rel)
}
console.log("\nDone.")
