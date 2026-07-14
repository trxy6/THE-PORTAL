import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { MessageIcon, CutleryIcon } from '../components/Icons';

interface OnboardingPageProps {
    user: User;
    onComplete: (user: User) => void;
}

const months = [
    { value: '01', name: 'Jan' }, { value: '02', name: 'Feb' },
    { value: '03', name: 'Mar' }, { value: '04', name: 'Apr' },
    { value: '05', name: 'May' }, { value: '06', name: 'Jun' },
    { value: '07', name: 'Jul' }, { value: '08', name: 'Aug' },
    { value: '09', name: 'Sep' }, { value: '10', name: 'Oct' },
    { value: '11', name: 'Nov' }, { value: '12', name: 'Dec' }
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

const validateBirthday = (year: string, month: string, day: string) => {
    if (!year || !month || !day) return false;
    const dateStr = `${year}-${month}-${day.padStart(2, '0')}`;
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d.getTime()) && d < new Date() && d.toISOString().slice(0, 10) === dateStr;
};


export const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onComplete }) => {
    const [step, setStep] = useState(1);
    const [userData, setUserData] = useState<Partial<User>>({});

    // Step 2 state
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [year, setYear] = useState('');
    const [includeAlcohol, setIncludeAlcohol] = useState(false);
    const [isOfAge, setIsOfAge] = useState(false);

    // Step 4 state
    const [name, setName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [allergies, setAllergies] = useState('');
    const [dislikes, setDislikes] = useState('');
    const [otherPrefs, setOtherPrefs] = useState('');


    useEffect(() => {
        if (year && month && day) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const twentyOneYearsAgo = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate());
            const userBirthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

            if (userBirthDate instanceof Date && !isNaN(userBirthDate.getTime()) && userBirthDate <= twentyOneYearsAgo) {
                setIsOfAge(true);
                setIncludeAlcohol(true); // Default to on for users of age
            } else {
                setIsOfAge(false);
                setIncludeAlcohol(false); // Force toggle off if underage
            }
        } else {
            setIsOfAge(false);
            setIncludeAlcohol(false);
        }
    }, [year, month, day]);

    const handleNext = (data?: Partial<User>) => {
        setUserData(prev => ({ ...prev, ...data }));
        setStep(prev => prev + 1);
    };

    const handleFinish = () => {
        const finalUserData = { ...user, ...userData };
        onComplete(finalUserData);
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Introduction
                return (
                    <div className="text-center">
                        <div className="inline-block p-4 bg-gold/20 rounded-full mb-6">
                            <MessageIcon />
                        </div>
                        <p className="text-lg text-deep-green/90 mb-8 max-w-md mx-auto">
                            Hi there, I’m Mila — your Craive Assistant 🍴✨ I’m not just here to show you restaurants or recipes. I’m here to learn how you eat — the cravings, the habits, the moods behind every bite. If you want, I’ll help you discover new flavors, understand your food personality, and find meals that feel like you.
                        </p>
                        <p className="font-bold text-xl text-deep-green mb-6">Ready to get started?</p>
                        <button onClick={() => setStep(2)} className="px-10 py-3 bg-gold text-white font-bold rounded-full shadow-lg hover:bg-deep-green transition-all duration-300 transform hover:scale-105">
                            Let’s Go
                        </button>
                    </div>
                );
            
            case 2: // Birthday
                const isBirthdayValid = validateBirthday(year, month, day);
                return (
                    <div className="w-full max-w-md mx-auto">
                         <h2 className="text-2xl font-bold text-center mb-2 text-deep-green">Before we dig in, what’s your birthday?</h2>
                         <p className="text-center text-deep-green/80 mb-6">I’ll use this to personalize your daily CraiveScope and show age-appropriate options.</p>
                         <div className="grid grid-cols-3 gap-3 mb-4">
                            <select value={month} onChange={e => setMonth(e.target.value)} className="w-full px-2 py-3 bg-white/70 border-2 border-gold-light rounded-xl text-center text-deep-green focus:ring-2 focus:ring-gold focus:outline-none">
                                <option value="" disabled>Month</option>
                                {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                            </select>
                            <select value={day} onChange={e => setDay(e.target.value)} className="w-full px-2 py-3 bg-white/70 border-2 border-gold-light rounded-xl text-center text-deep-green focus:ring-2 focus:ring-gold focus:outline-none">
                                <option value="" disabled>Day</option>
                                {days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(e.target.value)} className="w-full px-2 py-3 bg-white/70 border-2 border-gold-light rounded-xl text-center text-deep-green focus:ring-2 focus:ring-gold focus:outline-none">
                                <option value="" disabled>Year</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className={`flex items-center justify-center bg-white/50 p-3 rounded-xl transition-opacity ${!isBirthdayValid ? 'opacity-50' : ''}`}>
                            <label htmlFor="alcoholToggle" className={`mr-4 font-semibold text-deep-green transition-colors ${!isOfAge ? 'text-deep-green/50' : ''}`}>Include alcohol options?</label>
                            <label htmlFor="alcoholToggle" className={`flex items-center ${isOfAge ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                <div className="relative">
                                <input type="checkbox" id="alcoholToggle" className="sr-only" checked={includeAlcohol} onChange={() => setIncludeAlcohol(!includeAlcohol)} disabled={!isOfAge} />
                                <div className={`block w-12 h-7 rounded-full transition-colors ${includeAlcohol && isOfAge ? 'bg-gold' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full shadow transition-transform ${includeAlcohol && isOfAge ? 'transform translate-x-full' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                        <button onClick={() => handleNext({ birthday: `${year}-${month}-${day.padStart(2, '0')}`, includeAlcohol })} disabled={!isBirthdayValid} className="w-full mt-6 px-10 py-3 bg-gold text-white font-bold rounded-full shadow-lg hover:bg-deep-green transition-all duration-300 disabled:bg-gold/50 disabled:cursor-not-allowed">
                            Next
                        </button>
                    </div>
                );

            case 3: // Location
                 const handleLocation = () => {
                    navigator.geolocation.getCurrentPosition(
                        () => { 
                            console.log("Location access granted.");
                            handleNext();
                         },
                        () => { 
                            console.log("Location access denied.");
                            handleNext(); // Still proceed even if denied
                        }
                    );
                };
                return (
                    <div className="text-center max-w-md mx-auto">
                        <h2 className="text-2xl font-bold mb-2 text-deep-green">Find the best local meals.</h2>
                        <p className="text-deep-green/80 mb-6">To help you find nearby restaurants, grocery stores, and hidden food gems, I’ll need access to your location.</p>
                        <p className="text-sm italic text-deep-green/70 mb-6">I’ll never track you — just find the flavor closest to you. 💫</p>
                        <button onClick={handleLocation} className="w-full px-10 py-3 bg-gold text-white font-bold rounded-full shadow-lg hover:bg-deep-green transition-all mb-3">
                            Allow Location Access
                        </button>
                         <button onClick={() => handleNext()} className="w-full px-10 py-2 text-deep-green/70 font-semibold hover:bg-gold-light/30 rounded-full transition-all">
                            Skip for now
                        </button>
                    </div>
                );
            case 4: // Preferences
                return (
                    <div className="w-full max-w-md mx-auto">
                        <div className="text-center mb-6">
                            <div className="inline-block p-4 bg-gold/20 rounded-full mb-4">
                                <CutleryIcon className="w-8 h-8 text-gold" />
                            </div>
                            <h2 className="text-2xl font-bold text-deep-green">Perfect. Now, tell me a little more.</h2>
                            <p className="text-deep-green/80 mt-2">I’ll use this to make sure my recommendations are always just right for you.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-deep-green/80 mb-1">What's your name?</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="So I know what to call you"
                                    className="w-full px-4 py-3 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-deep-green/80 mb-1">What are your pronouns?</label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {['She/Her', 'He/Him', 'They/Them'].map(p => (
                                        <button 
                                            key={p} 
                                            onClick={() => setPronouns(p)}
                                            className={`px-2 py-2 text-sm font-semibold rounded-lg border-2 transition-colors ${pronouns === p ? 'bg-gold text-white border-gold' : 'bg-white/70 text-deep-green border-gold-light hover:border-gold'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                 <button onClick={() => setPronouns('')} className={`text-xs text-center w-full mt-2 transition-colors ${pronouns === '' ? 'text-deep-green font-bold' : 'text-deep-green/60 hover:text-gold'}`}>
                                    Prefer not to say
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-deep-green/80 mb-1">Do you have any allergies or dietary restrictions?</label>
                                <input
                                    type="text"
                                    value={allergies}
                                    onChange={e => setAllergies(e.target.value)}
                                    placeholder="e.g., Peanuts, gluten-free, vegetarian"
                                    className="w-full px-4 py-3 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-deep-green/80 mb-1">Any foods you really dislike?</label>
                                <input
                                    type="text"
                                    value={dislikes}
                                    onChange={e => setDislikes(e.target.value)}
                                    placeholder="e.g., Cilantro, mushrooms, olives"
                                    className="w-full px-4 py-3 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-deep-green/80 mb-1">Anything else I should know?</label>
                                <textarea
                                    value={otherPrefs}
                                    onChange={e => setOtherPrefs(e.target.value)}
                                    placeholder="e.g., I love spicy food, I'm trying to eat healthier..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/70 border-2 border-gold-light rounded-xl text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={() => handleNext({ name, pronouns, allergies, dislikes, otherPrefs })}
                            disabled={!name.trim()}
                            className="w-full mt-6 px-10 py-3 bg-gold text-white font-bold rounded-full shadow-lg hover:bg-deep-green transition-all duration-300 disabled:bg-gold/50 disabled:cursor-not-allowed">
                            Next
                        </button>
                    </div>
                );
            case 5: // AI Memory Consent
                return (
                    <div className="text-center max-w-md mx-auto">
                        <h2 className="text-3xl font-bold mb-4 text-deep-green">One last thing...</h2>
                        <p className="text-deep-green/80 mb-6 leading-relaxed">
                            AI can be scary, I get it. You don’t have to talk to me, but I must ask your permission to be able to have a memory of your preferences.
                        </p>
                        <p className="text-deep-green/80 mb-6 leading-relaxed">
                            If you allow me to learn, I can personalize your experience with things like your daily CraiveScope and tailored suggestions. If you don’t, I’ll be a more basic guide, and you'll miss out on the full Craive experience.
                        </p>
                        <p className="font-bold text-lg text-deep-green mb-6">Can I remember your preferences to make Craive better for you?</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={() => handleNext({ aiMemoryConsent: true })} className="w-full sm:w-auto px-10 py-3 bg-gold text-white font-bold rounded-full shadow-lg hover:bg-deep-green transition-all">
                                Yes, let's do it!
                            </button>
                            <button onClick={() => handleNext({ aiMemoryConsent: false })} className="w-full sm:w-auto px-10 py-3 bg-white border-2 border-gold text-deep-green font-bold rounded-full shadow-lg hover:bg-gold-light/30 transition-all">
                                No, thank you
                            </button>
                        </div>
                    </div>
                );
            case 6: // Finish
                return (
                    <div className="text-center max-w-md mx-auto">
                        <h2 className="text-3xl font-bold mb-4 text-deep-green">All set!</h2>
                        <p className="text-deep-green/80 text-lg mb-8">
                            Thanks for sharing. I'm excited to help you find what you're craving. Let's get started!
                        </p>
                        <button onClick={handleFinish} className="px-10 py-3 bg-gold text-white font-bold rounded-full shadow-lg hover:bg-deep-green transition-all duration-300 transform hover:scale-105">
                            Enter Craive
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
            <div className="w-full animate-fade-in-up">
                {renderStep()}
            </div>
        </div>
    );
};