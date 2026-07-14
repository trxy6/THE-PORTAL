import React from 'react';
import type { CraiveTypeProfile } from '../types';
import { QuizIcon } from '../components/Icons';

interface CraiveTypeResultPageProps {
    profile: CraiveTypeProfile;
    onBack: () => void;
}

const DetailSection: React.FC<{ title: string, items: string[] }> = ({ title, items }) => (
    <div>
        <h4 className="font-bold text-deep-green border-b border-gold-light/50 pb-1 mb-2">{title}</h4>
        <ul className="list-disc list-inside text-deep-green/80 space-y-1">
            {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
    </div>
);

export const CraiveTypeResultPage: React.FC<CraiveTypeResultPageProps> = ({ profile, onBack }) => {
    return (
        <div className="animate-fade-in-up space-y-6">
            <header className="bg-deep-green text-cream p-6 rounded-2xl shadow-lg text-center">
                <div className="flex justify-center text-gold-light mb-2"><QuizIcon /></div>
                <p className="text-sm font-semibold uppercase tracking-wider">Your CraiveType Is...</p>
                <h1 className="text-4xl font-bold text-white">{profile.name}</h1>
                <p className="text-gold-light italic mt-1 text-lg">"{profile.title}"</p>
            </header>

            <div className="bg-white/60 p-6 rounded-2xl shadow-md border border-gold-light/30 space-y-4">
                <p className="text-deep-green/90 text-lg leading-relaxed">{profile.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <DetailSection title="Strengths" items={profile.strengths} />
                    <DetailSection title="Weaknesses" items={profile.weaknesses} />
                    <DetailSection title="Comfort Foods" items={profile.comfortFoods} />
                    <DetailSection title="Risky Flavors" items={profile.riskyFlavors} />
                </div>
            </div>

            <button
                onClick={onBack}
                className="w-full text-center p-3 bg-gold text-white font-semibold hover:bg-deep-green rounded-lg transition-colors duration-200"
            >
                Back to Profile
            </button>
        </div>
    );
};
