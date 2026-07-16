import React, { useState } from 'react';
import type { User, CraiveTypeProfile, FoodMixResult } from '../types';
import { SpinnerIcon, MusicOnIcon, MusicOffIcon, BellIcon } from '../components/Icons';
import { CraiveTypeResultPage } from './CraiveTypeResultPage';


const SavedCraiveCard: React.FC<{ result: FoodMixResult }> = ({ result }) => (
    <div className="bg-white/80 p-4 rounded-xl shadow-md border border-gold-light/30 space-y-2">
        <div>
            <span className="text-xs font-bold text-deep-green/60">{result.personalityTag}</span>
            <h3 className="text-lg font-bold text-deep-green">{result.craiveName}</h3>
        </div>
        <details>
            <summary className="cursor-pointer text-sm font-semibold text-gold hover:underline">View Recipe</summary>
            <div className="mt-2 pt-2 border-t border-gold-light/30">
                <p className="text-sm text-deep-green/80 italic mb-2">"{result.craiveStory}"</p>
                <p className="text-sm text-deep-green/90 whitespace-pre-wrap">{result.instructions}</p>
            </div>
        </details>
    </div>
);


export const CraiveMePage: React.FC<{
    onLogout: () => void;
    user: User | null;
    updateUser: (user: User) => void;
    setActiveTab: (tab: string) => void;
    isMusicPlaying: boolean;
    toggleMusic: () => void;
    isMilaVoiceEnabled: boolean;
    toggleMilaVoice: () => void;
}> = ({ onLogout, user, updateUser, setActiveTab, isMusicPlaying, toggleMusic, isMilaVoiceEnabled, toggleMilaVoice }) => {
    const [view, setView] = useState<'main' | 'result' | 'teach'>('main');

    // "Teach Mila" local state
    const [favoriteCuisines, setFavoriteCuisines] = useState(user?.favoriteCuisines || '');
    const [spiceTolerance, setSpiceTolerance] = useState(user?.spiceTolerance || '');
    const [dietGoals, setDietGoals] = useState(user?.dietGoals || '');
    const [foodHabits, setFoodHabits] = useState(user?.foodHabits || '');

    if (!user) {
        return <div className="flex items-center justify-center h-full"><SpinnerIcon /></div>;
    }
    
    const handleTeachMilaSave = () => {
        const updatedUser = { ...user, favoriteCuisines, spiceTolerance, dietGoals, foodHabits };
        updateUser(updatedUser);
        setView('main');
    };

    const handleMemoryModeChange = (mode: 'surface' | 'deep') => {
        // Here we can also update the legacy `aiMemoryConsent` for compatibility if needed.
        const aiMemoryConsent = mode === 'deep';
        updateUser({ ...user, memoryMode: mode, aiMemoryConsent });
    };

    if (view === 'result' && user?.craiveTypeProfile) {
        return <CraiveTypeResultPage profile={user.craiveTypeProfile} onBack={() => setView('main')} />;
    }
    
    if (view === 'teach') {
        return (
            <div className="animate-fade-in-up space-y-6">
                 <h2 className="text-3xl font-bold text-deep-green text-center">Teach Mila About You</h2>
                 <div className="space-y-4 p-4 bg-white/60 rounded-2xl shadow-md border border-gold-light/30">
                     <div>
                         <label className="block text-sm font-medium text-deep-green/80 mb-1">Favorite Cuisines</label>
                         <input type="text" value={favoriteCuisines} onChange={e => setFavoriteCuisines(e.target.value)} placeholder="e.g., Italian, Thai, Mexican" className="w-full px-4 py-2 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-deep-green/80 mb-1">Spice Tolerance</label>
                         <select value={spiceTolerance} onChange={e => setSpiceTolerance(e.target.value as any)} className="w-full px-4 py-2 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green">
                             <option value="">Select...</option>
                             <option value="Mild">Mild</option>
                             <option value="Medium">Medium</option>
                             <option value="Spicy">Spicy</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-deep-green/80 mb-1">Diet Goals</label>
                         <textarea value={dietGoals} onChange={e => setDietGoals(e.target.value)} placeholder="e.g., Eat more vegetables, less sugar" rows={2} className="w-full px-4 py-2 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green" />
                     </div>
                      <div>
                         <label className="block text-sm font-medium text-deep-green/80 mb-1">Your Food Habits</label>
                         <textarea value={foodHabits} onChange={e => setFoodHabits(e.target.value)} placeholder="e.g., I eat dinner late, I hate soggy fries" rows={2} className="w-full px-4 py-2 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green" />
                     </div>
                 </div>
                 <button onClick={handleTeachMilaSave} className="w-full text-center p-3 bg-gold text-white font-bold hover:bg-deep-green rounded-lg">Save Preferences</button>
                 <button onClick={() => setView('main')} className="w-full text-center p-2 text-deep-green/70 font-semibold hover:bg-gold-light/30 rounded-lg">Cancel</button>
             </div>
         );
     }

    // Main View
    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            <header className="text-center mb-6">
                <div className="relative flex justify-center items-center">
                    <h1 className="text-4xl font-bold text-deep-green">CraiveMe</h1>
                    <button className="absolute right-0 top-1/2 -translate-y-1/2 text-deep-green/70 hover:text-gold transition-colors">
                        <BellIcon hasNotification={user.hasUnreadNotifications} />
                    </button>
                </div>
                <p className="text-lg text-deep-green/80">Your personal craving profile.</p>
            </header>

            <div className="flex justify-center gap-8 mb-6 text-center">
                <div>
                    <p className="text-2xl font-bold text-deep-green">{user.followers ?? 0}</p>
                    <p className="text-sm text-deep-green/70">Followers</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-deep-green">{user.following ?? 0}</p>
                    <p className="text-sm text-deep-green/70">Following</p>
                </div>
            </div>


            <div className="flex-grow space-y-6">
                <div className="p-4 bg-white/60 rounded-2xl shadow-md border border-gold-light/30">
                     <h3 className="font-bold text-deep-green text-xl text-center mb-2">Your CraiveType</h3>
                    {user.craiveTypeProfile ? (
                        <div className="text-center">
                            <p className="text-deep-green/80">You are a <span className="font-bold text-gold">{user.craiveTypeProfile.name}</span>!</p>
                            <button onClick={() => setView('result')} className="mt-2 text-gold hover:underline font-semibold">View Full Profile</button>
                        </div>
                    ) : (
                        <div className="text-center">
                             <p className="text-deep-green/80">Discover your unique food identity.</p>
                            <button onClick={() => setActiveTab('Browse')} className="mt-2 w-full max-w-xs mx-auto p-3 bg-gold text-white font-bold hover:bg-deep-green rounded-lg">Discover in Browse</button>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white/60 rounded-2xl shadow-md border border-gold-light/30">
                     <h3 className="font-bold text-deep-green text-xl text-center mb-2">Teach Mila</h3>
                     <p className="text-center text-deep-green/80 text-sm mb-3">The more Mila knows, the better your recommendations.</p>
                     <button onClick={() => setView('teach')} className="w-full text-center p-3 bg-gold-light text-deep-green font-semibold hover:bg-gold/80 rounded-lg">Update Preferences</button>
                </div>

                <div className="p-4 bg-white/60 rounded-2xl shadow-md border border-gold-light/30">
                    <h3 className="font-bold text-deep-green text-xl text-center mb-4">My Saved Craives</h3>
                    {(user.myCraives && user.myCraives.length > 0) ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                           {user.myCraives.map((craive, index) => <SavedCraiveCard key={index} result={craive} />)}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-deep-green/70">You haven't saved any FoodMix creations yet. Head to the Browse tab to get started!</p>
                    )}
                </div>

                 <div className="p-4 bg-white/60 rounded-2xl shadow-md border border-gold-light/30">
                     <h3 className="font-bold text-deep-green text-xl text-center mb-4">Settings</h3>
                     <div className="space-y-4 divide-y divide-gold-light/30">
                        <div className="flex items-center justify-between pt-4 first:pt-0">
                            <span className="font-semibold text-deep-green">Background Music</span>
                            <button onClick={toggleMusic} className="flex items-center gap-2 px-3 py-1 rounded-full bg-gold-light/30 text-deep-green">
                                {isMusicPlaying ? <MusicOnIcon /> : <MusicOffIcon />}
                                <span>{isMusicPlaying ? 'On' : 'Off'}</span>
                            </button>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <span className="font-semibold text-deep-green">Mila's Voice</span>
                            <button onClick={toggleMilaVoice} className="flex items-center gap-2 px-3 py-1 rounded-full bg-gold-light/30 text-deep-green">
                                {isMilaVoiceEnabled ? <MusicOnIcon /> : <MusicOffIcon />}
                                <span>{isMilaVoiceEnabled ? 'On' : 'Off'}</span>
                            </button>
                        </div>
                        <div className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-semibold text-deep-green">Memory Depth</span>
                                    <p className="text-xs text-deep-green/70">Control how Mila learns about you.</p>
                                </div>
                                <div className="flex rounded-full bg-gold-light/30 p-1 text-sm font-semibold">
                                    <button onClick={() => handleMemoryModeChange('surface')} className={`px-3 py-1 rounded-full transition-colors ${user.memoryMode === 'deep' ? 'text-deep-green/70' : 'bg-white shadow'}`}>Surface</button>
                                    <button onClick={() => handleMemoryModeChange('deep')} className={`px-3 py-1 rounded-full transition-colors ${user.memoryMode === 'deep' ? 'bg-white shadow' : 'text-deep-green/70'}`}>Deep</button>
                                </div>
                            </div>
                            <p className="text-xs text-deep-green/60 mt-2">
                                <span className="font-bold">Surface:</span> Temporary recommendations. <span className="font-bold">Deep:</span> Mila learns your long-term patterns.
                            </p>
                        </div>
                     </div>
                </div>
            </div>

            <div className="mt-auto pt-8">
                 <button onClick={onLogout} className="w-full text-center p-3 text-deep-green/70 font-semibold hover:bg-gold-light/30 rounded-lg">Log Out</button>
            </div>
        </div>
    );
};
