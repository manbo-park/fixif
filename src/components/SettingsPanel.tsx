import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    );
}

export function SettingsPanel() {
    const settingsOpen = useSettingsStore((s) => s.settingsOpen);
    const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);
    const exportSuffix = useSettingsStore((s) => s.exportSuffix);
    const setExportSuffix = useSettingsStore((s) => s.setExportSuffix);
    const includeGps = useSettingsStore((s) => s.includeGps);
    const setIncludeGps = useSettingsStore((s) => s.setIncludeGps);
    const includeMemo = useSettingsStore((s) => s.includeMemo);
    const setIncludeMemo = useSettingsStore((s) => s.setIncludeMemo);

    const [closing, setClosing] = useState(false);
    const [suffixInput, setSuffixInput] = useState(exportSuffix);
    const [suffixError, setSuffixError] = useState('');
    const prevOpenRef = useRef(settingsOpen);

    useEffect(() => {
        if (!settingsOpen && prevOpenRef.current) {
            setClosing(true);
        }
        if (settingsOpen) {
            setClosing(false);
            setSuffixInput(exportSuffix);
            setSuffixError('');
        }
        prevOpenRef.current = settingsOpen;
    }, [settingsOpen, exportSuffix]);

    if (!settingsOpen && !closing) return null;

    const handleSuffixChange = (v: string) => {
        setSuffixInput(v);
        if (/[/\\]/.test(v)) {
            setSuffixError('슬래시 문자는 사용할 수 없습니다');
        } else {
            setSuffixError('');
            setExportSuffix(v);
        }
    };

    const previewName = `photo01${suffixError ? suffixInput : exportSuffix}.jpg`;

    return (
        <>
            <div
                className="fixed inset-0 z-30 bg-black/20"
                onClick={() => setSettingsOpen(false)}
            />
            <aside
                className={`fixed right-4 top-4 bottom-4 w-72 bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col z-40 overflow-hidden ${closing ? 'animate-slide-out' : 'animate-slide-in'}`}
                onAnimationEnd={() => {
                    if (closing) setClosing(false);
                }}
            >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h2 className="text-sm font-semibold text-gray-800">설정</h2>
                    <button
                        onClick={() => setSettingsOpen(false)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
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

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            내보내기
                        </p>
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-600">
                                파일명 접미사
                            </label>
                            <input
                                type="text"
                                value={suffixInput}
                                onChange={(e) => handleSuffixChange(e.target.value)}
                                placeholder="_fixif"
                                className={`w-full px-2.5 py-1.5 text-sm font-mono border rounded-md outline-none focus:ring-1 ${suffixError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-400 focus:border-blue-400'}`}
                            />
                            {suffixError ? (
                                <p className="text-xs text-red-500">{suffixError}</p>
                            ) : (
                                <p className="text-xs text-gray-400">
                                    예:{' '}
                                    <span className="font-mono text-gray-500">{previewName}</span>
                                </p>
                            )}
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-600">위치 정보</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        GPS 데이터를 내보내기에 포함
                                    </p>
                                </div>
                                <Toggle checked={includeGps} onChange={setIncludeGps} />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-600">메모</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        메모를 내보내기에 포함
                                    </p>
                                </div>
                                <Toggle checked={includeMemo} onChange={setIncludeMemo} />
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
