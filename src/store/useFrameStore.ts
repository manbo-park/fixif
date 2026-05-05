import { create } from 'zustand';
import type { FrameItem, FrameMeta } from '../types/frame';
import type { FiloPayload } from '../types/filo';
import { validateMeta } from '../lib/validation';

const MAX_HISTORY = 50;

interface FrameStore {
    frames: FrameItem[];
    past: FrameItem[][];
    future: FrameItem[][];
    selectedIds: Set<string>;
    activeFrameId: string | null;
    lastClickedId: string | null;
    bulkEditOpen: boolean;
    pendingImport: FiloPayload | null;
    addFrames: (frames: FrameItem[]) => void;
    removeFrames: (ids: string[]) => void;
    toggleSelect: (id: string, shiftHeld: boolean, lastClickedId: string | null) => void;
    selectAll: () => void;
    clearSelection: () => void;
    setActiveFrameId: (id: string | null) => void;
    setBulkEditOpen: (open: boolean) => void;
    setPendingImport: (payload: FiloPayload | null) => void;
    updateFrameMeta: (id: string, patch: Partial<FrameMeta>) => void;
    batchUpdateMeta: (ids: string[], patch: Partial<FrameMeta>) => void;
    applyImport: (changes: Array<{ id: string; patch: Partial<FrameMeta> }>) => void;
    updateFrameNumber: (id: string, n: number | null) => void;
    updateFrameRotation: (id: string, rotation: 0 | 90 | 180 | 270) => void;
    reorderFrames: (newFrames: FrameItem[]) => void;
    undo: () => void;
    redo: () => void;
}

export const useFrameStore = create<FrameStore>((set, get) => ({
    frames: [],
    past: [],
    future: [],
    selectedIds: new Set(),
    activeFrameId: null,
    lastClickedId: null,
    bulkEditOpen: false,
    pendingImport: null,

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

    setPendingImport: (payload) => set({ pendingImport: payload }),

    updateFrameMeta: (id, patch) =>
        set((state) => {
            const newFrames = state.frames.map((f) => {
                if (f.id !== id) return f;
                const newMeta = { ...f.meta, ...patch };
                return { ...f, meta: newMeta, errors: validateMeta(newMeta) };
            });
            return {
                frames: newFrames,
                past: [...state.past.slice(-(MAX_HISTORY - 1)), state.frames],
                future: [],
            };
        }),

    batchUpdateMeta: (ids, patch) => {
        const idSet = new Set(ids);
        set((state) => {
            const newFrames = state.frames.map((f) => {
                if (!idSet.has(f.id)) return f;
                const newMeta = { ...f.meta, ...patch };
                return { ...f, meta: newMeta, errors: validateMeta(newMeta) };
            });
            return {
                frames: newFrames,
                past: [...state.past.slice(-(MAX_HISTORY - 1)), state.frames],
                future: [],
            };
        });
    },

    applyImport: (changes) =>
        set((state) => {
            const patchMap = new Map(changes.map((c) => [c.id, c.patch]));
            const newFrames = state.frames.map((f) => {
                const patch = patchMap.get(f.id);
                if (!patch) return f;
                const newMeta = { ...f.meta, ...patch };
                return { ...f, meta: newMeta, errors: validateMeta(newMeta) };
            });
            return {
                frames: newFrames,
                past: [...state.past.slice(-(MAX_HISTORY - 1)), state.frames],
                future: [],
            };
        }),

    updateFrameNumber: (id, n) =>
        set((state) => {
            const newFrames = state.frames.map((f) =>
                f.id === id ? { ...f, frameNumber: n } : f,
            );
            return {
                frames: newFrames,
                past: [...state.past.slice(-(MAX_HISTORY - 1)), state.frames],
                future: [],
            };
        }),

    updateFrameRotation: (id, rotation) =>
        set((state) => {
            const newFrames = state.frames.map((f) =>
                f.id === id ? { ...f, rotation } : f,
            );
            return {
                frames: newFrames,
                past: [...state.past.slice(-(MAX_HISTORY - 1)), state.frames],
                future: [],
            };
        }),

    reorderFrames: (newOrderFrames) =>
        set((state) => {
            const reindexed = newOrderFrames.map((f, i) => ({ ...f, frameNumber: i + 1 }));
            return {
                frames: reindexed,
                past: [...state.past.slice(-(MAX_HISTORY - 1)), state.frames],
                future: [],
            };
        }),

    undo: () =>
        set((state) => {
            if (state.past.length === 0) return state;
            const prev = state.past[state.past.length - 1];
            return {
                frames: prev,
                past: state.past.slice(0, -1),
                future: [state.frames, ...state.future.slice(0, MAX_HISTORY - 1)],
            };
        }),

    redo: () =>
        set((state) => {
            if (state.future.length === 0) return state;
            const next = state.future[0];
            return {
                frames: next,
                past: [...state.past.slice(-(MAX_HISTORY - 1)), state.frames],
                future: state.future.slice(1),
            };
        }),
}));
