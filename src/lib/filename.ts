export function extractFrameNumber(filename: string): number | null {
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    const matches = nameWithoutExt.match(/\d+/g);
    if (!matches || matches.length === 0) return null;
    const n = parseInt(matches[matches.length - 1], 10);
    if (n <= 0 || n >= 100) return null;
    return n;
}
