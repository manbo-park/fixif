import type { FiloFrame, FiloPayload } from '../types/filo';
import type { FrameItem, FrameMeta } from '../types/frame';

export interface FrameMatch {
    filoFrame: FiloFrame;
    frameItem: FrameItem | null;
}

export function matchFrames(filoFrames: FiloFrame[], frameItems: FrameItem[]): FrameMatch[] {
    const byNumber = new Map<number, FrameItem>();
    for (const item of frameItems) {
        if (item.frameNumber !== null && !byNumber.has(item.frameNumber)) {
            byNumber.set(item.frameNumber, item);
        }
    }
    return filoFrames.map((ff) => ({
        filoFrame: ff,
        frameItem: byNumber.get(ff.n) ?? null,
    }));
}

export function filoFrameToMetaPatch(
    ff: FiloFrame,
    roll: FiloPayload['roll'],
): Partial<FrameMeta> {
    const patch: Partial<FrameMeta> = {};

    if (ff.t !== undefined) {
        const d = new Date(ff.t);
        if (!isNaN(d.getTime())) patch.dateTimeOriginal = d;
    }

    if (roll.camera?.make) patch.make = roll.camera.make;
    if (roll.camera?.model) patch.model = roll.camera.model;
    if (ff.lens !== undefined) patch.lensModel = ff.lens || null;
    if (ff.aperture !== undefined) patch.fNumber = ff.aperture;
    if (ff.shutter !== undefined) patch.exposureTime = ff.shutter || null;
    if (roll.film?.iso !== undefined) patch.iso = roll.film.iso;
    if (ff.memo !== undefined) patch.userComment = ff.memo || null;

    if (ff.lat !== undefined && ff.lng !== undefined) {
        patch.gps = { lat: ff.lat, lng: ff.lng };
    }

    return patch;
}
