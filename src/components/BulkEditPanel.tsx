import { useEffect, useRef, useState } from 'react';
import { useFrameStore } from '../store/useFrameStore';
import type { FrameMeta } from '../types/frame';
import { ComboboxField } from './ComboboxField';
import { APERTURE_PRESETS, SHUTTER_PRESETS, ISO_PRESETS } from '../lib/presets';

interface FieldRowProps {
    label: string;
    children: React.ReactNode;
}

function FieldRow({ label, children }: FieldRowProps) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            {children}
        </div>
    );
}

const inputCls =
    'w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400';

export function BulkEditPanel() {
    const { selectedIds, bulkEditOpen, setBulkEditOpen, batchUpdateMeta } = useFrameStore();

    const [closing, setClosing] = useState(false);
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [lensModel, setLensModel] = useState('');
    const [fNumber, setFNumber] = useState('');
    const [exposureTime, setExposureTime] = useState('');
    const [iso, setIso] = useState('');
    const [userComment, setUserComment] = useState('');

    const prevOpenRef = useRef(false);
    const countRef = useRef(selectedIds.size);
    countRef.current = selectedIds.size;

    useEffect(() => {
        if (!bulkEditOpen && prevOpenRef.current) {
            setClosing(true);
        }
        if (bulkEditOpen) {
            setClosing(false);
            setMake('');
            setModel('');
            setLensModel('');
            setFNumber('');
            setExposureTime('');
            setIso('');
            setUserComment('');
        }
        prevOpenRef.current = bulkEditOpen;
    }, [bulkEditOpen]);

    useEffect(() => {
        if (bulkEditOpen && selectedIds.size === 0) {
            setBulkEditOpen(false);
        }
    }, [selectedIds.size, bulkEditOpen, setBulkEditOpen]);

    const handleClose = () => setBulkEditOpen(false);

    const handleAnimationEnd = () => {
        if (closing) setClosing(false);
    };

    const handleApply = () => {
        const patch: Partial<FrameMeta> = {};
        if (make !== '') patch.make = make || null;
        if (model !== '') patch.model = model || null;
        if (lensModel !== '') patch.lensModel = lensModel || null;
        if (fNumber !== '') {
            const n = parseFloat(fNumber);
            if (!isNaN(n)) patch.fNumber = n;
        }
        if (exposureTime !== '') patch.exposureTime = exposureTime || null;
        if (iso !== '') {
            const n = parseInt(iso, 10);
            if (!isNaN(n)) patch.iso = n;
        }
        if (userComment !== '') patch.userComment = userComment || null;

        if (Object.keys(patch).length > 0) {
            batchUpdateMeta([...selectedIds], patch);
        }
        setBulkEditOpen(false);
    };

    if (!bulkEditOpen && !closing) return null;

    return (
        <>
            <div className="fixed inset-0 z-30 bg-black/20" onClick={handleClose} />
            <aside
                className={`fixed right-4 top-4 bottom-4 w-80 bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col z-40 overflow-hidden ${closing ? 'animate-slide-out' : 'animate-slide-in'}`}
                onAnimationEnd={handleAnimationEnd}
            >
                <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2 shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-gray-800">일괄 편집</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{selectedIds.size}개 선택됨</p>
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

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <p className="text-xs text-gray-400">
                        값을 입력한 필드만 선택된 프레임에 일괄 적용됩니다.
                    </p>

                    <FieldRow label="제조사 (Make)">
                        <input
                            type="text"
                            value={make}
                            placeholder="변경하지 않음"
                            maxLength={64}
                            className={inputCls}
                            onChange={(e) => setMake(e.target.value)}
                        />
                    </FieldRow>

                    <FieldRow label="카메라 모델">
                        <input
                            type="text"
                            value={model}
                            placeholder="변경하지 않음"
                            maxLength={64}
                            className={inputCls}
                            onChange={(e) => setModel(e.target.value)}
                        />
                    </FieldRow>

                    <FieldRow label="렌즈">
                        <input
                            type="text"
                            value={lensModel}
                            placeholder="변경하지 않음"
                            maxLength={64}
                            className={inputCls}
                            onChange={(e) => setLensModel(e.target.value)}
                        />
                    </FieldRow>

                    <FieldRow label="조리개 (f/)">
                        <ComboboxField
                            value={fNumber}
                            options={APERTURE_PRESETS}
                            placeholder="변경하지 않음"
                            onChange={setFNumber}
                        />
                    </FieldRow>

                    <FieldRow label="셔터 속도">
                        <ComboboxField
                            value={exposureTime}
                            options={SHUTTER_PRESETS}
                            placeholder="변경하지 않음"
                            onChange={setExposureTime}
                        />
                    </FieldRow>

                    <FieldRow label="ISO">
                        <ComboboxField
                            value={iso}
                            options={ISO_PRESETS}
                            placeholder="변경하지 않음"
                            onChange={setIso}
                        />
                    </FieldRow>

                    <FieldRow label="메모">
                        <textarea
                            value={userComment}
                            placeholder="변경하지 않음"
                            rows={3}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none"
                            onChange={(e) => setUserComment(e.target.value)}
                        />
                    </FieldRow>
                </div>

                <div className="px-4 py-3 border-t border-gray-100 shrink-0">
                    <button
                        onClick={handleApply}
                        className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
                    >
                        일괄 적용
                    </button>
                </div>
            </aside>
        </>
    );
}
