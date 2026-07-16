import React, { useState, useEffect } from 'react';
import type { User, CraiveTypeProfile, FoodMixResult, CraveSyncUserInput, CraveSyncOption, CraveSyncResult } from '../types';
import { generateFoodMix, generateCraveSyncSuggestions } from '../services/geminiService';
import { SpinnerIcon, GroupIcon } from '../components/Icons';
import { CraiveTypeQuizPage } from './CraiveTypeQuizPage';

const FoodMixCard: React.FC<{ result: FoodMixResult; onSave: () => void; isSaved: boolean }> = ({ result, onSave, isSaved }) => (
    <div className="bg-white/80 p-6 rounded-2xl shadow-lg border border-gold-light/30 backdrop-blur-sm animate-fade-in-up space-y-3">
        <div>
            <span className="text-xs font-bold text-deep-green/60">{result.personalityTag}</span>
            <h3 className="text-2xl font-bold text-deep-green">{result.craiveName}</h3>
        </div>
        <p className="text-deep-green/80 italic">"{result.craiveStory}"</p>
        <div>
            <h4 className="font-bold text-deep-green mb-1">How to make it:</h4>
            <p className="text-deep-green/90 whitespace-pre-wrap">{result.instructions}</p>
        </div>
        <div className="pt-2">
            <button 
                onClick={onSave}
                disabled={isSaved}
                className="w-full text-center p-2 bg-gold text-white font-semibold rounded-lg transition-colors duration-200 disabled:bg-gold/50 disabled:cursor-not-allowed hover:bg-deep-green"
            >
                {isSaved ? 'Saved to My Craives' : 'Save to My Craives'}
            </button>
        </div>
    </div>
);

