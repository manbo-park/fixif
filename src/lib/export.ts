import JSZip from 'jszip';
import { writeExif } from './exifWriter';
import type { FrameItem } from '../types/frame';

function buildFilename(originalName: string, suffix: string): string {
    const dot = originalName.lastIndexOf('.');
    if (dot !== -1) {
        return originalName.slice(0, dot) + suffix + originalName.slice(dot);
    }
    return originalName + suffix;
}

function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function buildZipStamp(): string {
    const now = new Date();
    const y = now.getFullYear();
    const mo = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const h = now.getHours().toString().padStart(2, '0');
    const mi = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    return `${y}${mo}${d}-${h}${mi}${s}`;
}

const DEFAULT_SUFFIX = '_fixif';

export async function exportFrames(frames: FrameItem[], suffix = DEFAULT_SUFFIX): Promise<void> {
    if (frames.length === 0) return;

    if (frames.length === 1) {
        const frame = frames[0];
        const blob = await writeExif(frame.file, frame.meta);
        triggerDownload(blob, buildFilename(frame.file.name, suffix));
        return;
    }

    const zip = new JSZip();
    await Promise.all(
        frames.map(async (frame) => {
            const blob = await writeExif(frame.file, frame.meta);
            zip.file(buildFilename(frame.file.name, suffix), blob);
        }),
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, `fixif-export-${buildZipStamp()}.zip`);
}
