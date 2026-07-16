import React, { useState, useEffect } from 'react';
// FIX: Corrected typo from CraiveScope to CraveScope to match the type definition.
import type { User, CraveScope } from '../types';
import { getCraiveScope } from '../services/geminiService';
import { AstrologyIcon } from './Icons';

interface CraiveScopeCardProps {
    user: User | null;
    onNavigate: () => void;
}

const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

export const CraiveScopeCard: React.FC<CraiveScopeCardProps> = ({ user, onNavigate }) => {
    // FIX: Corrected typo from CraiveScope to CraveScope to match the type definition.
    const [scope, setScope] = useState<CraveScope | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only fetch if user has a birthday and has consented to AI memory features.
        // `aiMemoryConsent` being undefined is treated as consent for existing users.
        if (user?.birthday && user.aiMemoryConsent !== false) {
            setIsLoading(true);
            setError(null);
            const isUnder21 = getAge(user.birthday) < 21;

            getCraiveScope(user.birthday, isUnder21)
                .then(setScope)
                .catch(err => setError(err.message || 'Could not fetch scope.'))
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [user?.birthday, user?.aiMemoryConsent]);
    
    if (!user?.birthday) {
        return (
            <div className="bg-white/60 p-4 rounded-2xl shadow-md border border-gold-light/30 text-center mb-8 animate-fade-in-up">
                <p className="text-deep-green/90 font-medium">Want your daily food horoscope?</p>
                <button onClick={onNavigate} className="mt-2 text-gold font-bold hover:underline">
                    Set your birthday in your profile!
                </button>
            </div>
        );
    }

    if (user.aiMemoryConsent === false) {
        return (
           <div className="bg-white/60 p-4 rounded-2xl shadow-md border border-gold-light/30 text-center mb-8 animate-fade-in-up">
               <p className="text-deep-green/90 font-medium">Your Daily CraiveScope is unavailable.</p>
               <p className="text-sm text-deep-green/70 mt-1">To get personalized features, please enable AI memory in your settings.</p>
               <button onClick={onNavigate} className="mt-2 text-gold font-bold hover:underline">
                   Go to CraiveMe
               </button>
           </div>
       );
   }
    
    if (isLoading) {
        return (
            <div className="bg-deep-green p-6 rounded-2xl shadow-lg mb-8 text-cream animate-fade-in-up text-center">
                 <p className="animate-pulse">Consulting the cosmos for your flavor forecast...</p>
            </div>
        )
    }

    if (error || !scope) {
        return (
             <div className="bg-red-100 p-6 rounded-2xl shadow-lg mb-8 text-red-800 animate-fade-in-up text-center">
                 <p>{error || "The stars aren't aligned right now. Please try again later."}</p>
            </div>
        )
    }

    return (
        <div className="bg-deep-green p-6 rounded-2xl shadow-lg mb-8 text-cream animate-fade-in-up">
            <div className="flex items-center gap-4 border-b border-gold-light/30 pb-3 mb-3">
                <AstrologyIcon />
                <h2 className="text-xl font-bold text-gold-light">Your Daily CraiveScope</h2>
            </div>
            <p className="font-semibold text-lg"><span className="text-gold">{scope.sign} 🔥:</span> {scope.forecast}</p>
            <p className="mt-2 text-cream/80">{scope.advice}</p>
            <p className="mt-3 pt-3 border-t border-gold-light/20 text-sm text-gold-light italic">{scope.bonusTip}</p>
        </div>
    );
};
