import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
    exportSuffix: string;
    includeGps: boolean;
    includeMemo: boolean;
    settingsOpen: boolean;
    setExportSuffix: (v: string) => void;
    setIncludeGps: (v: boolean) => void;
    setIncludeMemo: (v: boolean) => void;
    setSettingsOpen: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            exportSuffix: '_fixif',
            includeGps: true,
            includeMemo: true,
            settingsOpen: false,
            setExportSuffix: (v) => set({ exportSuffix: v }),
            setIncludeGps: (v) => set({ includeGps: v }),
            setIncludeMemo: (v) => set({ includeMemo: v }),
            setSettingsOpen: (v) => set({ settingsOpen: v }),
        }),
        {
            name: 'fixif-settings',
            partialize: (state) => ({
                exportSuffix: state.exportSuffix,
                includeGps: state.includeGps,
                includeMemo: state.includeMemo,
            }),
        },
    ),
);
