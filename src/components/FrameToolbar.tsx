import { useState } from 'react';
import { useFrameStore } from '../store/useFrameStore';
import { useToastStore } from '../store/useToastStore';
import { exportFrames } from '../lib/export';

export function FrameToolbar() {
    const frames = useFrameStore((s) => s.frames);
    const selectedIds = useFrameStore((s) => s.selectedIds);
    const removeFrames = useFrameStore((s) => s.removeFrames);
    const clearSelection = useFrameStore((s) => s.clearSelection);
    const setActiveFrameId = useFrameStore((s) => s.setActiveFrameId);
    const setBulkEditOpen = useFrameStore((s) => s.setBulkEditOpen);
    const toast = useToastStore((s) => s.show);
    const [exporting, setExporting] = useState(false);

    const targets = selectedIds.size > 0 ? frames.filter((f) => selectedIds.has(f.id)) : frames;
    const errorCount = targets.filter((f) => Object.keys(f.errors).length > 0).length;
    const canExport = errorCount === 0 && !exporting;

    const handleExport = async () => {
        if (!canExport) return;
        setExporting(true);
        try {
            await exportFrames(targets);
            toast(
                targets.length > 1
                    ? `${targets.length}개 파일을 ZIP으로 내보냈습니다`
                    : `${targets[0].file.name} 파일을 내보냈습니다`,
                'success',
            );
        } catch (e) {
            console.error(e);
            toast('내보내기 중 오류가 발생했습니다');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 text-sm text-gray-500">
            <span>{frames.length}개 프레임</span>
            {selectedIds.size > 0 && (
                <span className="text-blue-600 font-medium">{selectedIds.size}개 선택됨</span>
            )}

            <div className="ml-auto flex items-center gap-2">
                {selectedIds.size > 0 && (
                    <>
                        <button
                            onClick={() => {
                                setActiveFrameId(null);
                                setBulkEditOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            일괄 편집
                        </button>
                        <button
                            onClick={() => {
                                removeFrames([...selectedIds]);
                                clearSelection();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            제거
                        </button>
                    </>
                )}
                {errorCount > 0 && (
                    <span className="text-xs text-red-500 font-medium">오류 {errorCount}개</span>
                )}
                <button
                    onClick={handleExport}
                    disabled={!canExport}
                    title={
                        errorCount > 0
                            ? `오류가 있는 ${errorCount}개 행을 수정 후 내보낼 수 있습니다`
                            : targets.length > 1
                              ? `${targets.length}개 파일을 ZIP으로 내보내기`
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
        </div>
    );
}
