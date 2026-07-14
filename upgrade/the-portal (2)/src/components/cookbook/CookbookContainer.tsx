import React, { useState, useEffect } from 'react';
import { FeedPage } from './pages/FeedPage';
import { CraiveAIPage } from './pages/CraiveAIPage';
import { CraiveMePage } from './pages/CraiveMePage';
import { BrowsePage } from './pages/BrowsePage';
import type { User } from './types';
import { MessageSquare, Library, Award, Newspaper } from 'lucide-react';

export const CookbookContainer: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Mila');
    
    const [user, setUser] = useState<User>(() => {
        const stored = localStorage.getItem('craiveUser');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        return {
            email: 'guest@portal.io',
            name: 'Portal Culinary Chef',
            onboardingComplete: true,
            followers: 0,
            following: 0,
            craiveType: 'The Adventurous Explorer',
            myCraives: []
        };
    });

    useEffect(() => {
        localStorage.setItem('craiveUser', JSON.stringify(user));
    }, [user]);

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    // Bg music states locally managed
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isMilaVoiceEnabled, setIsMilaVoiceEnabled] = useState(true);

    const toggleMusic = () => setIsMusicPlaying(prev => !prev);
    const toggleMilaVoice = () => setIsMilaVoiceEnabled(prev => !prev);

    const renderContent = () => {
        switch (activeTab) {
            case 'Feed':
                return <FeedPage />;
            case 'Mila':
                return (
                    <CraiveAIPage 
                        user={user} 
                        setActiveTab={setActiveTab} 
                        isFirstLogin={false} 
                        onWelcomeMessageShown={() => {}} 
                        isMilaVoiceEnabled={isMilaVoiceEnabled} 
                    />
                );
            case 'CraiveMe':
                return (
                    <CraiveMePage 
                        onLogout={() => {}} 
                        user={user} 
                        updateUser={updateUser} 
                        setActiveTab={setActiveTab} 
                        isMusicPlaying={isMusicPlaying} 
                        toggleMusic={toggleMusic} 
                        isMilaVoiceEnabled={isMilaVoiceEnabled} 
                        toggleMilaVoice={toggleMilaVoice} 
                    />
                );
            case 'Browse':
                return (
                    <BrowsePage 
                        user={user} 
                        updateUser={updateUser} 
                        setActiveTab={setActiveTab} 
                    />
                );
            default:
                return null;
        }
    };

    const tabs = [
        { name: 'Mila', label: 'Chef Mila', icon: MessageSquare },
        { name: 'Browse', label: 'Flavors & Games', icon: Library },
        { name: 'CraiveMe', label: 'CraiveMe Profile', icon: Award },
        { name: 'Feed', label: 'Social Feed', icon: Newspaper }
    ];

    return (
        <div className="flex flex-col h-full text-left space-y-4">
            {/* Local top sticky navigation bar built for mobile & desktop */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-white/5">
                <div>
                    <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                        🥣 CRAIVE Culinary Suite
                    </h2>
                    <p className="text-[10px] text-slate-500">Your on-device flavor psychologist, meal remixes, and dining games</p>
                </div>
                
                {/* Tab switches */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.name;
                        return (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    isActive 
                                        ? 'text-white shadow-md' 
                                        : 'text-slate-400 hover:text-white'
                                }`}
                                style={isActive ? {
                                    background: 'var(--theme-btn-gradient)',
                                    boxShadow: '0 0 10px var(--theme-card-border)'
                                } : undefined}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main content display container */}
            <div className="flex-grow overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};
