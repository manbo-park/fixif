import { Dropzone } from './components/Dropzone';
import { FrameTable } from './components/FrameTable';
import { FrameToolbar } from './components/FrameToolbar';
import { BulkEditPanel } from './components/BulkEditPanel';
import { SidePanel } from './components/SidePanel';
import { Toast } from './components/Toast';
import { useFrameStore } from './store/useFrameStore';

function App() {
    const frames = useFrameStore((s) => s.frames);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Fixif</h1>
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
            <Toast />
        </div>
    );
}

export default App;
