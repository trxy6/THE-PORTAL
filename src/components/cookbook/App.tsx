import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { BottomNavBar } from './components/BottomNavBar';
import { FeedPage } from './pages/FeedPage';
import { CraiveAIPage } from './pages/CraiveAIPage';
import { BrowsePage } from './pages/BrowsePage';
import { CraiveMePage } from './pages/CraiveMePage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ApiKeySelectionPage } from './pages/ApiKeySelectionPage';
import type { User } from './types';
import { backgroundMusicDataUrl } from './data/audioData';

const App: React.FC = () => {
    const [showSplash, setShowSplash] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem('isLoggedInCraive') === 'true' || sessionStorage.getItem('isLoggedInCraive') === 'true';
    });
    const [activeTab, setActiveTab] = useState('Mila');
    const [user, setUser] = useState<User | null>(null);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    
    // API Key State
    const [hasApiKey, setHasApiKey] = useState(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);

    // Background Music State
    const [isMusicPlaying, setIsMusicPlaying] = useState(() => localStorage.getItem('craiveMusicEnabled') === 'true');
    const audioRef = useRef<HTMLAudioElement>(null);
    
    // Mila's Voice State
    const [isMilaVoiceEnabled, setIsMilaVoiceEnabled] = useState(() => localStorage.getItem('craiveMilaVoiceEnabled') !== 'false');

    const checkApiKey = useCallback(async () => {
        // We always set hasApiKey to true to let users use the app immediately with our Local AI fallback.
        setHasApiKey(true);
        setIsCheckingApiKey(false);
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);
    
    useEffect(() => {
        const handleApiError = (event: PromiseRejectionEvent) => {
            const error = event.reason;
            if (error instanceof Error && (
                error.message.includes('permission denied') ||
                error.message.toLowerCase().includes('api key not valid') ||
                error.message.includes('Requested entity was not found')
            )) {
                console.error("Caught Gemini API auth error, falling back to Local AI:", error);
                event.preventDefault();
            }
        };
        window.addEventListener('unhandledrejection', handleApiError);
        return () => {
            window.removeEventListener('unhandledrejection', handleApiError);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 3000);
        return () => clearTimeout(timer);
    }, []);
    
    const loadUser = useCallback(() => {
        if (isLoggedIn) {
            const userJson = localStorage.getItem('craiveUser');
            if (userJson) {
                try {
                    const parsedUser: User = JSON.parse(userJson);
                    setUser(parsedUser);
                    if (!parsedUser.onboardingComplete) {
                        setNeedsOnboarding(true);
                    }
                } catch (e) {
                    console.error("Failed to parse user data from storage", e);
                    localStorage.removeItem('craiveUser'); // Clear corrupted data
                }
            }
        }
    }, [isLoggedIn]);

    useEffect(() => {
        loadUser();
    }, [isLoggedIn, loadUser]);

    // Background Music Effect
    useEffect(() => {
        if (audioRef.current) {
            if (isMusicPlaying) {
                audioRef.current.play().catch(error => {
                    // Autoplay is often restricted by browsers. We can ignore this error
                    // as user interaction will eventually trigger the music.
                    console.log("Audio play prevented by browser policy until user interaction.");
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isMusicPlaying]);


    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('craiveUser', JSON.stringify(updatedUser));
    };
    
    const handleAuthSuccess = (rememberMe: boolean) => {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('isLoggedInCraive', 'true');
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedInCraive');
        sessionStorage.removeItem('isLoggedInCraive');
        localStorage.removeItem('craiveUser');
        setUser(null);
        setIsLoggedIn(false);
        setNeedsOnboarding(false);
    };

    const handleOnboardingComplete = (onboardedUser: User) => {
        const finalUser = { ...onboardedUser, onboardingComplete: true };
        updateUser(finalUser);
        setNeedsOnboarding(false);
        setIsFirstLogin(true);
        setActiveTab('Mila');
    };

    const toggleMusic = () => {
      setIsMusicPlaying(prev => {
        const newState = !prev;
        localStorage.setItem('craiveMusicEnabled', String(newState));
        return newState;
      });
    };
    
    const toggleMilaVoice = () => {
      setIsMilaVoiceEnabled(prev => {
        const newState = !prev;
        localStorage.setItem('craiveMilaVoiceEnabled', String(newState));
        return newState;
      });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Feed':
                return <FeedPage />;
            case 'Mila':
                return <CraiveAIPage user={user} setActiveTab={setActiveTab} isFirstLogin={isFirstLogin} onWelcomeMessageShown={() => setIsFirstLogin(false)} isMilaVoiceEnabled={isMilaVoiceEnabled} />;
            case 'CraiveMe':
                return <CraiveMePage onLogout={handleLogout} user={user} updateUser={updateUser} setActiveTab={setActiveTab} isMusicPlaying={isMusicPlaying} toggleMusic={toggleMusic} isMilaVoiceEnabled={isMilaVoiceEnabled} toggleMilaVoice={toggleMilaVoice} />;
            case 'Browse':
                return <BrowsePage user={user} updateUser={updateUser} setActiveTab={setActiveTab} />;
            default:
                return <CraiveAIPage user={user} setActiveTab={setActiveTab} isFirstLogin={isFirstLogin} onWelcomeMessageShown={() => setIsFirstLogin(false)} isMilaVoiceEnabled={isMilaVoiceEnabled} />;
        }
    };

    if (showSplash || isCheckingApiKey) {
        return <SplashScreen />;
    }

    if (!hasApiKey) {
        return <ApiKeySelectionPage onKeySelected={checkApiKey} />;
    }

    if (!isLoggedIn) {
        return <AuthPage onAuthSuccess={handleAuthSuccess} />;
    }

    if (needsOnboarding && user) {
        return <OnboardingPage user={user} onComplete={handleOnboardingComplete} />;
    }

    return (
        <div className="h-screen max-h-screen bg-cream text-deep-green flex flex-col overflow-hidden">
            <audio ref={audioRef} src={backgroundMusicDataUrl} loop />
            <main className="flex-grow p-6 pb-24 overflow-y-auto">
                {renderContent()}
            </main>
            <BottomNavBar activeItem={activeTab} onItemClick={setActiveTab} />
        </div>
    );
};

export default App;
