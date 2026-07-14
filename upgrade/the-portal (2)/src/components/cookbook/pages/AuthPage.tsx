import React, { useState, useMemo } from 'react';
import { CheckIcon, CrossIcon, SpinnerIcon, EyeOpenIcon, EyeClosedIcon } from '../components/Icons';
import type { User } from '../types';

interface AuthPageProps {
    onAuthSuccess: (rememberMe: boolean) => void;
}

const PasswordRequirement: React.FC<{ isValid: boolean; text: string }> = ({ isValid, text }) => {
    const color = isValid ? 'text-green-600' : 'text-deep-green/60';
    return (
        <li className={`flex items-center text-xs transition-colors duration-300 ${color}`}>
            {isValid ? <CheckIcon className="mr-2 text-green-500" /> : <CrossIcon className="mr-2 text-gray-400" />}
            {text}
        </li>
    );
};


export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showDevCodeInput, setShowDevCodeInput] = useState(false);
    const [devCode, setDevCode] = useState('');

    const passwordValidation = useMemo(() => {
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const allValid = hasLength && hasUpper && hasLower && hasNumber;
        return { hasLength, hasUpper, hasLower, hasNumber, allValid };
    }, [password]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Simulate network request
        setTimeout(() => {
            if (isLoginMode) {
                // Login logic
                const storedUserRaw = localStorage.getItem('craiveUser');
                if (!storedUserRaw) {
                    setError("No account found. Please sign up.");
                    setIsLoading(false);
                    return;
                }
                const storedUser: User = JSON.parse(storedUserRaw);
                if (storedUser.email === email && storedUser.password === password) {
                    onAuthSuccess(rememberMe);
                } else {
                    setError("Invalid email or password. Please try again.");
                    setIsLoading(false);
                }
            } else {
                // Sign Up logic
                if (passwordValidation.allValid) {
                    const newUser: User = { 
                        name: '',
                        email, 
                        password,
                        onboardingComplete: false, // Set to false to trigger onboarding
                    };
                    localStorage.setItem('craiveUser', JSON.stringify(newUser));
                    onAuthSuccess(rememberMe);
                } else {
                    setError("Please ensure your password meets all requirements.");
                    setIsLoading(false);
                }
            }
        }, 1000);
    };
    
    const handleGuestLogin = () => {
        setIsLoading(true);
        setError(null);
        setTimeout(() => {
            const guestUser: User = {
                name: 'Guest',
                email: 'guest@craive.app',
                onboardingComplete: true, // Bypass preferences/onboarding completely!
                craiveType: 'The Adventurous Explorer',
                craiveTypeProfile: {
                    name: 'The Adventurous Explorer',
                    title: 'The Adventurous Explorer',
                    description: 'You love discovering new dishes, experimenting with flavors, and trying exotic culinary combinations. Every meal is an adventure for you.',
                    strengths: ['Culinary curiosity', 'Adaptable palate', 'Brave flavor choices'],
                    weaknesses: ['Impulsive ordering', 'Easily bored with repeat meals'],
                    comfortFoods: ['Spicy ramen', 'Birria tacos', 'Sichuan hotpot'],
                    riskyFlavors: ['Durian crepe', 'Snail sausage', 'Fermented mustard greens']
                },
                favoriteCuisines: 'Japanese, Mexican, Thai, Italian',
                spiceTolerance: 'Spicy',
                dietGoals: 'Explore all tastes',
                foodHabits: 'Adventurous diner',
                myCraives: []
            };
            localStorage.setItem('craiveUser', JSON.stringify(guestUser));
            onAuthSuccess(true);
        }, 800);
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError(null);
    }
    
    const handleDevAccessClick = () => {
        setShowDevCodeInput(true);
        setError(null);
    };

    const handleDevCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (devCode === 'FoOd') {
            setIsLoading(true);
            setError(null);

            setTimeout(() => {
                const devEmail = 'dev@craive.app';
                const userJson = localStorage.getItem('craiveUser');
                let user: User | null = null;
                if (userJson) {
                    try {
                        user = JSON.parse(userJson);
                    } catch {
                        user = null;
                    }
                }

                if (!user || user.email !== devEmail) {
                    const devUser: User = {
                        name: 'Dev',
                        email: devEmail,
                        password: 'devpassword',
                        onboardingComplete: false,
                    };
                    localStorage.setItem('craiveUser', JSON.stringify(devUser));
                }

                onAuthSuccess(true);
            }, 500);
        } else {
            setError('Incorrect developer code.');
            setDevCode('');
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="auth-background absolute inset-0"></div>
            <div className="w-full max-w-sm z-10">
                <h1 className="text-6xl font-bold tracking-widest text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gold via-gold-light to-gold animate-fade-in-up">
                    CRAIVE
                </h1>

                <div className="bg-white/60 p-8 rounded-3xl shadow-lg border border-gold-light/30 backdrop-blur-md animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-3xl font-bold text-deep-green text-center mb-6">
                        {isLoginMode ? 'Welcome Back' : 'Join Craive'}
                    </h2>
                    
                    {error && <p className="text-red-500 text-sm text-center mb-4 -mt-2">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-deep-green/80">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="mt-1 block w-full px-4 py-3 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none transition-shadow duration-300 disabled:opacity-70"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-deep-green/80">Password</label>
                            <div className="relative mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={isLoginMode ? "current-password" : "new-password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full px-4 py-3 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none transition-shadow duration-300 disabled:opacity-70"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-deep-green/60 hover:text-deep-green transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeClosedIcon className="h-5 w-5" /> : <EyeOpenIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        
                        {!isLoginMode && (
                             <ul className="space-y-1 pt-1">
                                <PasswordRequirement isValid={passwordValidation.hasLength} text="At least 8 characters" />
                                <PasswordRequirement isValid={passwordValidation.hasUpper} text="One uppercase letter" />
                                <PasswordRequirement isValid={passwordValidation.hasLower} text="One lowercase letter" />
                                <PasswordRequirement isValid={passwordValidation.hasNumber} text="One number" />
                            </ul>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gold-light/80 text-gold focus:ring-gold"
                                    disabled={isLoading}
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-deep-green/90">
                                    Remember me
                                </label>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || (!isLoginMode && !passwordValidation.allValid)}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-gold hover:bg-deep-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-light transition-all duration-300 disabled:bg-gold/50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <SpinnerIcon /> : isLoginMode ? 'Log In' : 'Sign Up'}
                            </button>
                        </div>

                        <div className="relative my-4 flex py-1 items-center">
                            <div className="flex-grow border-t border-gold-light/40"></div>
                            <span className="flex-shrink mx-3 text-xs text-deep-green/60">or</span>
                            <div className="flex-grow border-t border-gold-light/40"></div>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleGuestLogin}
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border-2 border-gold text-gold rounded-xl text-lg font-bold bg-white/40 hover:bg-gold hover:text-white focus:outline-none transition-all duration-300 disabled:opacity-50"
                            >
                                Use as Guest (Skip Prefs)
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-sm">
                        <button
                            onClick={toggleMode}
                            className="font-medium text-deep-green hover:text-gold transition-colors disabled:opacity-70"
                            disabled={isLoading}
                        >
                            {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                        </button>
                    </p>
                </div>

                <p className="mt-4 px-2 text-xs text-center text-deep-green/60">
                    Your privacy matters. Your preferences are stored locally on your device. To provide personalized suggestions, anonymized preferences may be sent to our AI partner. We never share your email or password.
                </p>
                
                <div className="text-center mt-2 h-8">
                    {!showDevCodeInput ? (
                        <button
                            onClick={handleDevAccessClick}
                            disabled={isLoading}
                            className="text-xs text-deep-green/50 hover:text-gold transition-colors disabled:opacity-50"
                        >
                            Developer Access
                        </button>
                    ) : (
                         <form onSubmit={handleDevCodeSubmit} className="flex gap-2 justify-center items-center animate-fade-in-up">
                            <input
                                type="password"
                                value={devCode}
                                onChange={(e) => setDevCode(e.target.value)}
                                placeholder="Enter Code"
                                className="px-2 py-1 text-xs bg-white/70 border-2 border-gold-light rounded-md text-deep-green placeholder-deep-green/60 focus:ring-1 focus:ring-gold focus:outline-none"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-3 py-1 text-xs font-semibold bg-gold text-white rounded-md hover:bg-deep-green transition-colors disabled:bg-gold/50"
                            >
                                Enter
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};