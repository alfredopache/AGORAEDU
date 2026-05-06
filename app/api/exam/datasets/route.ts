import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const entries = await fs.readdir(dataDir, { withFileTypes: true })
    const files = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.json')).map(e => e.name)
    return NextResponse.json({ datasets: files })
  } catch (err) {
    return NextResponse.json({ datasets: [], error: String(err) }, { status: 500 })
  }
}
