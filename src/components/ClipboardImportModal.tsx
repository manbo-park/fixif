import { useMemo } from 'react';
import { useFrameStore } from '../store/useFrameStore';
import { useToastStore } from '../store/useToastStore';
import { matchFrames, filoFrameToMetaPatch } from '../lib/matching';

function formatTime(isoString: string): string {
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    } catch {
        return '-';
    }
}

export function ClipboardImportModal() {
    const frames = useFrameStore((s) => s.frames);
    const pendingImport = useFrameStore((s) => s.pendingImport);
    const setPendingImport = useFrameStore((s) => s.setPendingImport);
    const updateFrameMeta = useFrameStore((s) => s.updateFrameMeta);
    const toast = useToastStore((s) => s.show);

    const matches = useMemo(() => {
        if (!pendingImport) return [];
        return matchFrames(pendingImport.roll.frames, frames);
    }, [pendingImport, frames]);

    if (!pendingImport) return null;

    const { roll } = pendingImport;
    const matchedCount = matches.filter((m) => m.frameItem !== null).length;
    const unmatchedCount = matches.length - matchedCount;

    const handleApply = () => {
        let applied = 0;
        for (const match of matches) {
            if (!match.frameItem) continue;
            const patch = filoFrameToMetaPatch(match.filoFrame, roll);
            updateFrameMeta(match.frameItem.id, patch);
            applied++;
        }
        setPendingImport(null);
        toast(`${applied}개 프레임에 filo 데이터를 적용했습니다`, 'success');
    };

    const handleClose = () => setPendingImport(null);

    const cameraLabel = [roll.camera?.make, roll.camera?.model].filter(Boolean).join(' ') || null;
    const filmLabel = roll.film?.name ?? null;
    const isoLabel = roll.film?.iso != null ? `ISO ${roll.film.iso}` : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
            <div className="relative z-10 bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
                {/* 헤더 */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-2 shrink-0">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-800">
                            filo 데이터 붙여넣기
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            프레임 번호를 기준으로 자동 매칭됩니다
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                        <svg
                            className="w-4 h-4"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M3 3l10 10M13 3L3 13" />
                        </svg>
                    </button>
                </div>

                {/* 롤 요약 */}
                <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 shrink-0">
                    {cameraLabel && (
                        <span>
                            <span className="text-gray-400">카메라</span>{' '}
                            <span className="text-gray-700 font-medium">{cameraLabel}</span>
                        </span>
                    )}
                    {filmLabel && (
                        <span>
                            <span className="text-gray-400">필름</span>{' '}
                            <span className="text-gray-700 font-medium">{filmLabel}</span>
                        </span>
                    )}
                    {isoLabel && (
                        <span>
                            <span className="text-gray-700 font-medium">{isoLabel}</span>
                        </span>
                    )}
                    <span className="ml-auto">
                        총 <span className="font-medium text-gray-700">{roll.frames.length}</span>개
                        프레임
                    </span>
                </div>

                {/* 매칭 테이블 */}
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-400 w-16">
                                    프레임
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-400">
                                    파일
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-400 w-32">
                                    촬영시간
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-400 w-16">
                                    f
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-400 w-16">
                                    SS
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {matches.map(({ filoFrame, frameItem }) => (
                                <tr
                                    key={filoFrame.n}
                                    className={
                                        frameItem === null ? 'bg-red-50/60' : 'hover:bg-gray-50'
                                    }
                                >
                                    <td className="px-4 py-2.5 text-gray-500 font-medium">
                                        {filoFrame.n}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {frameItem ? (
                                            <span className="text-gray-700">
                                                {frameItem.file.name}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-500">
                                                <svg
                                                    className="w-3 h-3 shrink-0"
                                                    viewBox="0 0 16 16"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 112 0v3a1 1 0 11-2 0V5zm1 6a1 1 0 100-2 1 1 0 000 2z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                매칭 안됨
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-500">
                                        {filoFrame.t ? formatTime(filoFrame.t) : '-'}
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-500">
                                        {filoFrame.aperture != null
                                            ? `f/${filoFrame.aperture}`
                                            : '-'}
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-500">
                                        {filoFrame.shutter ?? '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 경고 + 푸터 */}
                <div className="px-5 py-3 border-t border-gray-100 shrink-0 space-y-2.5">
                    {unmatchedCount > 0 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1.5">
                            <svg
                                className="w-3.5 h-3.5 shrink-0"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.485 2.495c-.673-1.167-2.357-1.167-3.03 0L.795 13.5c-.673 1.167.168 2.625 1.515 2.625h11.38c1.347 0 2.188-1.458 1.515-2.625L8.485 2.495zM8 6a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm-1 6a1 1 0 112 0 1 1 0 01-2 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {unmatchedCount}개 filo 프레임이 파일과 매칭되지 않아 적용에서
                            제외됩니다
                        </p>
                    )}
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400">
                            {matchedCount}개 프레임에 적용 예정
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClose}
                                className="px-4 py-1.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={matchedCount === 0}
                                className={[
                                    'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                    matchedCount > 0
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                                ].join(' ')}
                            >
                                적용
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
