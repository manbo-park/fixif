import exifr from 'exifr';
import type { FrameMeta } from '../types/frame';

const EXIF_TAGS = [
    'DateTimeOriginal',
    'Make',
    'Model',
    'LensModel',
    'FNumber',
    'ExposureTime',
    'ISO',
    'UserComment',
    'latitude',
    'longitude',
] as const;

export async function readExif(file: File): Promise<FrameMeta> {
    try {
        const data = await exifr.parse(file, { pick: [...EXIF_TAGS], gps: true });
        if (!data) return emptyMeta();

        const lat = typeof data.latitude === 'number' ? data.latitude : null;
        const lng = typeof data.longitude === 'number' ? data.longitude : null;

        return {
            dateTimeOriginal: data.DateTimeOriginal instanceof Date ? data.DateTimeOriginal : null,
            make: typeof data.Make === 'string' ? data.Make.trim() || null : null,
            model: typeof data.Model === 'string' ? data.Model.trim() || null : null,
            lensModel: typeof data.LensModel === 'string' ? data.LensModel.trim() || null : null,
            fNumber: typeof data.FNumber === 'number' ? data.FNumber : null,
            exposureTime: typeof data.ExposureTime === 'number' ? formatShutter(data.ExposureTime) : null,
            iso: typeof data.ISO === 'number' ? data.ISO : null,
            userComment: parseUserComment(data.userComment),
            gps: lat !== null && lng !== null ? { lat, lng } : null,
        };
    } catch {
        return emptyMeta();
    }
}

export async function readThumbnail(file: File): Promise<string | null> {
    try {
        const thumb = await exifr.thumbnail(file);
        if (thumb) {
            const blob = new Blob([thumb], { type: 'image/jpeg' });
            return URL.createObjectURL(blob);
        }
    } catch {
        // no thumbnail in EXIF
    }
    return null;
}

function parseUserComment(raw: unknown): string | null {
    if (typeof raw === 'string') {
        // exifr가 8바이트 인코딩 prefix(null 문자)를 포함한 문자열로 반환
        // trim()은 \0을 제거하지 않으므로 별도 처리
        return raw.replace(/^\0+/, '').trim() || null;
    }
    if (ArrayBuffer.isView(raw)) {
        const arr = new Uint8Array(
            (raw as ArrayBufferView).buffer,
            (raw as ArrayBufferView).byteOffset,
            (raw as ArrayBufferView).byteLength,
        );
        return new TextDecoder('utf-8').decode(arr.slice(8)).trim() || null;
    }
    return null;
}

function formatShutter(val: number): string {
    if (val >= 1) return `${val}"`;
    const inv = Math.round(1 / val);
    return `1/${inv}`;
}

function emptyMeta(): FrameMeta {
    return {
        dateTimeOriginal: null,
        make: null,
        model: null,
        lensModel: null,
        fNumber: null,
        exposureTime: null,
        iso: null,
        userComment: null,
        gps: null,
    };
}
