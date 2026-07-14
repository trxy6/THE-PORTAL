import React from 'react';
import { FeedIcon, MessageIcon, UserIcon, BrowseIcon } from './Icons';

interface BottomNavBarProps {
    activeItem: string;
    onItemClick: (name: string) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeItem, onItemClick }) => {
    const navItems = [
        { name: 'Feed', icon: <FeedIcon /> },
        { name: 'Mila', icon: <MessageIcon /> },
        { name: 'CraiveMe', icon: <UserIcon /> },
        { name: 'Browse', icon: <BrowseIcon /> },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t-2 border-gold-light/50 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
            <div className="max-w-md mx-auto flex justify-around items-center h-20 px-4">
                {navItems.map(item => {
                    const isActive = item.name === activeItem;
                    return (
                        <button
                            key={item.name}
                            onClick={() => onItemClick(item.name)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex flex-col items-center justify-center gap-1 w-20 transition-colors duration-200 ${isActive ? 'text-gold' : 'text-deep-green/50 hover:text-deep-green/80'}`}
                        >
                            {item.icon}
                            <span className={`text-xs font-semibold ${isActive ? 'text-deep-green' : 'text-deep-green/60'}`}>{item.name}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
