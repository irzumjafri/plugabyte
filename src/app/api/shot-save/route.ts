import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

/**
 * Writes a frame from /shot-rig into public/ghost/.
 *
 * Development only, and it refuses anything but a bare filename: this writes to
 * the repo, so it must not exist in a deployed build and must not accept a path.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not available' }, { status: 404 });
  }

  const { name, dataUrl } = await req.json();
  if (typeof name !== 'string' || !/^[a-z0-9-]+\.png$/.test(name)) {
    return NextResponse.json({ error: 'bad name' }, { status: 400 });
  }
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 });
  }

  const dir = path.join(process.cwd(), 'public', 'ghost');
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64');
  await writeFile(path.join(dir, name), buf);
  return NextResponse.json({ ok: true, bytes: buf.length });
}
