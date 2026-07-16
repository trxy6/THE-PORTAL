import React from 'react';

interface SuggestionCardProps {
    title: string;
    description: string;
    style?: React.CSSProperties;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ title, description, style }) => {
    return (
        <div 
            style={style}
            className="bg-white/80 p-6 rounded-2xl shadow-lg border border-gold-light/30 backdrop-blur-sm animate-fade-in-up"
        >
            <h3 className="text-xl font-bold text-deep-green mb-2">{title}</h3>
            <p className="text-deep-green/80">{description}</p>
        </div>
    );
};
