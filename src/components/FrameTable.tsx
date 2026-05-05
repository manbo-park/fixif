import { useState, useMemo } from 'react';
import { useFrameStore } from '../store/useFrameStore';
import type { FrameItem } from '../types/frame';
import { ImagePreviewModal } from './ImagePreviewModal';

type SortKey =
    | 'frameNumber'
    | 'fileName'
    | 'dateTimeOriginal'
    | 'camera'
    | 'lensModel'
    | 'fNumber'
    | 'exposureTime'
    | 'iso';
type SortDir = 'asc' | 'desc';

function formatDate(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function parseShutterSec(s: string | null): number {
    if (!s || s === 'B') return Infinity;
    if (s.endsWith('"')) return parseFloat(s);
    if (s.startsWith('1/')) return 1 / parseInt(s.slice(2), 10);
    return Infinity;
}

function getSortValue(frame: FrameItem, key: SortKey): string | number {
    switch (key) {
        case 'frameNumber':
            return frame.frameNumber ?? Infinity;
        case 'fileName':
            return frame.file.name.toLowerCase();
        case 'dateTimeOriginal':
            return frame.meta.dateTimeOriginal?.getTime() ?? Infinity;
        case 'camera':
            return [frame.meta.make, frame.meta.model].filter(Boolean).join(' ').toLowerCase();
        case 'lensModel':
            return (frame.meta.lensModel ?? '').toLowerCase();
        case 'fNumber':
            return frame.meta.fNumber ?? Infinity;
        case 'exposureTime':
            return parseShutterSec(frame.meta.exposureTime);
        case 'iso':
            return frame.meta.iso ?? Infinity;
    }
}


interface SortableThProps {
    label: string;
    sortKey: SortKey;
    current: SortKey | null;
    dir: SortDir;
    onSort: (key: SortKey) => void;
    className?: string;
}

function SortableTh({ label, sortKey, current, dir, onSort, className = '' }: SortableThProps) {
    const active = current === sortKey;
    return (
        <th
            className={`px-3 py-2 cursor-pointer select-none whitespace-nowrap group ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <span className="inline-flex items-center gap-1">
                <span className={active ? 'text-blue-600' : ''}>{label}</span>
                <span className={`text-[10px] transition-opacity ${active ? 'opacity-100 text-blue-600' : 'opacity-0 group-hover:opacity-40'}`}>
                    {active && dir === 'asc' ? '↑' : active && dir === 'desc' ? '↓' : '↕'}
                </span>
            </span>
        </th>
    );
}

function FrameRow({ frame, onPreview }: { frame: FrameItem; onPreview: (file: File) => void }) {
    const { selectedIds, toggleSelect, lastClickedId, activeFrameId, setActiveFrameId } =
        useFrameStore();
    const isSelected = selectedIds.has(frame.id);
    const isActive = activeFrameId === frame.id;
    const { meta } = frame;

    const handleRowClick = () => {
        setActiveFrameId(isActive ? null : frame.id);
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        toggleSelect(
            frame.id,
            e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey,
            lastClickedId,
        );
    };

    return (
        <tr
            className={`border-b border-gray-100 cursor-pointer select-none transition-colors ${
                isActive
                    ? 'bg-indigo-50 hover:bg-indigo-100'
                    : isSelected
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
            }`}
            onClick={handleRowClick}
        >
            <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckbox}
                    className="cursor-pointer accent-blue-500"
                />
            </td>
            <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                {frame.thumbnailUrl ? (
                    <img
                        src={frame.thumbnailUrl}
                        alt=""
                        className="w-12 h-12 object-cover rounded cursor-zoom-in hover:opacity-80 transition-opacity"
                        draggable={false}
                        onClick={() => onPreview(frame.file)}
                    />
                ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">
                        없음
                    </div>
                )}
            </td>
            <td className="px-3 py-2 text-center text-sm text-gray-600 tabular-nums">
                {frame.frameNumber ?? '—'}
            </td>
            <td className="px-3 py-2 text-sm text-gray-700 max-w-[180px] truncate" title={frame.file.name}>
                {frame.file.name}
            </td>
            <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap tabular-nums">
                {formatDate(meta.dateTimeOriginal)}
            </td>
            <td className="px-3 py-2 text-sm text-gray-700">
                {[meta.make, meta.model].filter(Boolean).join(' ') || '—'}
            </td>
            <td className="px-3 py-2 text-sm text-gray-700 max-w-[140px] truncate" title={meta.lensModel ?? ''}>
                {meta.lensModel ?? '—'}
            </td>
            <td className="px-3 py-2 text-sm text-gray-600 text-center tabular-nums">
                {meta.fNumber != null ? `f/${meta.fNumber}` : '—'}
            </td>
            <td className="px-3 py-2 text-sm text-gray-600 text-center tabular-nums">
                {meta.exposureTime ?? '—'}
            </td>
            <td className="px-3 py-2 text-sm text-gray-600 text-center tabular-nums">
                {meta.iso ?? '—'}
            </td>
            <td
                className="px-3 py-2 text-sm text-gray-400 max-w-[120px] truncate"
                title={meta.userComment ?? ''}
            >
                {meta.userComment ?? '—'}
            </td>
        </tr>
    );
}

export function FrameTable() {
    const { frames, selectedIds, selectAll, clearSelection } = useFrameStore();
    const [sortKey, setSortKey] = useState<SortKey | null>('frameNumber');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [previewFile, setPreviewFile] = useState<File | null>(null);

    const allSelected = frames.length > 0 && selectedIds.size === frames.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sortedFrames = useMemo(() => {
        if (!sortKey) return frames;
        return [...frames].sort((a, b) => {
            const av = getSortValue(a, sortKey);
            const bv = getSortValue(b, sortKey);
            if (av === bv) return 0;
            if (av === Infinity) return 1;
            if (bv === Infinity) return -1;
            const cmp = av < bv ? -1 : 1;
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [frames, sortKey, sortDir]);

    const thProps = { current: sortKey, dir: sortDir, onSort: handleSort };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                        <th className="px-3 py-2">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => {
                                    if (el) el.indeterminate = someSelected;
                                }}
                                onChange={() => (allSelected ? clearSelection() : selectAll())}
                                className="cursor-pointer accent-blue-500"
                            />
                        </th>
                        <th className="px-3 py-2">썸네일</th>
                        <SortableTh label="프레임" sortKey="frameNumber" {...thProps} className="text-center" />
                        <SortableTh label="파일명" sortKey="fileName" {...thProps} />
                        <SortableTh label="촬영시간" sortKey="dateTimeOriginal" {...thProps} />
                        <SortableTh label="카메라" sortKey="camera" {...thProps} />
                        <SortableTh label="렌즈" sortKey="lensModel" {...thProps} />
                        <SortableTh label="f" sortKey="fNumber" {...thProps} className="text-center" />
                        <SortableTh label="ss" sortKey="exposureTime" {...thProps} className="text-center" />
                        <SortableTh label="ISO" sortKey="iso" {...thProps} className="text-center" />
                        <th className="px-3 py-2">메모</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedFrames.map((frame) => (
                        <FrameRow key={frame.id} frame={frame} onPreview={setPreviewFile} />
                    ))}
                </tbody>
            </table>
            {previewFile && (
                <ImagePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
            )}
        </div>
    );
}
