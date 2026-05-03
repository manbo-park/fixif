import { useToastStore } from '../store/useToastStore';

export function Toast() {
    const { message, type, hide } = useToastStore();

    if (!message) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast-in">
            <div className="flex items-center gap-2.5 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
                {type === 'success' ? (
                    <svg className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="8" r="7" />
                        <path d="M5 8.5l2 2 4-4" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 5zm0 6.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                    </svg>
                )}
                <span>{message}</span>
                <button onClick={hide} className="ml-1 text-gray-400 hover:text-white">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3l10 10M13 3L3 13" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
