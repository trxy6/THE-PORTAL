import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '../types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface RecipeIngredient {
    name: string;
    amount: number;
    unit: string;
}

export interface RecipeNutrition {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
}

export interface Recipe {
    id: string;
    title: string;
    emoji: string;
    category: string;
    time: number; // minutes
    servings: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    ingredients: RecipeIngredient[];
    steps: string[];
    nutrition?: RecipeNutrition;
    rating: number; // 0–5
    isFavorite: boolean;
    tags: string[];
    createdAt: string;
}

const LS_KEY = 'portal_recipes_v2';

// ─────────────────────────────────────────────
// Default Recipes
// ─────────────────────────────────────────────
const DEFAULT_RECIPES: Recipe[] = [
    {
        id: '1', title: 'Campfire Elixir Chai', emoji: '☕', category: 'Drinks',
        time: 10, servings: 2, difficulty: 'Easy',
        description: 'Warm Chai brewed with star anise, cardamom, and clove — ideal for cozy nights.',
        ingredients: [
            { name: 'Black Tea', amount: 2, unit: 'bags' },
            { name: 'Star Anise', amount: 2, unit: 'pods' },
            { name: 'Cardamom', amount: 4, unit: 'pods' },
            { name: 'Milk', amount: 1, unit: 'cup' },
            { name: 'Honey', amount: 2, unit: 'tbsp' },
        ],
        steps: [
            'Crush cardamom pods and star anise lightly using the back of a spoon.',
            'Bring 1.5 cups of water to a boil with all the spices.',
            'Add tea bags and let steep for 3 minutes.',
            'Pour in milk and bring back to a simmer for 2 more minutes.',
            'Strain into mugs and stir in honey. Serve hot.',
        ],
        nutrition: { calories: 120, protein: '3g', carbs: '18g', fat: '3g', fiber: '0g' },
        rating: 4, isFavorite: true, tags: ['cozy', 'warm', 'spiced'],
        createdAt: new Date().toISOString(),
    },
    {
        id: '2', title: 'Dwarven Trail Bread', emoji: '🍞', category: 'Baking',
        time: 45, servings: 8, difficulty: 'Medium',
        description: 'Dense, nut-packed bread baked with honey and dried berries.',
        ingredients: [
            { name: 'Almond Flour', amount: 2, unit: 'cups' },
            { name: 'Dried Cranberries', amount: 0.5, unit: 'cup' },
            { name: 'Honey', amount: 3, unit: 'tbsp' },
            { name: 'Eggs', amount: 3, unit: 'whole' },
            { name: 'Walnuts', amount: 0.75, unit: 'cup' },
        ],
        steps: [
            'Preheat oven to 350°F (175°C). Grease a loaf pan.',
            'Whisk eggs and honey together until combined.',
            'Fold in almond flour until a thick batter forms.',
            'Mix in cranberries and walnuts.',
            'Pour into pan and bake for 35 minutes until golden. Cool before slicing.',
        ],
        nutrition: { calories: 220, protein: '8g', carbs: '14g', fat: '16g', fiber: '3g' },
        rating: 5, isFavorite: false, tags: ['high-protein', 'gluten-free', 'snack'],
        createdAt: new Date().toISOString(),
    },
    {
        id: '3', title: 'Mana Draught Tonic', emoji: '✨', category: 'Drinks',
        time: 5, servings: 1, difficulty: 'Easy',
        description: 'Sparkling blue elixir brewed from star fruit and fresh mint.',
        ingredients: [
            { name: 'Star Fruit Syrup', amount: 2, unit: 'tbsp' },
            { name: 'Fresh Mint', amount: 5, unit: 'leaves' },
            { name: 'Sparkling Water', amount: 1, unit: 'cup' },
            { name: 'Blue Spirulina', amount: 0.5, unit: 'tsp' },
            { name: 'Ice', amount: 1, unit: 'cup' },
        ],
        steps: [
            'Muddle mint leaves with star fruit syrup at the bottom of a glass.',
            'Add spirulina powder and stir into the syrup.',
            'Fill glass with ice.',
            'Top with sparkling water and stir gently. Serve immediately.',
        ],
        nutrition: { calories: 45, protein: '1g', carbs: '10g', fat: '0g', fiber: '0g' },
        rating: 3, isFavorite: true, tags: ['refreshing', 'vegan', 'no-cook'],
        createdAt: new Date().toISOString(),
    },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void }> = ({ value, onChange }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
            <button
                key={star}
                onClick={() => onChange?.(star)}
                className={`text-lg transition-transform hover:scale-125 ${star <= value ? 'text-amber-400' : 'text-slate-600'} ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
            >★</button>
        ))}
    </div>
);

// ─────────────────────────────────────────────
// MEAL PLANNER
// ─────────────────────────────────────────────
type MealSlot = 'breakfast' | 'lunch' | 'dinner';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];
const MEAL_LABELS: Record<MealSlot, string> = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner' };

type MealPlan = Record<string, Record<MealSlot, string>>;

const MealPlannerView: React.FC<{ recipes: Recipe[] }> = ({ recipes }) => {
    const [plan, setPlan] = useState<MealPlan>(() => {
        try { return JSON.parse(localStorage.getItem('portal_mealplan') || '{}'); } catch { return {}; }
    });
    const [dragging, setDragging] = useState<string | null>(null);

    const setSlot = (day: string, meal: MealSlot, val: string) => {
        const next = { ...plan, [day]: { ...(plan[day] || {}), [meal]: val } };
        setPlan(next);
        localStorage.setItem('portal_mealplan', JSON.stringify(next));
    };

    const buildShoppingList = () => {
        const needed: Record<string, { amount: number; unit: string }> = {};
        DAYS.forEach(day => {
            MEALS.forEach(meal => {
                const title = plan[day]?.[meal];
                if (!title) return;
                const recipe = recipes.find(r => r.title === title);
                if (!recipe) return;
                recipe.ingredients.forEach(ing => {
                    const key = `${ing.name}|${ing.unit}`;
                    if (needed[key]) needed[key].amount += ing.amount;
                    else needed[key] = { amount: ing.amount, unit: ing.unit };
                });
            });
        });
        return Object.entries(needed).map(([key, val]) => ({
            name: key.split('|')[0], amount: val.amount, unit: val.unit
        }));
    };

    const [showShoppingList, setShowShoppingList] = useState(false);
    const shoppingList = buildShoppingList();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">📅 Weekly Meal Planner</h3>
                <button
                    onClick={() => setShowShoppingList(s => !s)}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all"
                >
                    {showShoppingList ? 'Hide Shopping List' : '🛒 Generate Shopping List'}
                </button>
            </div>

            {showShoppingList && (
                <div className="p-4 bg-slate-900 border border-emerald-500/20 rounded-xl space-y-2 animate-[fadeIn_0.3s_ease]">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Weekly Shopping List</span>
                        <button
                            onClick={() => {
                                const text = shoppingList.map(i => `• ${i.amount} ${i.unit} ${i.name}`).join('\n');
                                navigator.clipboard.writeText(text);
                            }}
                            className="text-[9px] text-slate-400 hover:text-white transition"
                        >📋 Copy</button>
                    </div>
                    {shoppingList.length === 0
                        ? <p className="text-[10px] text-slate-500 italic">Plan some meals above to generate your list.</p>
                        : <div className="grid grid-cols-2 gap-1.5">
                            {shoppingList.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] text-slate-300 bg-slate-800/50 rounded-lg px-2.5 py-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    <span className="font-semibold">{item.amount} {item.unit}</span>
                                    <span className="text-slate-400">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr>
                            <th className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pb-2 pr-2 w-24">Meal</th>
                            {DAYS.map(d => (
                                <th key={d} className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-2 text-center">{d}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="space-y-1">
                        {MEALS.map(meal => (
                            <tr key={meal}>
                                <td className="py-1.5 pr-2 text-[9px] text-slate-500 font-bold uppercase align-top">{MEAL_LABELS[meal]}</td>
                                {DAYS.map(day => {
                                    const val = plan[day]?.[meal] || '';
                                    return (
                                        <td key={day} className="py-1 px-1 align-top">
                                            <select
                                                value={val}
                                                onChange={e => setSlot(day, meal, e.target.value)}
                                                className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-amber-500/40 text-[9px] text-slate-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer transition"
                                            >
                                                <option value="">— none —</option>
                                                {recipes.map(r => <option key={r.id} value={r.title}>{r.emoji} {r.title}</option>)}
                                            </select>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// COOK MODE
// ─────────────────────────────────────────────
const CookModeView: React.FC<{ recipe: Recipe; scaleFactor: number; onClose: () => void }> = ({ recipe, scaleFactor, onClose }) => {
    const [stepIdx, setStepIdx] = useState(0);
    const [timerSecs, setTimerSecs] = useState(recipe.time * 60);
    const [timerRunning, setTimerRunning] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const totalSteps = recipe.steps.length;

    useEffect(() => {
        if (timerRunning) {
            intervalRef.current = setInterval(() => {
                setTimerSecs(s => {
                    if (s <= 1) { clearInterval(intervalRef.current!); setTimerRunning(false); return 0; }
                    return s - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [timerRunning]);

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.onstart = () => setSpeaking(true);
        utter.onend = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
    };

    const stopSpeaking = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

    const progress = ((stepIdx + 1) / totalSteps) * 100;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-[fadeIn_0.3s_ease]">
            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between mb-6">
                <div>
                    <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">Cook Mode</p>
                    <h2 className="text-lg font-bold text-white">{recipe.emoji} {recipe.title}</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold">✕ Exit</button>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-lg mb-6">
                <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                    <span>Step {stepIdx + 1} of {totalSteps}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Step card */}
            <div className="w-full max-w-lg bg-slate-900 border border-white/5 rounded-2xl p-6 mb-6 shadow-2xl">
                <span className="text-[9px] text-slate-500 font-mono">STEP {stepIdx + 1}</span>
                <p className="text-xl text-white font-semibold leading-relaxed mt-2">{recipe.steps[stepIdx]}</p>
            </div>

            {/* Timer */}
            <div className="w-full max-w-lg flex items-center justify-between mb-6 bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
                <div>
                    <p className="text-[9px] text-pink-400 font-bold uppercase tracking-widest">Recipe Timer</p>
                    <p className={`text-3xl font-black font-mono ${timerSecs === 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{formatTime(timerSecs)}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setTimerRunning(r => !r)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timerRunning ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'}`}>
                        {timerRunning ? '⏸ Pause' : '▶ Start'}
                    </button>
                    <button onClick={() => { setTimerSecs(recipe.time * 60); setTimerRunning(false); }}
                        className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition">↺</button>
                </div>
            </div>

            {/* Voice + Nav */}
            <div className="w-full max-w-lg flex gap-3">
                <button
                    onClick={() => speaking ? stopSpeaking() : speak(recipe.steps[stepIdx])}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${speaking ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 animate-pulse' : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'}`}
                >
                    {speaking ? '🔊 Stop' : '🔊 Read Aloud'}
                </button>
                <button
                    onClick={() => setStepIdx(i => Math.max(0, i - 1))}
                    disabled={stepIdx === 0}
                    className="flex-1 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-white/5 disabled:opacity-30 hover:bg-slate-700 transition"
                >← Back</button>
                {stepIdx < totalSteps - 1
                    ? <button onClick={() => setStepIdx(i => i + 1)}
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-400 transition">Next →</button>
                    : <button onClick={onClose}
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition">✓ Done!</button>
                }
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// AI PANTRY SUGGESTIONS (simulated)
// ─────────────────────────────────────────────
const AIPantryView: React.FC<{ recipes: Recipe[]; onAdd: (r: Recipe) => void }> = ({ recipes, onAdd }) => {
    const [pantryInput, setPantryInput] = useState('');
    const [suggestions, setSuggestions] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);

    const scanPantry = () => {
        if (!pantryInput.trim()) return;
        setLoading(true);
        setTimeout(() => {
            const keywords = pantryInput.toLowerCase().split(/[,\s]+/).filter(Boolean);
            const scored = recipes.map(r => {
                const allText = [...r.ingredients.map(i => i.name.toLowerCase()), ...r.tags].join(' ');
                const hits = keywords.filter(kw => allText.includes(kw)).length;
                return { recipe: r, hits };
            }).filter(x => x.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 3);
            setSuggestions(scored.map(x => x.recipe));
            setLoading(false);
        }, 1200);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">🤖 AI Pantry Suggestions</h3>
            <p className="text-[10px] text-slate-400">Enter what you have in your pantry and we'll find the best matching recipes.</p>
            <div className="flex gap-2">
                <input
                    value={pantryInput}
                    onChange={e => setPantryInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && scanPantry()}
                    placeholder="eggs, milk, honey, almond flour..."
                    className="flex-1 bg-slate-900 border border-white/10 focus:border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
                <button onClick={scanPantry} disabled={loading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition disabled:opacity-50">
                    {loading ? '...' : 'Scan'}
                </button>
            </div>
            {suggestions.length > 0 && (
                <div className="space-y-2 animate-[fadeIn_0.3s_ease]">
                    <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Best Matches for Your Pantry</p>
                    {suggestions.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-slate-900 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{r.emoji}</span>
                                <div>
                                    <p className="text-xs font-bold text-white">{r.title}</p>
                                    <p className="text-[9px] text-slate-400">{r.time} min • {r.difficulty}</p>
                                </div>
                            </div>
                            <StarRating value={r.rating} />
                        </div>
                    ))}
                </div>
            )}
            {suggestions.length === 0 && !loading && pantryInput && (
                <p className="text-[10px] text-slate-500 italic text-center py-4">No matches found. Try different ingredients or add more recipes!</p>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
// RECIPE DETAIL PANEL
// ─────────────────────────────────────────────
const RecipeDetail: React.FC<{
    recipe: Recipe;
    onUpdate: (r: Recipe) => void;
    onDelete: () => void;
    onStartCook: () => void;
}> = ({ recipe, onUpdate, onDelete, onStartCook }) => {
    const [scale, setScale] = useState(1);
    const [showNutrition, setShowNutrition] = useState(false);
    const [copied, setCopied] = useState(false);

    const scaled = (amount: number) => {
        const val = amount * scale * recipe.servings;
        return Number.isInteger(val) ? val : val.toFixed(1);
    };

    const handleShare = () => {
        const text = `🍽 ${recipe.title}\n\nIngredients:\n${recipe.ingredients.map(i => `• ${i.amount} ${i.unit} ${i.name}`).join('\n')}\n\nSteps:\n${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => window.print();

    const handleSpeak = () => {
        const text = `${recipe.title}. Ingredients: ${recipe.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`).join(', ')}. Instructions: ${recipe.steps.join('. ')}`;
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis?.speak(utter);
    };

    return (
        <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">{recipe.emoji}</span>
                    <div>
                        <h2 className="text-base font-bold text-white">{recipe.title}</h2>
                        <p className="text-[10px] text-slate-400">{recipe.category} • {recipe.time} min • {recipe.difficulty}</p>
                    </div>
                </div>
                <button
                    onClick={() => onUpdate({ ...recipe, isFavorite: !recipe.isFavorite })}
                    className={`text-2xl transition-transform hover:scale-125 ${recipe.isFavorite ? 'text-rose-400' : 'text-slate-600'}`}
                >♥</button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Your Rating</span>
                <StarRating value={recipe.rating} onChange={v => onUpdate({ ...recipe, rating: v })} />
            </div>

            {/* Description */}
            <p className="text-xs text-slate-400 leading-relaxed italic">{recipe.description}</p>

            {/* Servings Scaler */}
            <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">⚖️ Servings Scaler</span>
                    <span className="text-[9px] font-mono text-amber-400">{recipe.servings * scale} servings</span>
                </div>
                <input type="range" min={0.5} max={4} step={0.5} value={scale}
                    onChange={e => setScale(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer" />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>½x</span><span>1x</span><span>1.5x</span><span>2x</span><span>2.5x</span><span>3x</span><span>3.5x</span><span>4x</span>
                </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ingredients</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {recipe.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] bg-slate-900/60 border border-white/5 rounded-lg px-3 py-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span className="font-bold text-white">{scaled(ing.amount)} {ing.unit}</span>
                            <span className="text-slate-400">{ing.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Instructions</span>
                <div className="space-y-2">
                    {recipe.steps.map((step, i) => (
                        <div key={i} className="flex gap-3 text-xs text-slate-300 leading-relaxed">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-[9px] flex items-center justify-center">{i + 1}</span>
                            <span>{step}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Nutrition */}
            {recipe.nutrition && (
                <div>
                    <button onClick={() => setShowNutrition(s => !s)}
                        className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hover:text-white transition flex items-center gap-1">
                        🥗 Nutrition Info {showNutrition ? '▲' : '▼'}
                    </button>
                    {showNutrition && (
                        <div className="mt-2 grid grid-cols-5 gap-1.5 animate-[fadeIn_0.2s_ease]">
                            {[
                                { label: 'Calories', val: `${recipe.nutrition.calories}` },
                                { label: 'Protein', val: recipe.nutrition.protein },
                                { label: 'Carbs', val: recipe.nutrition.carbs },
                                { label: 'Fat', val: recipe.nutrition.fat },
                                { label: 'Fiber', val: recipe.nutrition.fiber },
                            ].map(n => (
                                <div key={n.label} className="bg-slate-900 border border-white/5 rounded-xl p-2 text-center">
                                    <p className="text-xs font-black text-amber-400">{n.val}</p>
                                    <p className="text-[8px] text-slate-500 mt-0.5">{n.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tags */}
            {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {recipe.tags.map(tag => (
                        <span key={tag} className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">#{tag}</span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <button onClick={onStartCook}
                    className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition col-span-2">
                    👨‍🍳 Start Cook Mode
                </button>
                <button onClick={handleShare}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition">
                    {copied ? '✓ Copied!' : '📋 Share Recipe'}
                </button>
                <button onClick={handleSpeak}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition">
                    🔊 Read Aloud
                </button>
                <button onClick={handlePrint}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition">
                    🖨️ Print
                </button>
                <button onClick={onDelete}
                    className="py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 transition">
                    🗑️ Delete
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// ADD RECIPE FORM
// ─────────────────────────────────────────────
const AddRecipeForm: React.FC<{ onSave: (r: Recipe) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [emoji, setEmoji] = useState('🍽️');
    const [category, setCategory] = useState('Dinner');
    const [time, setTime] = useState(30);
    const [servings, setServings] = useState(4);
    const [difficulty, setDifficulty] = useState<Recipe['difficulty']>('Medium');
    const [description, setDescription] = useState('');
    const [ingredientText, setIngredientText] = useState('');
    const [stepsText, setStepsText] = useState('');
    const [tags, setTags] = useState('');

    const parseIngredients = (): RecipeIngredient[] => {
        return ingredientText.split('\n').filter(Boolean).map(line => {
            const parts = line.trim().split(' ');
            const amount = parseFloat(parts[0]) || 1;
            const unit = parts.length > 2 ? parts[1] : 'piece';
            const name = parts.slice(parts.length > 2 ? 2 : 1).join(' ');
            return { amount, unit, name };
        });
    };

    const handleSave = () => {
        if (!title.trim()) return;
        const newRecipe: Recipe = {
            id: String(Date.now()),
            title: title.trim(),
            emoji,
            category,
            time,
            servings,
            difficulty,
            description: description.trim() || 'A delicious custom recipe.',
            ingredients: parseIngredients(),
            steps: stepsText.split('\n').filter(Boolean),
            isFavorite: false,
            rating: 0,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            createdAt: new Date().toISOString(),
        };
        onSave(newRecipe);
    };

    const inputCls = "w-full bg-slate-900 border border-white/10 focus:border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition";
    const labelCls = "text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block";

    return (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">➕ Add New Recipe</h3>
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <label className={labelCls}>Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Recipe name..." className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Emoji</label>
                    <input value={emoji} onChange={e => setEmoji(e.target.value)} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                        {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks', 'Baking', 'Dessert'].map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Time (mins)</label>
                    <input type="number" value={time} onChange={e => setTime(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Servings</label>
                    <input type="number" value={servings} onChange={e => setServings(Number(e.target.value))} className={inputCls} />
                </div>
                <div className="col-span-2">
                    <label className={labelCls}>Difficulty</label>
                    <div className="flex gap-2">
                        {(['Easy', 'Medium', 'Hard'] as Recipe['difficulty'][]).map(d => (
                            <button key={d} onClick={() => setDifficulty(d)}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition ${difficulty === d ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'}`}>
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="col-span-2">
                    <label className={labelCls}>Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                        placeholder="Brief description of this recipe..." className={inputCls} />
                </div>
                <div className="col-span-2">
                    <label className={labelCls}>Ingredients (one per line: amount unit name)</label>
                    <textarea value={ingredientText} onChange={e => setIngredientText(e.target.value)} rows={4}
                        placeholder={"2 cups almond flour\n3 whole eggs\n0.5 cup honey"} className={`${inputCls} font-mono`} />
                </div>
                <div className="col-span-2">
                    <label className={labelCls}>Steps (one per line)</label>
                    <textarea value={stepsText} onChange={e => setStepsText(e.target.value)} rows={5}
                        placeholder={"Preheat the oven to 350°F.\nMix all dry ingredients.\nAdd wet ingredients and stir."} className={`${inputCls} font-mono`} />
                </div>
                <div className="col-span-2">
                    <label className={labelCls}>Tags (comma separated)</label>
                    <input value={tags} onChange={e => setTags(e.target.value)} placeholder="vegan, quick, gluten-free" className={inputCls} />
                </div>
            </div>
            <div className="flex gap-3 pt-2">
                <button onClick={onCancel} className="flex-1 py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl border border-white/5 hover:text-white transition">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition">Save Recipe</button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
type SubView = 'list' | 'detail' | 'add' | 'planner' | 'pantry';

export const RecipesPage: React.FC<{ user: User | null }> = ({ user }) => {
    const [recipes, setRecipes] = useState<Recipe[]>(() => {
        try {
            const saved = localStorage.getItem(LS_KEY);
            return saved ? JSON.parse(saved) : DEFAULT_RECIPES;
        } catch { return DEFAULT_RECIPES; }
    });
    const [view, setView] = useState<SubView>('list');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [cookMode, setCookMode] = useState(false);
    const [filterFav, setFilterFav] = useState(false);
    const [filterCat, setFilterCat] = useState('All');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'rating' | 'time' | 'newest'>('newest');

    const saveRecipes = useCallback((updated: Recipe[]) => {
        setRecipes(updated);
        localStorage.setItem(LS_KEY, JSON.stringify(updated));
    }, []);

    const categories = ['All', ...Array.from(new Set(recipes.map(r => r.category)))];
    const selected = recipes.find(r => r.id === selectedId) || null;

    const filtered = recipes
        .filter(r => !filterFav || r.isFavorite)
        .filter(r => filterCat === 'All' || r.category === filterCat)
        .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.tags.some(t => t.includes(search.toLowerCase())))
        .sort((a, b) => {
            if (sortBy === 'rating') return b.rating - a.rating;
            if (sortBy === 'time') return a.time - b.time;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    if (cookMode && selected) {
        return (
            <CookModeView
                recipe={selected}
                scaleFactor={1}
                onClose={() => setCookMode(false)}
            />
        );
    }

    const subNavBtn = (label: string, sv: SubView) => (
        <button
            onClick={() => setView(sv)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap border ${view === sv
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-transparent border-white/5 text-slate-400 hover:text-white'}`}
        >{label}</button>
    );

    return (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/5">
                <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        🍽️ Recipe Codex
                    </h2>
                    <p className="text-[10px] text-slate-500">{recipes.length} recipes · {recipes.filter(r => r.isFavorite).length} favorites</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {subNavBtn('📖 Recipes', 'list')}
                    {subNavBtn('➕ Add', 'add')}
                    {subNavBtn('📅 Planner', 'planner')}
                    {subNavBtn('🤖 Pantry AI', 'pantry')}
                </div>
            </div>

            {/* PLANNER */}
            {view === 'planner' && <MealPlannerView recipes={recipes} />}

            {/* PANTRY AI */}
            {view === 'pantry' && <AIPantryView recipes={recipes} onAdd={r => setRecipes(prev => [...prev, r])} />}

            {/* ADD RECIPE */}
            {view === 'add' && (
                <AddRecipeForm
                    onSave={r => { saveRecipes([r, ...recipes]); setView('list'); }}
                    onCancel={() => setView('list')}
                />
            )}

            {/* RECIPE LIST + DETAIL */}
            {(view === 'list' || view === 'detail') && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* LEFT: Recipe List */}
                    <div className="lg:col-span-2 space-y-3">
                        {/* Filters */}
                        <div className="space-y-2">
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search recipes..."
                                className="w-full bg-slate-900 border border-white/10 focus:border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                            />
                            <div className="flex gap-1.5 flex-wrap">
                                <button
                                    onClick={() => setFilterFav(f => !f)}
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition ${filterFav ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}
                                >♥ Favorites</button>
                                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                                    className="bg-slate-900 border border-white/5 text-slate-400 text-[9px] font-bold rounded-lg px-2 py-1 outline-none">
                                    {categories.map(c => <option key={c}>{c}</option>)}
                                </select>
                                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                                    className="bg-slate-900 border border-white/5 text-slate-400 text-[9px] font-bold rounded-lg px-2 py-1 outline-none">
                                    <option value="newest">Newest</option>
                                    <option value="rating">Top Rated</option>
                                    <option value="time">Quickest</option>
                                </select>
                            </div>
                        </div>

                        {/* Recipe Cards */}
                        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-0.5">
                            {filtered.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-xs italic">No recipes found. Try adjusting filters or add a new recipe!</div>
                            )}
                            {filtered.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => { setSelectedId(r.id); setView('detail'); }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedId === r.id && view === 'detail'
                                        ? 'bg-amber-500/10 border-amber-500/30'
                                        : 'bg-slate-900/60 border-white/5 hover:border-white/10'}`}
                                >
                                    <span className="text-2xl shrink-0">{r.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-white truncate">{r.title}</p>
                                            {r.isFavorite && <span className="text-rose-400 text-xs shrink-0">♥</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <StarRating value={r.rating} />
                                            <span className="text-[8px] text-slate-500 font-mono">{r.time}m · {r.difficulty}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Recipe Detail */}
                    <div className="lg:col-span-3">
                        {selected && view === 'detail' ? (
                            <RecipeDetail
                                recipe={selected}
                                onUpdate={updated => saveRecipes(recipes.map(r => r.id === updated.id ? updated : r))}
                                onDelete={() => { saveRecipes(recipes.filter(r => r.id !== selected.id)); setSelectedId(null); setView('list'); }}
                                onStartCook={() => setCookMode(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 border border-dashed border-white/5 rounded-2xl">
                                <span className="text-4xl mb-3">🍽️</span>
                                <p className="text-xs font-bold text-slate-400">Select a recipe to view details</p>
                                <p className="text-[10px] text-slate-600 mt-1">or click Add to create a new one</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
