import { useState } from 'react';
import { useFrameStore } from '../store/useFrameStore';
import type { FrameMeta } from '../types/frame';
import { ComboboxField } from './ComboboxField';
import { APERTURE_PRESETS, SHUTTER_PRESETS, ISO_PRESETS } from '../lib/presets';

type FieldKey = 'make' | 'model' | 'lensModel' | 'fNumber' | 'exposureTime' | 'iso' | 'userComment';

const FIELD_LABELS: Record<FieldKey, string> = {
    make: '제조사 (Make)',
    model: '카메라 모델',
    lensModel: '렌즈',
    fNumber: '조리개',
    exposureTime: '셔터 속도',
    iso: 'ISO',
    userComment: '메모',
};

export function BulkEditBar() {
    const { selectedIds, batchUpdateMeta } = useFrameStore();
    const [field, setField] = useState<FieldKey>('iso');
    const [inputVal, setInputVal] = useState('');

    if (selectedIds.size < 2) return null;

    const applyBulk = () => {
        if (!inputVal.trim()) return;
        const ids = [...selectedIds];
        let patch: Partial<FrameMeta> = {};

        if (field === 'make') patch = { make: inputVal || null };
        else if (field === 'model') patch = { model: inputVal || null };
        else if (field === 'lensModel') patch = { lensModel: inputVal || null };
        else if (field === 'fNumber') {
            const n = parseFloat(inputVal);
            patch = { fNumber: !isNaN(n) ? n : null };
        } else if (field === 'exposureTime') {
            patch = { exposureTime: inputVal || null };
        } else if (field === 'iso') {
            const n = parseInt(inputVal, 10);
            patch = { iso: !isNaN(n) ? n : null };
        } else if (field === 'userComment') {
            patch = { userComment: inputVal || null };
        }

        batchUpdateMeta(ids, patch);
        setInputVal('');
    };

    const getPresets = (): string[] => {
        if (field === 'fNumber') return APERTURE_PRESETS;
        if (field === 'exposureTime') return SHUTTER_PRESETS;
        if (field === 'iso') return ISO_PRESETS;
        return [];
    };

    const isCombo = ['fNumber', 'exposureTime', 'iso'].includes(field);

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
                <select
                    value={field}
                    onChange={(e) => {
                        setField(e.target.value as FieldKey);
                        setInputVal('');
                    }}
                    className="text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                >
                    {(Object.keys(FIELD_LABELS) as FieldKey[]).map((k) => (
                        <option key={k} value={k}>
                            {FIELD_LABELS[k]}
                        </option>
                    ))}
                </select>

                <div className="w-44">
                    {isCombo ? (
                        <ComboboxField
                            value={inputVal}
                            options={getPresets()}
                            placeholder={`${FIELD_LABELS[field]} 값`}
                            onChange={setInputVal}
                        />
                    ) : (
                        <input
                            type="text"
                            value={inputVal}
                            placeholder={`${FIELD_LABELS[field]} 값`}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-400"
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') applyBulk();
                            }}
                        />
                    )}
                </div>

                <button
                    onClick={applyBulk}
                    disabled={!inputVal.trim()}
                    className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    일괄 적용
                </button>
            </div>
        </div>
    );
}
