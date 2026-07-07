import JSZip from 'jszip';
import { writeExif } from './exifWriter';
import type { WriteExifOptions } from './exifWriter';
import type { FrameItem } from '../types/frame';

function rotateBlob(file: File, degrees: 90 | 180 | 270): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const swapped = degrees === 90 || degrees === 270;
            const w = swapped ? img.naturalHeight : img.naturalWidth;
            const h = swapped ? img.naturalWidth : img.naturalHeight;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.translate(w / 2, h / 2);
            ctx.rotate((degrees * Math.PI) / 180);
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob 실패'))),
                'image/jpeg',
                0.95,
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')); };
        img.src = url;
    });
}

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

// JSZip은 DOS 시간을 getUTC*로 기록하지만 ZIP 포맷엔 타임존이 없어 OS가 로컬로 해석한다.
// 오프셋만큼 당겨 로컬 벽시계 값이 UTC 필드에 담기게 보정한다.
function zipLocalDate(): Date {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000);
}

const DEFAULT_SUFFIX = '_fixif';

export async function exportFrames(
    frames: FrameItem[],
    suffix = DEFAULT_SUFFIX,
    options: WriteExifOptions = {},
): Promise<void> {
    if (frames.length === 0) return;

    const toSource = async (frame: FrameItem): Promise<Blob> =>
        frame.rotation !== 0 ? rotateBlob(frame.file, frame.rotation) : frame.file;

    if (frames.length === 1) {
        const frame = frames[0];
        const source = await toSource(frame);
        const blob = await writeExif(source, frame.meta, options);
        triggerDownload(blob, buildFilename(frame.file.name, suffix));
        return;
    }

    const zip = new JSZip();
    await Promise.all(
        frames.map(async (frame) => {
            const source = await toSource(frame);
            const blob = await writeExif(source, frame.meta, options);
            zip.file(buildFilename(frame.file.name, suffix), blob, { date: zipLocalDate() });
        }),
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, `fixif-export-${buildZipStamp()}.zip`);
}
