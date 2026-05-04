export interface FiloFrame {
    n: number;
    t?: string;
    lens?: string;
    aperture?: number;
    shutter?: string;
    memo?: string;
    lat?: number;
    lng?: number;
}

export interface FiloPayload {
    v: 1;
    roll: {
        camera?: { make?: string; model?: string };
        film?: { name?: string; iso?: number };
        frames: FiloFrame[];
    };
}
