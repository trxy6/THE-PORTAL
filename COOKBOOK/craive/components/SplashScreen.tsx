
import React, { useState, useEffect } from 'react';

export const SplashScreen: React.FC = () => {
    const [exit, setExit] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setExit(true), 2500); // Start exit animation before component unmounts
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 bg-cream flex items-center justify-center z-50 overflow-hidden">
            <div className={`transition-all duration-700 ease-in-out ${exit ? 'animate-slide-out-up' : ''}`}>
                <h1 
                    className="text-7xl font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-gold via-gold-light to-gold bg-[length:400%_100%] animate-shimmer"
                >
                    CRAIVE
                </h1>
            </div>
        </div>
    );
};
