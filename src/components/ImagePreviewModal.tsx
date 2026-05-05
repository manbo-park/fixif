import { useEffect, useState } from 'react';
import type { FrameItem } from '../types/frame';
import { useFrameStore } from '../store/useFrameStore';

interface ImagePreviewModalProps {
    frames: FrameItem[];
    currentIndex: number;
    onNavigate: (index: number) => void;
    onClose: () => void;
}

export function ImagePreviewModal({
    frames,
    currentIndex,
    onNavigate,
    onClose,
}: ImagePreviewModalProps) {
    const updateFrameRotation = useFrameStore((s) => s.updateFrameRotation);
    const frame = frames[currentIndex];
    const [url, setUrl] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [hovering, setHovering] = useState(false);

    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < frames.length - 1;
    const [skipTransition, setSkipTransition] = useState(false);
    const [displayRotation, setDisplayRotation] = useState<number>(frame?.rotation ?? 0);

    useEffect(() => {
        if (!frame) return;
        setLoaded(false);
        const objectUrl = URL.createObjectURL(frame.file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [frame?.file]);

    // 프레임 이동 시 displayRotation을 새 프레임의 저장값으로 즉시 동기화
    useEffect(() => {
        if (frame) setDisplayRotation(frame.rotation);
    }, [frame?.id]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key === 'ArrowLeft' && hasPrev) {
                setSkipTransition(true);
                setLoaded(false);
                onNavigate(currentIndex - 1);
            }
            if (e.key === 'ArrowRight' && hasNext) {
                setSkipTransition(true);
                setLoaded(false);
                onNavigate(currentIndex + 1);
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

    if (!frame) return null;

    const rotate = (delta: 90 | -90) => {
        const next = displayRotation + delta;
        setDisplayRotation(next);
        const normalized = (((next % 360) + 360) % 360) as 0 | 90 | 180 | 270;
        updateFrameRotation(frame.id, normalized);
    };

    const normalizedRotation = (((displayRotation % 360) + 360) % 360);
    const is90or270 = normalizedRotation === 90 || normalizedRotation === 270;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center pt-14 pb-4"
            onClick={onClose}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {/* 닫기 버튼 */}
            <button
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
                onClick={onClose}
            >
                <svg
                    className="w-5 h-5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M3 3l10 10M13 3L3 13" />
                </svg>
            </button>

            {/* 이미지 + 화살표 영역 */}
            <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
                {/* 이전 화살표 */}
                {hasPrev && (
                    <button
                        className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-opacity duration-200 z-10 ${hovering ? 'opacity-100' : 'opacity-0'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSkipTransition(true);
                            setLoaded(false);
                            onNavigate(currentIndex - 1);
                        }}
                    >
                        <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                )}

                {/* 다음 화살표 */}
                {hasNext && (
                    <button
                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-opacity duration-200 z-10 ${hovering ? 'opacity-100' : 'opacity-0'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSkipTransition(true);
                            setLoaded(false);
                            onNavigate(currentIndex + 1);
                        }}
                    >
                        <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                )}

                {/* 스피너 */}
                {!loaded && (
                    <svg
                        className="w-10 h-10 text-white/50 animate-spin absolute"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>
                )}

                {/* 이미지 */}
                <img
                    src={url}
                    alt={frame.file.name}
                    className={`object-contain rounded shadow-2xl ${skipTransition ? '' : 'transition-[opacity,transform] duration-300'} ${loaded ? 'opacity-100' : 'opacity-0 min-h-[30vh]'}`}
                    style={{
                        transform: `rotate(${displayRotation}deg)`,
                        maxHeight: is90or270 ? 'min(85vw, 100%)' : '100%',
                        maxWidth: is90or270 ? '85vh' : '85vw',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                    onLoad={() => {
                        setSkipTransition(false);
                        requestAnimationFrame(() => setLoaded(true));
                    }}
                />
            </div>

            {/* 하단: 파일명 + 회전 버튼 */}
            <div
                className="flex-shrink-0 mt-3 flex flex-col items-center gap-3"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-sm text-white/60 select-none">{frame.file.name}</p>
                <div className="flex gap-2">
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                        onClick={() => rotate(-90)}
                        title="왼쪽으로 90° 회전"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        왼쪽으로 90° 회전
                    </button>
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                        onClick={() => rotate(90)}
                        title="오른쪽으로 90° 회전"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                        </svg>
                        오른쪽으로 90° 회전
                    </button>
                    {normalizedRotation !== 0 && (
                        <button
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                            onClick={() => { setDisplayRotation(0); updateFrameRotation(frame.id, 0); }}
                            title="회전 초기화"
                        >
                            초기화
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
