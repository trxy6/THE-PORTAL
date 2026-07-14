import { CraveIcon } from "./components/Icons";


export interface Suggestion {
  title: string;
  description: string;
}

export interface FoodMixResult {
  craiveName: string;
  craiveStory: string;
  instructions: string;
  personalityTag: string; // e.g., "🔥 The Midnight Volcano"
}

export interface User {
  name?: string;
  email: string;
  password?: string; // Used for auth flow ONLY, not persisted in localStorage.
  birthday?: string; // YYYY-MM-DD
  pronouns?: string;
  craiveType?: string; // e.g., "The Sweet Seeker"
  craiveTypeProfile?: CraiveTypeProfile;
  onboardingComplete?: boolean;
  includeAlcohol?: boolean;
  allergies?: string;
  dislikes?: string;
  otherPrefs?: string;
  
  // New "Teach Mila" fields
  aiMemoryConsent?: boolean; // Kept for compatibility, new logic uses memoryMode.
  memoryMode?: 'surface' | 'deep';
  favoriteCuisines?: string;
  spiceTolerance?: 'Mild' | 'Medium' | 'Spicy' | '';
  dietGoals?: string;
  foodHabits?: string;
  
  // New "My Craives" field
  myCraives?: FoodMixResult[];

  // New social fields
  followers?: number;
  following?: number;
  hasUnreadNotifications?: boolean;
}

export interface CraveScope {
  sign: string;
  forecast: string;
  advice: string;
  bonusTip: string;
}

export interface CraiveTypeProfile {
  name: string;
  title: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  comfortFoods: string[];
  riskyFlavors: string[];
}

export interface QuizQuestion {
  id: number;
  text: string;
}

export interface QuizAnswer {
  questionId: number;
  question: string;
  answer: number; // 1-10
}

// --- CraveSync Types ---

export interface CraveSyncUserInput {
  loves: string[];
  hates: string[];
  vibe: string;
}

export interface CraveSyncOption {
  name: string;
  cuisine: string;
  price: string; // e.g., "$", "$$", "$$$"
  distance: string; // e.g., "0.5 miles"
}

export interface CraveSyncResult extends CraveSyncOption {
  consensusScore: number; // e.g., 95
}

// FIX: Centralized global window.aistudio type declaration to prevent redeclaration errors across files.
declare global {
    interface Window {
        aistudio?: {
            openSelectKey: () => Promise<void>;
            hasSelectedApiKey: () => Promise<boolean>;
        };
    }
}
