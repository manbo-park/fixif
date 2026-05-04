import type { FiloPayload } from '../types/filo';

async function decodeGzipBase64(b64: string): Promise<string> {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    writer.write(bytes);
    writer.close();

    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    const total = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return new TextDecoder().decode(result);
}

export async function decodeClipboardPayload(text: string): Promise<FiloPayload | null> {
    const PREFIX = 'FIXIF1:';
    if (!text.startsWith(PREFIX)) return null;
    try {
        const b64 = text.slice(PREFIX.length);
        const json = await decodeGzipBase64(b64);
        const payload = JSON.parse(json) as FiloPayload;
        if (payload.v !== 1 || !payload.roll || !Array.isArray(payload.roll.frames)) return null;
        return payload;
    } catch {
        return null;
    }
}
