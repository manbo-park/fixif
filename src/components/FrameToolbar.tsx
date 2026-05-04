import { useState, useRef } from 'react';
import { useFrameStore } from '../store/useFrameStore';
import { useToastStore } from '../store/useToastStore';
import { exportFrames } from '../lib/export';
import { decodeClipboardPayload } from '../lib/clipboard';

export function FrameToolbar() {
    const frames = useFrameStore((s) => s.frames);
    const selectedIds = useFrameStore((s) => s.selectedIds);
    const removeFrames = useFrameStore((s) => s.removeFrames);
    const clearSelection = useFrameStore((s) => s.clearSelection);
    const setActiveFrameId = useFrameStore((s) => s.setActiveFrameId);
    const setBulkEditOpen = useFrameStore((s) => s.setBulkEditOpen);
    const setPendingImport = useFrameStore((s) => s.setPendingImport);
    const toast = useToastStore((s) => s.show);
    const [exporting, setExporting] = useState(false);
    const [filoInputOpen, setFiloInputOpen] = useState(false);
    const [filoText, setFiloText] = useState('');
    const [filoLoading, setFiloLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFiloOpen = () => {
        setFiloText('');
        setFiloInputOpen(true);
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const handleFiloSubmit = async () => {
        const trimmed = filoText.trim();
        if (!trimmed) return;
        setFiloLoading(true);
        try {
            const payload = await decodeClipboardPayload(trimmed);
            if (!payload) {
                toast('유효하지 않은 Filo 데이터입니다');
                return;
            }
            setFiloInputOpen(false);
            setFiloText('');
            setPendingImport(payload);
        } finally {
            setFiloLoading(false);
        }
    };

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
                    onClick={handleFiloOpen}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                    filo 데이터 붙여넣기
                </button>
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
                            새 파일로 내보내기
                        </>
                    )}
                </button>
            </div>

            {filoInputOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setFiloInputOpen(false)}
                    />
                    <div className="relative z-10 bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-lg flex flex-col gap-4 p-5">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800">
                                    filo 데이터 붙여넣기
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    filo 앱에서 복사한 코드를 붙여넣으세요.
                                </p>
                            </div>
                            <button
                                onClick={() => setFiloInputOpen(false)}
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
                        <textarea
                            ref={textareaRef}
                            value={filoText}
                            onChange={(e) => setFiloText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                                    handleFiloSubmit();
                            }}
                            placeholder="FIXIF1:..."
                            rows={4}
                            className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-300"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setFiloInputOpen(false)}
                                className="px-4 py-1.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleFiloSubmit}
                                disabled={!filoText.trim() || filoLoading}
                                className={[
                                    'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                    filoText.trim() && !filoLoading
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                                ].join(' ')}
                            >
                                {filoLoading ? '처리 중…' : '불러오기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