const FoodMixView: React.FC<{
    user: User | null;
    updateUser: (user: User) => void;
    onBack: () => void;
}> = ({ user, updateUser, onBack }) => {
    const [mode, setMode] = useState<'select' | 'home' | 'restaurant'>('select');
    
    // "At Home" - Fridge Magician State
    const [ingredients, setIngredients] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<FoodMixResult[]>([]);

    const handleGenerate = async () => {
        if (!ingredients.trim()) {
            setError("Please enter some ingredients!");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResults([]);
        try {
            const foodMixResults = await generateFoodMix(ingredients, user);
            setResults(foodMixResults);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCraive = (resultToSave: FoodMixResult) => {
        if (!user) return;
        const updatedCraives = [...(user.myCraives || []), resultToSave];
        updateUser({ ...user, myCraives: updatedCraives });
    };

    const isCraiveSaved = (result: FoodMixResult) => {
        return user?.myCraives?.some(saved => saved.craiveName === result.craiveName) ?? false;
    };

    switch (mode) {
        case 'home': // Fridge Magician view
            return (
                <div className="animate-fade-in-up space-y-6">
                    <header className="text-center">
                        <h2 className="text-3xl font-bold text-deep-green">Fridge Magician</h2>
                        <p className="text-deep-green/80 mt-1">What leftovers are hiding in your fridge? Let's make magic.</p>
                    </header>
                    <div className="space-y-4">
                            <textarea
                            value={ingredients}
                            onChange={e => setIngredients(e.target.value)}
                            placeholder="e.g., rice, chicken, cheese, tomato sauce..."
                            rows={4}
                            className="w-full p-4 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none"
                        />
                            <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center p-4 bg-gold text-white font-bold rounded-lg shadow-lg hover:bg-deep-green transition-colors disabled:bg-gold/50"
                        >
                            {isLoading ? <SpinnerIcon /> : 'Generate Combos'}
                        </button>
                    </div>
                    {error && <p className="text-center text-red-500">{error}</p>}
                    {results.length > 0 && (
                        <div className="space-y-6 pt-4">
                            {results.map((res, index) => (
                                <FoodMixCard 
                                    key={index} 
                                    result={res} 
                                    onSave={() => handleSaveCraive(res)}
                                    isSaved={isCraiveSaved(res)}
                                />
                            ))}
                        </div>
                    )}
                        <button onClick={onBack} className="w-full mt-4 text-center p-2 text-deep-green/70 font-semibold hover:bg-gold-light/30 rounded-lg">
                        Back
                    </button>
                </div>
            );
        case 'restaurant':
            return (
                    <div className="animate-fade-in-up space-y-6 text-center">
                        <h2 className="text-3xl font-bold text-deep-green">Restaurant Mode</h2>
                        <p className="text-deep-green/80 mt-1">This feature is simmering and will be served soon!</p>
                        <div className="bg-white/60 p-6 rounded-2xl shadow-md border border-gold-light/30 text-left space-y-4">
                        <p>Soon, you'll be able to:</p>
                        <ul className="list-disc list-inside text-deep-green/90 space-y-2">
                            <li><strong>Menu Merge:</strong> Combine items from one or more restaurant menus.</li>
                            <li><strong>"Chef's Dare" Mode:</strong> Let Mila invent a wild combo for you to order.</li>
                            <li><strong>Smart Cost Balance:</strong> Keep your creations within your budget.</li>
                        </ul>
                        </div>
                        <button onClick={onBack} className="w-full mt-4 text-center p-2 text-deep-green/70 font-semibold hover:bg-gold-light/30 rounded-lg">
                        Back
                    </button>
                    </div>
            );

        case 'select':
        default:
            return (
                <div className="animate-fade-in-up space-y-8">
                    <header className="text-center">
                        <h1 className="text-4xl font-bold text-deep-green mb-2">FoodMix</h1>
                        <p className="text-lg text-deep-green/80">The Art of Flavor Fusion</p>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={() => setMode('home')} className="p-8 bg-white/60 rounded-2xl shadow-md border border-gold-light/30 hover:shadow-lg hover:bg-white/90 transition-all text-center space-y-2">
                            <span className="text-5xl">🏠</span>
                            <h3 className="text-2xl font-bold text-deep-green">At Home</h3>
                            <p className="text-deep-green/80">Turn your leftovers into art.</p>
                        </button>
                            <button onClick={() => setMode('restaurant')} className="p-8 bg-white/60 rounded-2xl shadow-md border border-gold-light/30 hover:shadow-lg hover:bg-white/90 transition-all text-center space-y-2">
                            <span className="text-5xl">🍽️</span>
                            <h3 className="text-2xl font-bold text-deep-green">At a Restaurant</h3>
                            <p className="text-deep-green/80">Remix the menu like never before.</p>
                        </button>
                    </div>
                     <button onClick={onBack} className="w-full mt-4 text-center p-2 text-deep-green/70 font-semibold hover:bg-gold-light/30 rounded-lg">
                        Back to Browse
                    </button>
                </div>
            );
    }
}

// --- CraveSync Feature ---

const CraveSyncPage: React.FC<{ user: User | null; onBack: () => void; }> = ({ user, onBack }) => {
    type CraveSyncStep = 'hub' | 'lobby' | 'joining' | 'braindump' | 'loading' | 'voting' | 'results';
    const [step, setStep] = useState<CraveSyncStep>('hub');
    const [sessionCode, setSessionCode] = useState('');
    const [lobbyUsers, setLobbyUsers] = useState<string[]>([]);
    
    // Brain Dump State
    const [loves, setLoves] = useState<string[]>([]);
    const [hates, setHates] = useState<string[]>([]);
    const [vibe, setVibe] = useState('');
    const [currentLove, setCurrentLove] = useState('');
    const [currentHate, setCurrentHate] = useState('');
    
    // Voting State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [options, setOptions] = useState<CraveSyncOption[]>([]);
    const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
    const [votes, setVotes] = useState<Record<string, 'yes' | 'no' | 'superlike'>>({});
    const [results, setResults] = useState<CraveSyncResult[]>([]);

    // Location State
    const [location, setLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'pending' | 'success' | 'error'>('pending');

    useEffect(() => {
        if (step === 'hub') {
            setLocationStatus('pending');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setLocationStatus('success');
                },
                async (error) => {
                    console.warn("Browser geolocation failed, trying free IP geolocation fallback...");
                    try {
                        const res = await fetch('https://ip-api.com/json');
                        if (res.ok) {
                            const data = await res.json();
                            if (data && typeof data.lat === 'number' && typeof data.lon === 'number') {
                                setLocation({ latitude: data.lat, longitude: data.lon });
                                setLocationStatus('success');
                                console.log(`Free IP geolocation succeeded for Browse: ${data.city || 'Unknown'}`);
                                return;
                            }
                        }
                    } catch (e) {
                        console.error("Free IP geolocation fallback failed:", e);
                    }
                    setLocationStatus('error');
                },
                { timeout: 5000 }
            );
        }
    }, [step]);


    const startLobby = () => {
        const code = (Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 4)).toUpperCase();
        setSessionCode(code);
        setLobbyUsers([user?.name || 'You', 'Friend 1', 'Friend 2']); // Mock users
        setStep('lobby');
    };

    const joinLobby = () => {
        // In a real app, this would validate the code
        setLobbyUsers(['Host', user?.name || 'You', 'Friend 2']); // Mock users
        setStep('lobby');
    };

    const startGame = () => {
        setStep('braindump');
    };

    const submitBrainDump = async () => {
        setIsLoading(true);
        setError(null);
        setStep('loading');

        const userInputs: CraveSyncUserInput[] = [
            { loves, hates, vibe },
            // Mock data for other users
            { loves: ['Italian', 'Pizza'], hates: ['Spicy'], vibe: 'Comfort food' },
            { loves: ['Ramen', 'Burgers'], hates: ['Seafood'], vibe: 'Quick and easy' },
        ];

        try {
            const suggestions = await generateCraveSyncSuggestions(userInputs, location);
            setOptions(suggestions);
            setCurrentOptionIndex(0);
            setVotes({});
            setStep('voting');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setStep('braindump'); // Go back on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleVote = (optionName: string, vote: 'yes' | 'no' | 'superlike') => {
        setVotes(prev => ({ ...prev, [optionName]: vote }));
        if (currentOptionIndex < options.length - 1) {
            setCurrentOptionIndex(prev => prev + 1);
        } else {
            // All votes are in, calculate results
            const finalResults = options.map(opt => {
                // Mock scoring logic
                let score = Math.floor(Math.random() * 20) + 70; // Base score
                if (votes[opt.name] === 'yes') score += 5;
                if (votes[opt.name] === 'superlike') score += 15;
                if (votes[opt.name] === 'no') score -= 10;
                return { ...opt, consensusScore: Math.min(100, score) };
            }).sort((a, b) => b.consensusScore - a.consensusScore).slice(0, 3);
            setResults(finalResults);
            setStep('results');
        }
    };
    
    const renderStep = () => {
        switch (step) {
            case 'hub':
                return (
                     <div className="animate-fade-in-up space-y-8">
                        <header className="text-center">
                            <h1 className="text-4xl font-bold text-deep-green mb-2">CraveSync</h1>
                            <p className="text-lg text-deep-green/80">The Decisive Dining Game</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button onClick={startLobby} className="p-8 bg-white/60 rounded-2xl shadow-md border border-gold-light/30 hover:shadow-lg hover:bg-white/90 transition-all text-center space-y-2">
                                <span className="text-5xl">🚀</span>
                                <h3 className="text-2xl font-bold text-deep-green">Start CraveSync</h3>
                                <p className="text-deep-green/80">Host a new session for your group.</p>
                            </button>
                            <button onClick={() => setStep('joining')} className="p-8 bg-white/60 rounded-2xl shadow-md border border-gold-light/30 hover:shadow-lg hover:bg-white/90 transition-all text-center space-y-2">
                                <span className="text-5xl">🎟️</span>
                                <h3 className="text-2xl font-bold text-deep-green">Join CraveSync</h3>
                                <p className="text-deep-green/80">Enter a code to join a friend's session.</p>
                            </button>
                        </div>
                        <button onClick={onBack} className="w-full mt-4 text-center p-2 text-deep-green/70 font-semibold hover:bg-gold-light/30 rounded-lg">Back to Browse</button>
                    </div>
                );
            case 'joining':
                 return (
                    <div className="animate-fade-in-up space-y-6 text-center">
                        <h2 className="text-3xl font-bold text-deep-green">Join a Lobby</h2>
                        <input type="text" placeholder="TACO77" className="w-full max-w-xs mx-auto text-center p-4 text-2xl tracking-widest font-bold bg-white/70 border-2 border-gold-light rounded-xl" />
                        <button onClick={joinLobby} className="w-full max-w-xs mx-auto p-3 bg-gold text-white font-bold rounded-lg">Join</button>
                        <button onClick={() => setStep('hub')} className="w-full max-w-xs mx-auto p-2 text-deep-green/70 font-semibold">Cancel</button>
                    </div>
                 );
            case 'lobby':
                return (
                    <div className="animate-fade-in-up space-y-6 text-center">
                        <h2 className="text-2xl font-bold text-deep-green">Lobby Code</h2>
                        <div className="p-4 bg-white/80 border-2 border-dashed border-gold rounded-xl">
                            <p className="text-5xl font-bold tracking-widest text-deep-green">{sessionCode}</p>
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(sessionCode)} className="text-gold font-semibold hover:underline">Copy Code</button>
                        <h3 className="text-xl font-bold text-deep-green pt-4">Who's Here?</h3>
                        <div className="flex justify-center gap-4 flex-wrap">
                            {lobbyUsers.map(name => <div key={name} className="px-4 py-2 bg-white rounded-full shadow">{name}</div>)}
                        </div>
                        <button onClick={startGame} className="w-full max-w-md mx-auto p-4 bg-gold text-white font-bold text-lg rounded-lg shadow-lg hover:bg-deep-green transition-colors">Start Game</button>
                        <button onClick={() => setStep('hub')} className="w-full max-w-md mx-auto p-2 text-deep-green/70 font-semibold">Leave Lobby</button>
                    </div>
                );
            case 'braindump':
                const addTag = (type: 'love' | 'hate') => {
                    if (type === 'love' && currentLove && loves.length < 5) { setLoves([...loves, currentLove]); setCurrentLove(''); }
                    if (type === 'hate' && currentHate && hates.length < 5) { setHates([...hates, currentHate]); setCurrentHate(''); }
                };
                 return (
                    <div className="animate-fade-in-up space-y-6">
                        <h2 className="text-3xl font-bold text-deep-green text-center">The Brain Dump</h2>
                        <p className="text-center text-deep-green/80">What are you in the mood for? (Don't worry, it's anonymous!)</p>
                        <p className="text-center text-sm text-deep-green/70 -mt-4">
                            {locationStatus === 'success' && '📍 Location found! Suggestions will be tailored to your area.'}
                            {locationStatus === 'error' && '⚠️ Could not get location. Suggestions will be generic.'}
                            {locationStatus === 'pending' && 'Getting your location for better suggestions...'}
                        </p>
                        {/* Loves */}
                        <div className="p-4 bg-white/60 rounded-xl shadow-sm">
                            <label className="font-bold text-deep-green">Loves ({loves.length}/5)</label>
                            <div className="flex gap-2 mt-2">
                                <input type="text" value={currentLove} onChange={e=>setCurrentLove(e.target.value)} placeholder="Cuisines, dishes, restaurants..." className="flex-grow p-2 rounded-md border-gold-light border"/>
                                <button onClick={() => addTag('love')} className="px-3 bg-gold text-white rounded-md font-bold">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">{loves.map((l, i) => <span key={i} className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-sm">{l}</span>)}</div>
                        </div>
                        {/* Hates */}
                        <div className="p-4 bg-white/60 rounded-xl shadow-sm">
                            <label className="font-bold text-deep-green">Hates ({hates.length}/5)</label>
                             <div className="flex gap-2 mt-2">
                                <input type="text" value={currentHate} onChange={e=>setCurrentHate(e.target.value)} placeholder="Vetoes, places you won't go..." className="flex-grow p-2 rounded-md border-gold-light border"/>
                                <button onClick={() => addTag('hate')} className="px-3 bg-gold text-white rounded-md font-bold">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">{hates.map((h, i) => <span key={i} className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-sm">{h}</span>)}</div>
                        </div>
                        {/* Vibe */}
                        <div className="p-4 bg-white/60 rounded-xl shadow-sm">
                             <label className="font-bold text-deep-green">The Craving (1 Vibe Check)</label>
                             <input type="text" value={vibe} onChange={e=>setVibe(e.target.value)} placeholder="e.g., 'Spicy', 'Healthy', 'Comfort food'" className="w-full p-2 rounded-md border-gold-light border mt-2"/>
                        </div>
                        <button onClick={submitBrainDump} className="w-full p-4 bg-gold text-white font-bold text-lg rounded-lg shadow-lg hover:bg-deep-green transition-colors">Sync My Cravings</button>
                    </div>
                 );
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in-up">
                        <SpinnerIcon />
                        <h1 className="text-2xl font-bold text-deep-green mt-4">Mila is Syncing...</h1>
                        <p className="text-lg text-deep-green/80 max-w-md">Analyzing group preferences and finding the perfect compromise!</p>
                    </div>
                );
            case 'voting':
                const currentOption = options[currentOptionIndex];
                if (!currentOption) return null;
                return (
                     <div className="animate-fade-in-up text-center">
                          <h2 className="text-3xl font-bold text-deep-green mb-2">Roulette Round</h2>
                          <p className="text-deep-green/80 mb-6">Swipe your decision! ({currentOptionIndex + 1}/{options.length})</p>
                          <div className="relative w-full max-w-sm mx-auto h-64">
                             <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-gold-light flex flex-col justify-between items-center h-full">
                                 <h3 className="text-3xl font-bold text-deep-green">{currentOption.name}</h3>
                                 <div>
                                     <p className="text-lg text-deep-green/80">{currentOption.cuisine}</p>
                                     <p className="font-semibold text-gold">{currentOption.price} • {currentOption.distance}</p>
                                 </div>
                             </div>
                          </div>
                          <div className="flex justify-center items-center gap-6 mt-8">
                              <button onClick={() => handleVote(currentOption.name, 'no')} className="p-4 rounded-full bg-red-200 text-red-700 shadow-lg text-4xl">👎</button>
                              <button onClick={() => handleVote(currentOption.name, 'superlike')} className="p-6 rounded-full bg-blue-200 text-blue-700 shadow-lg text-5xl">🤩</button>
                              <button onClick={() => handleVote(currentOption.name, 'yes')} className="p-4 rounded-full bg-green-200 text-green-700 shadow-lg text-4xl">👍</button>
                          </div>
                      </div>
                );
            case 'results':
                return (
                    <div className="animate-fade-in-up space-y-6 text-center">
                        <h2 className="text-3xl font-bold text-deep-green">The Podium!</h2>
                        <p className="text-deep-green/80">Here are your group's top 3 matches.</p>
                        <div className="space-y-4">
                            {results.map((res, i) => (
                                <div key={res.name} className="p-4 bg-white/80 rounded-xl shadow-lg border border-gold-light/50 text-left">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-deep-green/70">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} Place</p>
                                            <h3 className="text-2xl font-bold text-deep-green">{res.name}</h3>
                                            <p className="text-md text-deep-green/80">{res.cuisine} • {res.price} • {res.distance}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-gold">{res.consensusScore}%</p>
                                            <p className="text-xs text-gold/80">Match</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3 text-sm">
                                        <button className="flex-1 p-2 bg-gold-light/50 rounded-lg font-semibold text-deep-green">View Menu</button>
                                        <button className="flex-1 p-2 bg-gold-light/50 rounded-lg font-semibold text-deep-green">Navigate</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setStep('hub')} className="w-full mt-4 p-3 bg-gold text-white font-bold rounded-lg">Start a New Sync</button>
                    </div>
                );
        }
    }
    return <>{renderStep()}</>;
}


