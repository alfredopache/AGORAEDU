import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const entries = await fs.readdir(dataDir, { withFileTypes: true })
    const rootFiles = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.json')).map(e => e.name)

    let subjectFiles: string[] = []
    try {
      const asignaturasDir = path.join(dataDir, 'asignaturas')
      const subEntries = await fs.readdir(asignaturasDir, { withFileTypes: true })
      subjectFiles = subEntries
        .filter(e => e.isFile() && e.name.toLowerCase().endsWith('_index.json'))
        .map(e => `asignaturas/${e.name}`)
    } catch {
      // Directory may not exist yet in all environments
    }

    return NextResponse.json({ datasets: [...rootFiles, ...subjectFiles] })
  } catch (err) {
    return NextResponse.json({ datasets: [], error: String(err) }, { status: 500 })
  }
}
