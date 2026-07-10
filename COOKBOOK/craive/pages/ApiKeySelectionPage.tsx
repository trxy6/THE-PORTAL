import React from 'react';

interface ApiKeySelectionPageProps {
    onKeySelected: () => void;
}

export const ApiKeySelectionPage: React.FC<ApiKeySelectionPageProps> = ({ onKeySelected }) => {
    const handleSelectKey = async () => {
        if (window.aistudio) {
            try {
                await window.aistudio.openSelectKey();
                onKeySelected();
            } catch (error) {
                console.error("Error opening API key selection dialog:", error);
            }
        } else {
            alert("API key selection is not available in this environment.");
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
            <div className="auth-background absolute inset-0"></div>
            <div className="w-full max-w-md z-10 bg-white/60 p-8 rounded-3xl shadow-lg border border-gold-light/30 backdrop-blur-md">
                <h1 className="text-3xl font-bold text-deep-green mb-4">API Key Required</h1>
                <p className="text-deep-green/80 mb-6">
                    To power Mila's AI features, Craive uses the Google Gemini API. Please select a project with the Gemini API enabled to continue.
                </p>
                <p className="text-sm text-deep-green/70 mb-6">
                    Make sure billing is enabled for your project. For more information, please see the{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-gold font-semibold hover:underline">
                        Gemini API billing documentation
                    </a>.
                </p>
                <button
                    onClick={handleSelectKey}
                    className="w-full py-3 px-4 rounded-xl shadow-sm text-lg font-bold text-white bg-gold hover:bg-deep-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-light transition-all duration-300"
                >
                    Select Project API Key
                </button>
            </div>
        </div>
    );
};
