import { create } from 'zustand';
import type { FrameItem, FrameMeta } from '../types/frame';
import { validateMeta } from '../lib/validation';

interface FrameStore {
    frames: FrameItem[];
    selectedIds: Set<string>;
    activeFrameId: string | null;
    lastClickedId: string | null;
    bulkEditOpen: boolean;
    addFrames: (frames: FrameItem[]) => void;
    removeFrames: (ids: string[]) => void;
    toggleSelect: (id: string, shiftHeld: boolean, lastClickedId: string | null) => void;
    selectAll: () => void;
    clearSelection: () => void;
    setActiveFrameId: (id: string | null) => void;
    setBulkEditOpen: (open: boolean) => void;
    updateFrameMeta: (id: string, patch: Partial<FrameMeta>) => void;
    batchUpdateMeta: (ids: string[], patch: Partial<FrameMeta>) => void;
    updateFrameNumber: (id: string, n: number | null) => void;
}

export const useFrameStore = create<FrameStore>((set, get) => ({
    frames: [],
    selectedIds: new Set(),
    activeFrameId: null,
    lastClickedId: null,
    bulkEditOpen: false,

    addFrames: (newFrames) =>
        set((state) => ({ frames: [...state.frames, ...newFrames] })),

    removeFrames: (ids) => {
        const idSet = new Set(ids);
        set((state) => ({
            frames: state.frames.filter((f) => !idSet.has(f.id)),
            selectedIds: new Set([...state.selectedIds].filter((id) => !idSet.has(id))),
            activeFrameId: idSet.has(state.activeFrameId ?? '') ? null : state.activeFrameId,
        }));
    },

    toggleSelect: (id, shiftHeld, lastClickedId) => {
        const { frames, selectedIds } = get();
        if (shiftHeld && lastClickedId) {
            const idxA = frames.findIndex((f) => f.id === lastClickedId);
            const idxB = frames.findIndex((f) => f.id === id);
            if (idxA !== -1 && idxB !== -1) {
                const [start, end] = idxA < idxB ? [idxA, idxB] : [idxB, idxA];
                const next = new Set(selectedIds);
                for (let i = start; i <= end; i++) next.add(frames[i].id);
                set({ selectedIds: next, lastClickedId: id });
                return;
            }
        }
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        set({ selectedIds: next, lastClickedId: id });
    },

    selectAll: () =>
        set((state) => ({ selectedIds: new Set(state.frames.map((f) => f.id)) })),

    clearSelection: () => set({ selectedIds: new Set(), lastClickedId: null }),

    setActiveFrameId: (id) => set({ activeFrameId: id }),

    setBulkEditOpen: (open) => set({ bulkEditOpen: open }),

    updateFrameMeta: (id, patch) =>
        set((state) => ({
            frames: state.frames.map((f) => {
                if (f.id !== id) return f;
                const newMeta = { ...f.meta, ...patch };
                return { ...f, meta: newMeta, errors: validateMeta(newMeta) };
            }),
        })),

    batchUpdateMeta: (ids, patch) => {
        const idSet = new Set(ids);
        set((state) => ({
            frames: state.frames.map((f) => {
                if (!idSet.has(f.id)) return f;
                const newMeta = { ...f.meta, ...patch };
                return { ...f, meta: newMeta, errors: validateMeta(newMeta) };
            }),
        }));
    },

    updateFrameNumber: (id, n) =>
        set((state) => ({
            frames: state.frames.map((f) => (f.id === id ? { ...f, frameNumber: n } : f)),
        })),
}));
