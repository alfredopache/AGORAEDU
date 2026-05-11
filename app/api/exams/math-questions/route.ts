import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const key = request.headers.get('x-accesso-ia-key') || url.searchParams.get('key') || null;
    const requiredKey = process.env.ACCESO_IA_KEY || null;

    if (requiredKey && key !== requiredKey) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const filePath = path.join(process.cwd(), 'data', 'asignaturas', 'math_questions_from_dataset.json');
    if (!fs.existsSync(filePath)) {
      return new NextResponse(JSON.stringify({ error: 'math_questions_from_dataset.json not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    const raw = await fs.promises.readFile(filePath, 'utf8');
    const json = JSON.parse(raw);
    return NextResponse.json(json);
  } catch (err) {
    const message = err && err instanceof Error ? err.message : String(err);
    return new NextResponse(JSON.stringify({ error: message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
