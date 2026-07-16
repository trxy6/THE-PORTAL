import React from 'react';

interface CategoryBubbleProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    style?: React.CSSProperties;
}

export const CategoryBubble: React.FC<CategoryBubbleProps> = ({ label, icon, onClick, style }) => {
    return (
        <button
            onClick={onClick}
            style={style}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white/60 rounded-2xl shadow-md border border-gold-light/50 hover:shadow-lg hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer animate-fade-in-up"
        >
            <div className="text-gold">{icon}</div>
            <span className="font-semibold text-deep-green text-sm">{label}</span>
        </button>
    );
};
