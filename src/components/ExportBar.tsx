import { useState } from 'react';
import { useFrameStore } from '../store/useFrameStore';
import { useToastStore } from '../store/useToastStore';
import { exportFrames } from '../lib/export';

export function ExportBar() {
    const frames = useFrameStore((s) => s.frames);
    const [exporting, setExporting] = useState(false);
    const toast = useToastStore((s) => s.show);

    if (frames.length === 0) return null;

    const errorCount = frames.filter((f) => Object.keys(f.errors).length > 0).length;
    const canExport = errorCount === 0 && !exporting;
    const isZip = frames.length > 1;

    async function handleExport() {
        if (!canExport) return;
        setExporting(true);
        try {
            await exportFrames(frames);
            toast(
                isZip
                    ? `${frames.length}개 파일을 ZIP으로 내보냈습니다`
                    : `${frames[0].file.name} 파일을 내보냈습니다`,
                'success',
            );
        } catch (e) {
            console.error(e);
            toast('내보내기 중 오류가 발생했습니다');
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            {errorCount > 0 && (
                <span className="text-xs text-red-500 font-medium">오류 {errorCount}개</span>
            )}
            <button
                onClick={handleExport}
                disabled={!canExport}
                title={
                    errorCount > 0
                        ? `오류가 있는 ${errorCount}개 행을 수정 후 내보낼 수 있습니다`
                        : isZip
                          ? `${frames.length}개 파일을 ZIP으로 내보내기`
                          : '파일 내보내기'
                }
                className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    canExport
                        ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                ].join(' ')}
            >
                {exporting ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
                                d="M4 12a8 8 0 018-8v8H4z"
                            />
                        </svg>
                        처리 중…
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        내보내기
                    </>
                )}
            </button>
        </div>
    );
}
