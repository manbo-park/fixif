import { create } from 'zustand';

export type ToastType = 'success' | 'error';

interface ToastStore {
    message: string | null;
    type: ToastType;
    show: (message: string, type?: ToastType) => void;
    hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastStore>((set) => ({
    message: null,
    type: 'error',

    show: (message, type = 'error') => {
        if (timer) clearTimeout(timer);
        set({ message, type });
        timer = setTimeout(() => set({ message: null }), 2500);
    },

    hide: () => {
        if (timer) clearTimeout(timer);
        set({ message: null });
    },
}));
