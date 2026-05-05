import { useEffect } from 'react';
import { Dropzone } from './components/Dropzone';
import { FrameTable } from './components/FrameTable';
import { FrameToolbar } from './components/FrameToolbar';
import { BulkEditPanel } from './components/BulkEditPanel';
import { SidePanel } from './components/SidePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { Toast } from './components/Toast';
import { ClipboardImportModal } from './components/ClipboardImportModal';
import { useFrameStore } from './store/useFrameStore';
import { useSettingsStore } from './store/useSettingsStore';
import { decodeClipboardPayload } from './lib/clipboard';

function App() {
    const frames = useFrameStore((s) => s.frames);
    const setPendingImport = useFrameStore((s) => s.setPendingImport);
    const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);

    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const target = e.target as Element;
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;

            const text = e.clipboardData?.getData('text');
            if (!text) return;

            const payload = await decodeClipboardPayload(text);
            if (payload) setPendingImport(payload);
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [setPendingImport]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') return;
            const target = e.target as Element;
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
            e.preventDefault();
            if (e.shiftKey) {
                useFrameStore.getState().redo();
            } else {
                useFrameStore.getState().undo();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-800 tracking-tight">fixif</h1>
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="설정"
                >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </header>
            <main className="max-w-screen-2xl mx-auto p-6 space-y-4">
                <Dropzone />
                {frames.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <FrameToolbar />
                        <FrameTable />
                    </div>
                )}
            </main>
            <SidePanel />
            <BulkEditPanel />
            <SettingsPanel />
            <ClipboardImportModal />
            <Toast />
        </div>
    );
}

export default App;