export const BrowsePage: React.FC<{ user: User | null; updateUser: (user: User) => void; setActiveTab: (tab: string) => void; }> = ({ user, updateUser, setActiveTab }) => {
    const [view, setView] = useState<'main' | 'foodmix' | 'quiz' | 'cravesync'>('main');

    const handleQuizComplete = (profile: CraiveTypeProfile) => {
        if (!user) return;
        const updatedUser = { ...user, craiveType: profile.name, craiveTypeProfile: profile };
        updateUser(updatedUser);
        setView('main'); // Go back to browse hub
        setActiveTab('CraiveMe'); // Switch to profile to see the results
    };

    if (view === 'quiz') {
        return <CraiveTypeQuizPage onQuizComplete={handleQuizComplete} />;
    }

    if (view === 'foodmix') {
        return <FoodMixView user={user} updateUser={updateUser} onBack={() => setView('main')} />;
    }

    if (view === 'cravesync') {
        return <CraveSyncPage user={user} onBack={() => setView('main')} />;
    }

    // Main hub view
    return (
        <div className="animate-fade-in-up space-y-8">
            <header className="text-center">
                <h1 className="text-4xl font-bold text-deep-green mb-2">Browse & Discover</h1>
                <p className="text-lg text-deep-green/80">Explore flavors, find your food identity, and customize your experience.</p>
            </header>
            <div className="space-y-4">
                 <button onClick={() => setView('cravesync')} className="w-full text-left p-6 bg-white/60 rounded-2xl shadow-md border border-gold-light/30 hover:shadow-lg hover:bg-white/90 transition-all">
                    <div className="flex items-center gap-4">
                        <GroupIcon className="text-gold"/>
                        <div>
                            <h3 className="text-2xl font-bold text-deep-green">CraveSync</h3>
                            <p className="text-deep-green/80 mt-1">Play the decisive dining game with friends to find the perfect spot.</p>
                        </div>
                    </div>
                </button>
                <button onClick={() => setView('foodmix')} className="w-full text-left p-6 bg-white/60 rounded-2xl shadow-md border border-gold-light/30 hover:shadow-lg hover:bg-white/90 transition-all">
                    <h3 className="text-2xl font-bold text-deep-green">FoodMix 🥣</h3>
                    <p className="text-deep-green/80 mt-1">The Art of Flavor Fusion. Turn leftovers into art or remix restaurant menus.</p>
                </button>
                <button onClick={() => setView('quiz')} className="w-full text-left p-6 bg-white/60 rounded-2xl shadow-md border border-gold-light/30 hover:shadow-lg hover:bg-white/90 transition-all">
                    <h3 className="text-2xl font-bold text-deep-green">CraiveType Quiz 🤔</h3>
                    <p className="text-deep-green/80 mt-1">Discover your unique food personality and get hyper-personalized suggestions.</p>
                </button>
                <button onClick={() => setActiveTab('CraiveMe')} className="w-full text-left p-6 bg-white/60 rounded-2xl shadow-md border border-gold-light/30 hover:shadow-lg hover:bg-white/90 transition-all">
                    <h3 className="text-2xl font-bold text-deep-green">Settings & Profile ⚙️</h3>
                    <p className="text-deep-green/80 mt-1">Teach Mila about your tastes and manage your account.</p>
                </button>
            </div>
        </div>
    );
};
