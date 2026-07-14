import React, { useState, useCallback } from 'react';
import { getFoodSuggestions } from '../services/geminiService';
import type { Suggestion, User } from '../types';
import { CategoryBubble } from '../components/CategoryBubble';
import { SuggestionCard } from '../components/SuggestionCard';
import { CraiveScopeCard } from '../components/CraiveScopeCard';
import { SearchIcon, SushiIcon, TacosIcon, DessertIcon, SurpriseIcon } from '../components/Icons';

const categories = [
    { name: 'Sushi', icon: <SushiIcon />, prompt: 'Creative sushi roll ideas' },
    { name: 'Tacos', icon: <TacosIcon />, prompt: 'Unique taco fillings' },
    { name: 'Dessert', icon: <DessertIcon />, prompt: 'Decadent dessert recipes' },
    { name: 'Surprise Me', icon: <SurpriseIcon />, prompt: 'A surprising and delicious meal' },
];

interface CravePageProps {
    setActiveTab: (tab: string) => void;
    user: User | null;
}

export const CravePage: React.FC<CravePageProps> = ({ setActiveTab, user }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [greeting, setGreeting] = useState("Hi there! I'm Mila. What are you hungry for?");
    const [lastQuery, setLastQuery] = useState('');

    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query || query === lastQuery) return;

        setIsLoading(true);
        setSuggestions([]);
        setError(null);
        setLastQuery(query);

        try {
            const results = await getFoodSuggestions(query);
            setSuggestions(results);
            setGreeting(`Here are some crave-worthy ideas for "${query}"!`);
        } catch (err) {
            setError('Oh no! Something went wrong. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [lastQuery]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        fetchSuggestions(searchTerm);
    };
    
    const handleCategoryClick = (prompt: string) => {
        setSearchTerm(prompt);
        fetchSuggestions(prompt);
    }

    return (
        <>
            <CraiveScopeCard user={user} onNavigate={() => setActiveTab('CraiveMe')} />

            <header className="text-center mb-8 animate-fade-in-up">
                <h1 className="text-2xl font-bold text-deep-green">{greeting}</h1>
            </header>

            <form onSubmit={handleSearch} className="relative mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Craving something like 'avocado' or 'something comforting'?"
                    className="w-full pl-12 pr-4 py-3 bg-white/70 border-2 border-gold-light rounded-full text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none transition-shadow duration-300 shadow-sm"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <SearchIcon />
                </div>
            </form>
            
            <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {categories.map((category, index) => (
                       <CategoryBubble
                          key={category.name}
                          label={category.name}
                          icon={category.icon}
                          onClick={() => handleCategoryClick(category.prompt)}
                          style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                       />
                    ))}
                </div>
            </section>

            <section>
                {isLoading && (
                    <div className="text-center py-10">
                        <p className="text-lg font-semibold text-gold animate-pulse">Mila is thinking...</p>
                    </div>
                )}
                {error && <p className="text-center text-red-500">{error}</p>}
                {!isLoading && suggestions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {suggestions.map((suggestion, index) => (
                            <SuggestionCard 
                                key={index} 
                                title={suggestion.title} 
                                description={suggestion.description} 
                                style={{ animationDelay: `${index * 0.1}s` }}
                            />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};
