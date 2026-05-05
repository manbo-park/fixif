export interface GpsCoords {
    lat: number;
    lng: number;
}

export interface FrameMeta {
    dateTimeOriginal: Date | null;
    make: string | null;
    model: string | null;
    lensModel: string | null;
    fNumber: number | null;
    exposureTime: string | null;
    iso: number | null;
    userComment: string | null;
    gps: GpsCoords | null;
}

export interface FrameItem {
    id: string;
    file: File;
    thumbnailUrl: string;
    frameNumber: number | null;
    rotation: 0 | 90 | 180 | 270;
    meta: FrameMeta;
    originalMeta: FrameMeta;
    errors: Partial<Record<keyof FrameMeta, string>>;
}
