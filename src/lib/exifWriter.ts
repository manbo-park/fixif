import piexif from 'piexifjs';
import type { FrameMeta } from '../types/frame';

// OffsetTimeOriginal (0x9011)은 EXIF 2.31 태그로 piexifjs TAGS 목록에 없음.
// dump() 내부가 TAGS[ifd][tag].type을 참조하므로 런타임에 직접 등록해야 함.
const OFFSET_TIME_ORIGINAL = 36881;
(piexif.TAGS as Record<string, Record<number, { name: string; type: string }>>)['Exif'][
    OFFSET_TIME_ORIGINAL
] = { name: 'OffsetTimeOriginal', type: 'Ascii' };

function gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b > 0) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function floatToRational(f: number): [number, number] {
    const precision = 10000;
    const n = Math.round(f * precision);
    const g = gcd(n, precision);
    return [n / g, precision / g];
}

function shutterToRational(s: string): [number, number] | null {
    if (s === 'B') return null;
    const longSecMatch = s.match(/^(\d+(?:\.\d+)?)"$/);
    if (longSecMatch) return floatToRational(parseFloat(longSecMatch[1]));
    const fracMatch = s.match(/^1\/(\d+)$/);
    if (fracMatch) return [1, parseInt(fracMatch[1], 10)];
    return null;
}

function formatExifDate(date: Date): string {
    const y = date.getFullYear().toString().padStart(4, '0');
    const mo = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const mi = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${y}:${mo}:${d} ${h}:${mi}:${s}`;
}

function decimalToDMS(decimal: number): [[number, number], [number, number], [number, number]] {
    const deg = Math.floor(decimal);
    const minFrac = (decimal - deg) * 60;
    const min = Math.floor(minFrac);
    const sec = (minFrac - min) * 60;
    return [[deg, 1], [min, 1], [Math.round(sec * 100), 100]];
}

function formatTimezoneOffset(date: Date): string {
    const offsetMin = -date.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const absMin = Math.abs(offsetMin);
    const h = Math.floor(absMin / 60).toString().padStart(2, '0');
    const m = (absMin % 60).toString().padStart(2, '0');
    return `${sign}${h}:${m}`;
}

// UserComment를 UTF-8 바이트로 인코딩 (8바이트 character code prefix 포함)
function encodeUserComment(text: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    // character code: 8 null bytes (undefined)
    const prefix = '\0\0\0\0\0\0\0\0';
    const body = Array.from(bytes)
        .map((b) => String.fromCharCode(b))
        .join('');
    return prefix + body;
}

async function fileToBinaryString(file: Blob): Promise<string> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let str = '';
    // 청크 단위로 처리하여 콜스택 오버플로 방지
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        str += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return str;
}

function binaryStringToBlob(str: string): Blob {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/jpeg' });
}

export interface WriteExifOptions {
    includeGps?: boolean;
    includeMemo?: boolean;
}

export async function writeExif(file: Blob, meta: FrameMeta, options: WriteExifOptions = {}): Promise<Blob> {
    const { includeGps = true, includeMemo = true } = options;
    const binaryStr = await fileToBinaryString(file);
    let exifObj: ReturnType<typeof piexif.load>;
    try {
        exifObj = piexif.load(binaryStr);
    } catch {
        exifObj = {} as ReturnType<typeof piexif.load>;
    }

    if (!exifObj['0th']) exifObj['0th'] = {};
    if (!exifObj['Exif']) exifObj['Exif'] = {};

    // Make
    if (meta.make !== null) {
        exifObj['0th'][piexif.ImageIFD.Make] = meta.make;
    } else {
        delete exifObj['0th'][piexif.ImageIFD.Make];
    }

    // Model
    if (meta.model !== null) {
        exifObj['0th'][piexif.ImageIFD.Model] = meta.model;
    } else {
        delete exifObj['0th'][piexif.ImageIFD.Model];
    }

    // DateTimeOriginal + OffsetTimeOriginal
    if (meta.dateTimeOriginal !== null) {
        exifObj['Exif'][piexif.ExifIFD.DateTimeOriginal] = formatExifDate(meta.dateTimeOriginal);
        exifObj['Exif'][OFFSET_TIME_ORIGINAL] = formatTimezoneOffset(meta.dateTimeOriginal);
    } else {
        delete exifObj['Exif'][piexif.ExifIFD.DateTimeOriginal];
        delete exifObj['Exif'][OFFSET_TIME_ORIGINAL];
    }

    // LensModel
    if (meta.lensModel !== null) {
        exifObj['Exif'][piexif.ExifIFD.LensModel] = meta.lensModel;
    } else {
        delete exifObj['Exif'][piexif.ExifIFD.LensModel];
    }

    // FNumber
    if (meta.fNumber !== null) {
        exifObj['Exif'][piexif.ExifIFD.FNumber] = floatToRational(meta.fNumber);
    } else {
        delete exifObj['Exif'][piexif.ExifIFD.FNumber];
    }

    // ExposureTime (셔터 "B"는 EXIF로 표현 불가 → 생략)
    if (meta.exposureTime !== null && meta.exposureTime !== '') {
        const rational = shutterToRational(meta.exposureTime);
        if (rational) {
            exifObj['Exif'][piexif.ExifIFD.ExposureTime] = rational;
        } else {
            delete exifObj['Exif'][piexif.ExifIFD.ExposureTime];
        }
    } else {
        delete exifObj['Exif'][piexif.ExifIFD.ExposureTime];
    }

    // ISOSpeedRatings
    if (meta.iso !== null) {
        exifObj['Exif'][piexif.ExifIFD.ISOSpeedRatings] = meta.iso;
    } else {
        delete exifObj['Exif'][piexif.ExifIFD.ISOSpeedRatings];
    }

    // UserComment (UTF-8 바이트로 저장)
    if (includeMemo && meta.userComment !== null && meta.userComment !== '') {
        exifObj['Exif'][piexif.ExifIFD.UserComment] = encodeUserComment(meta.userComment);
    } else {
        delete exifObj['Exif'][piexif.ExifIFD.UserComment];
    }

    // GPS
    if (includeGps && meta.gps !== null) {
        if (!exifObj['GPS']) exifObj['GPS'] = {};
        const { lat, lng } = meta.gps;
        exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S';
        exifObj['GPS'][piexif.GPSIFD.GPSLatitude] = decimalToDMS(Math.abs(lat));
        exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W';
        exifObj['GPS'][piexif.GPSIFD.GPSLongitude] = decimalToDMS(Math.abs(lng));
    } else {
        delete exifObj['GPS'];
    }

    const exifBytes = piexif.dump(exifObj);
    const newBinaryStr = piexif.insert(exifBytes, binaryStr);
    return binaryStringToBlob(newBinaryStr);
}
