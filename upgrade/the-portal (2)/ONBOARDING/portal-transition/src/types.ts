export type PortalState = 'LOBBY' | 'WALKTHROUGH' | 'DESTINATION';

export interface PortalTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowClass: string;
  gradientBackground: string;
  ringColors: string[];
}

export const PORTAL_THEMES: PortalTheme[] = [
  {
    id: 'cosmic',
    name: 'Cosmic Void',
    primaryColor: '#8b5cf6', // Violet
    secondaryColor: '#3b82f6', // Blue
    accentColor: 'text-indigo-400',
    glowClass: 'shadow-[0_0_50px_rgba(139,92,246,0.6)]',
    gradientBackground: 'bg-radial from-slate-950 via-purple-950 to-black',
    ringColors: ['#8b5cf6', '#3b82f6', '#ec4899', '#6366f1'],
  },
  {
    id: 'solar',
    name: 'Solar Flare',
    primaryColor: '#f97316', // Orange
    secondaryColor: '#eab308', // Yellow
    accentColor: 'text-amber-400',
    glowClass: 'shadow-[0_0_50px_rgba(249,115,22,0.6)]',
    gradientBackground: 'bg-radial from-stone-950 via-amber-950 to-black',
    ringColors: ['#f97316', '#eab308', '#ef4444', '#f59e0b'],
  },
  {
    id: 'abyss',
    name: 'Neon Abyss',
    primaryColor: '#06b6d4', // Cyan
    secondaryColor: '#10b981', // Emerald
    accentColor: 'text-teal-400',
    glowClass: 'shadow-[0_0_50px_rgba(6,182,212,0.6)]',
    gradientBackground: 'bg-radial from-zinc-950 via-teal-950 to-black',
    ringColors: ['#06b6d4', '#10b981', '#3b82f6', '#14b8a6'],
  },
];
