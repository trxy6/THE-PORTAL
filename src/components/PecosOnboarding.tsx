import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import pecosMascot from '../assets/pecos.png';
import { 
  Sparkles, Music, Calendar, Heart, ArrowLeft, ArrowRight, 
  Check, Volume2, VolumeX, User, ChevronRight, HelpCircle, Mail, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface PecosOnboardingProps {
  userId: string;
  onComplete: (profileData: any) => void;
  onBackToLogin: () => void;
  portalDarkMode: boolean;
  onboardingAudio?: HTMLAudioElement | null;
}

export default function PecosOnboarding({
  userId,
  onComplete,
  onBackToLogin,
  portalDarkMode,
  onboardingAudio
}: PecosOnboardingProps) {
  // --- Profile Fields ---
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [displayName, setDisplayName] = useState<string>('');
  const [favoriteColor, setFavoriteColor] = useState<string>('purple');
  const [themeAccentColor, setThemeAccentColor] = useState<string>('#8b5cf6');
  const [birthdayMonth, setBirthdayMonth] = useState<string>('');
  const [birthdayDay, setBirthdayDay] = useState<string>('');
  const [birthdayYear, setBirthdayYear] = useState<string>('');
  const [birthdaySkipped, setBirthdaySkipped] = useState<boolean>(false);
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [foodInput, setFoodInput] = useState<string>('');
  const [favoriteFoodsSkipped, setFavoriteFoodsSkipped] = useState<boolean>(false);
  
  // Music options
  const [wantsMusic, setWantsMusic] = useState<boolean | null>(null);
  const [musicProvider, setMusicProvider] = useState<string | null>(null);
  const [spotifyAccessStatus, setSpotifyAccessStatus] = useState<
    'not_requested' | 'pending' | 'approved' | 'connected' | 'declined'
  >('not_requested');
  const [spotifyConnected, setSpotifyConnected] = useState<boolean>(false);
  const [spotifyEmail, setSpotifyEmail] = useState<string>('');
  const [showVipModal, setShowVipModal] = useState<boolean>(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);

  // Flow State
  const [showPecosResponse, setShowPecosResponse] = useState<boolean>(false);
  const [pecosMessageOverride, setPecosMessageOverride] = useState<string | null>(null);
  const [showFeedbackGuide, setShowFeedbackGuide] = useState<boolean>(false);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let audio: HTMLAudioElement;
    
    if (onboardingAudio) {
      audio = onboardingAudio;
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    } else {
      audio = new Audio('/orbital-boot-sequence.wav');
      audio.loop = true;
      audio.volume = 0.45;
      audio.play().catch(e => {
        console.log("Audio autoplay blocked by browser policy. Waiting for user click.");
      });
    }
    audioRef.current = audio;

    const handleUserInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      if (!onboardingAudio) {
        audio.pause();
      }
      audioRef.current = null;
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [onboardingAudio]);

  // Load saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem(`portal_profile_${userId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.onboardingStep) setCurrentStep(data.onboardingStep);
        if (data.displayName) setDisplayName(data.displayName);
        if (data.favoriteColor) setFavoriteColor(data.favoriteColor);
        if (data.themeAccentColor) setThemeAccentColor(data.themeAccentColor);
        if (data.birthdayMonth) setBirthdayMonth(data.birthdayMonth);
        if (data.birthdayDay) setBirthdayDay(data.birthdayDay);
        if (data.birthdayYear) setBirthdayYear(data.birthdayYear);
        if (data.birthdaySkipped) setBirthdaySkipped(data.birthdaySkipped);
        if (data.favoriteFoods) setFavoriteFoods(data.favoriteFoods);
        if (data.favoriteFoodsSkipped) setFavoriteFoodsSkipped(data.favoriteFoodsSkipped);
        if (data.wantsMusic !== undefined) setWantsMusic(data.wantsMusic);
        if (data.musicProvider) setMusicProvider(data.musicProvider);
        if (data.spotifyAccessStatus) setSpotifyAccessStatus(data.spotifyAccessStatus);
        if (data.spotifyConnected !== undefined) setSpotifyConnected(data.spotifyConnected);
      } catch (e) {
        console.error("Failed to parse onboarding saved profile data", e);
      }
    }
  }, [userId]);

  // Save progress helper
  const saveProgress = (nextStep: number) => {
    const profile = {
      displayName,
      favoriteColor,
      themeAccentColor,
      birthdayMonth: birthdayMonth || null,
      birthdayDay: birthdayDay || null,
      birthdayYear: birthdayYear || null,
      birthdaySkipped,
      favoriteFoods,
      favoriteFoodsSkipped,
      wantsMusic,
      musicProvider,
      spotifyAccessStatus,
      spotifyConnected,
      onboardingStep: nextStep,
      onboardingCompleted: false,
      onboardingCompletedAt: null
    };
    localStorage.setItem(`portal_profile_${userId}`, JSON.stringify(profile));
  };

  const handleNextStep = (stepNum: number) => {
    setCurrentStep(stepNum);
    setShowPecosResponse(false);
    setPecosMessageOverride(null);
    saveProgress(stepNum);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      handleNextStep(currentStep - 1);
    }
  };

  // Preset Colors
  const COLORS = [
    { name: 'Purple', hex: '#8b5cf6', class: 'bg-[#8b5cf6]' },
    { name: 'Blue', hex: '#3b82f6', class: 'bg-[#3b82f6]' },
    { name: 'Red', hex: '#dc2626', class: 'bg-[#dc2626]' },
    { name: 'Green', hex: '#16a34a', class: 'bg-[#16a34a]' },
    { name: 'Pink', hex: '#ec4899', class: 'bg-[#ec4899]' },
    { name: 'Orange', hex: '#f97316', class: 'bg-[#f97316]' },
  ];

  // Helper to add food tags
  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    const food = foodInput.trim().toLowerCase();
    if (food && !favoriteFoods.includes(food)) {
      setFavoriteFoods([...favoriteFoods, food]);
      setFoodInput('');
    }
  };

  const handleRemoveFood = (food: string) => {
    setFavoriteFoods(favoriteFoods.filter(f => f !== food));
  };

  // PECOS Dialogues based on step
  const getPecosDialogue = () => {
    if (pecosMessageOverride) return pecosMessageOverride;

    switch (currentStep) {
      case 1:
        return [
          "Ah—a new user! Welcome! I’m genuinely glad you could join our beta.",
          "Before we continue, fair warning: you’re about to do a little reading.",
          "I know, I know. You came here because you want to try The Portal, not study for an exam.",
          "Since you’re part of the beta, though, we need to go over a few instructions and explain how feedback works.",
          "Thank you so much for being part of the beta. It’s incredibly important to both me and my creator. Your experience and feedback will help us make The Portal more fun, useful, and customizable for everyone.",
          "I promise to keep the reading as painless as possible. Stick with me, and we’ll have your Portal ready in no time."
        ];
      case 2:
        return [
          "Welcome to The Portal.",
          "Before we begin, let me explain exactly what this place is.",
          "My creator built The Portal around a simple idea: even when you aren’t home, you should be able to take a little piece of home with you.",
          "The Portal is your personal workspace, entertainment center, AI companion, and home away from home—all gathered in one customizable place.",
          "Well… as customizable as it can be right now.",
          "That’s why you’re here! As a beta member, your feedback will help make The Portal more useful, personal, customizable, and—most importantly—more fun."
        ];
      case 3:
        return [
          "But before we explore, let’s get to know each other.",
          "I’m your personal chatbot—similar to certain other famous AIs that cannot be named for completely serious and definitely-not-made-up legal reasons.",
          "Unlike those mysterious assistants, I live here in The Portal. There are no subscriptions required, no usage meter watching over your shoulder, and I’m here whenever you need me.",
          "Oh—and my name is PECOS, like the New Mexico city. But it actually stands for:",
          "Portal Entry, Configuration and Onboarding System.",
          "Now that you know a little about me, let’s configure The Portal for you."
        ];
      case 4:
        return [
          "First things first: I don’t want to keep calling you 'User.' That feels a little rude.",
          "What should I call you?"
        ];
      case 5:
        return [
          "Now, let’s give your Portal some personality.",
          "What’s your favorite color?"
        ];
      case 6:
        if (wantsMusic === true) {
          return [
            "Wonderful! I have some good news and some bad news.",
            "The good news is that you can connect your account and listen to your own music directly inside The Portal.",
            "The bad news is that music currently requires Spotify Premium.",
            "Yes, I’m sorry. Please don’t blame the adorable onboarding system.",
            "Apple Music support is planned for a future update, so Apple Music listeners won’t be left behind forever.",
            "Before connecting Spotify, you’ll need permission from The Portal’s creator. Since we’re still in beta, he must add your Spotify account to the VIP access list.",
            "That’s right—you’re a VIP. Try not to let it go to your head."
          ];
        }
        return [
          "Now, would you like to listen to your own music inside The Portal?"
        ];
      case 7:
        return [
          "Next question: when is your birthday?",
          "You can enter only the month and day. The year is completely optional."
        ];
      case 8:
        return [
          "One last fun question: what are some of your favorite foods?",
          "You can name one, list several, or skip this question if food interrogation feels a little too personal."
        ];
      case 9:
        return [
          `Perfect. I think I’m starting to understand you, ${displayName || 'Traveler'}.`,
          "Here’s what I have recorded. Take a quick look!"
        ];
      case 10:
        return [
          "Before I open your Portal, remember that you’re one of our beta members.",
          "If something feels confusing, unfinished, difficult to use, or simply not fun enough, please tell us.",
          "Your feedback directly helps my creator improve The Portal and make it more customizable for everyone.",
          "Thank you again for being here. It’s incredibly important to both of us."
        ];
      case 11:
        return [
          "Configuration complete!",
          `Your Portal is ready, ${displayName || 'Traveler'}.`,
          "I’ll show you around, introduce you to the different modes, and help explain how everything works.",
          "Whenever you’re ready…",
          "Let’s open The Portal."
        ];
      default:
        return ["Wait, how did we end up here? Let's get back on track!"];
    }
  };

  const dialogueList = getPecosDialogue();

  // Color selection preview update
  const handleColorSelect = (name: string, hex: string) => {
    setFavoriteColor(name);
    setThemeAccentColor(hex);
    // Custom inline style live update
    const secondaryColor = hex === '#8b5cf6' ? '#db2777' : '#8b5cf6';
    document.documentElement.style.setProperty('--theme-accent-color-1', hex);
    document.documentElement.style.setProperty('--theme-accent-color-2', secondaryColor);
    document.documentElement.style.setProperty('--theme-btn-gradient', `linear-gradient(135deg, ${hex}, ${secondaryColor})`);
    document.documentElement.style.setProperty('--theme-card-border', hex + '40');
  };

  const secondaryAccentColor = themeAccentColor === '#8b5cf6' ? '#db2777' : '#8b5cf6';

  return (
    <div className="fixed inset-0 w-full h-full font-sans overflow-y-auto select-none portal-dark flex flex-col justify-between p-4 sm:p-6 md:p-8"
      style={{ 
        background: 'linear-gradient(135deg, #06000f 0%, #0d0221 100%)',
        color: '#e9d5ff',
        ['--theme-accent-color-1' as any]: themeAccentColor,
        ['--theme-accent-color-2' as any]: secondaryAccentColor,
        ['--theme-btn-gradient' as any]: `linear-gradient(135deg, ${themeAccentColor}, ${secondaryAccentColor})`,
        ['--theme-card-border' as any]: themeAccentColor + '40',
      }}>
      
      {/* ── ANIMATED COLOUR ORBS (MATCHING LOGIN BACKGROUND) ── */}
      <div className="absolute pointer-events-none" style={{
        width: 700, height: 700, borderRadius: '50%',
        background: `radial-gradient(circle, ${themeAccentColor}47 0%, transparent 70%)`,
        top: '-15%', left: '-10%',
        animation: 'orb-drift-a 18s ease-in-out infinite',
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${secondaryAccentColor}38 0%, transparent 70%)`,
        bottom: '-20%', right: '10%',
        animation: 'orb-drift-b 22s ease-in-out infinite',
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${themeAccentColor}33 0%, transparent 70%)`,
        top: '35%', right: '-5%',
        animation: 'orb-drift-c 14s ease-in-out infinite',
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 350, height: 350, borderRadius: '50%',
        background: `radial-gradient(circle, ${secondaryAccentColor}24 0%, transparent 70%)`,
        top: '55%', left: '5%',
        animation: 'orb-drift-a 20s ease-in-out infinite reverse',
      }} />

      {/* ── CYBER GRID (MATCHING LOGIN BACKGROUND) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{
        backgroundImage: `linear-gradient(${themeAccentColor}55 1px, transparent 1px), linear-gradient(90deg, ${themeAccentColor}55 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        animation: 'grid-drift 8s linear infinite',
      }} />

      {/* ── SCAN LINE ── */}
      <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-[2]"
        style={{
          background: `linear-gradient(90deg, transparent, ${themeAccentColor}99, ${secondaryAccentColor}cc, ${themeAccentColor}99, transparent)`,
          animation: 'scan-line 6s linear infinite',
        }} />

      {/* --- TOP ROW: HEADER & PROGRESS --- */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full border-b border-white/5 pb-4 gap-3">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-purple-400">
              TRAVELER RIFT ONBOARDING
            </span>
          </div>

          <button 
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all text-slate-350 hover:text-white flex items-center gap-1.5 cursor-pointer text-[9px] font-extrabold uppercase tracking-wider"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-green-400 animate-pulse" />}
            {isMuted ? 'Muted' : 'Sound On'}
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1 sm:gap-2">
          {Array.from({ length: 11 }).map((_, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;
            return (
              <div 
                key={stepNum}
                className={`h-1 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'w-6 sm:w-8' 
                    : isCompleted 
                      ? 'w-2 bg-purple-500' 
                      : 'w-2 bg-slate-800'
                }`}
                style={isActive ? { background: 'var(--theme-btn-gradient)' } : undefined}
              />
            );
          })}
          <span className="text-[9px] font-mono text-slate-500 pl-1 font-bold">
            {currentStep}/11
          </span>
        </div>
      </div>

      {/* --- MIDDLE ROW: MASCOT & DIALOGUE CONTAINER --- */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full relative z-10 py-6">
        
        {/* Floating Mascot PECOS */}
        <div className="relative mb-6 sm:mb-8 flex flex-col items-center">
          {/* Cosmic Glow Circle */}
          <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full blur-xl opacity-30 animate-pulse pointer-events-none"
            style={{ background: `radial-gradient(circle, ${themeAccentColor} 0%, transparent 70%)` }} />
          
          {/* PECOS PNG mascot */}
          <motion.img 
            src={pecosMascot} 
            alt="PECOS Onboarding mascot" 
            className="w-32 h-32 sm:w-44 sm:h-44 object-contain relative z-10 select-none drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className="mt-2.5 px-3 py-1 rounded-full bg-slate-950/60 border border-white/5 text-[9px] font-extrabold uppercase tracking-widest text-[#e2d9f3]">
            🤖 PECOS Companion
          </div>
        </div>

        {/* Dialogue Box */}
        <div className="w-full bg-[#0a021c]/80 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-2xl relative max-w-2xl text-center space-y-3.5 backdrop-blur-md">
          {/* Scanner lines */}
          <div className="absolute inset-0 cyber-grid-dense opacity-[0.03] pointer-events-none rounded-2xl" />

          {/* Dialogue content - shows one step text or response */}
          <div className="text-sm sm:text-base text-slate-100 font-medium tracking-wide leading-relaxed space-y-3">
            {Array.isArray(dialogueList) ? (
              dialogueList.map((para, pidx) => (
                <p key={pidx} className="animate-[fadeIn_0.5s_ease-out]">
                  {para}
                </p>
              ))
            ) : (
              <p className="animate-[fadeIn_0.5s_ease-out]">{dialogueList}</p>
            )}
          </div>

          {/* Render inputs / selections for current step */}
          <div className="pt-4 border-t border-white/5 flex flex-col items-center justify-center">
            
            {/* Step 4: Name input */}
            {currentStep === 4 && (
              <div className="w-full max-w-sm space-y-3">
                <input 
                  type="text"
                  placeholder="Enter your traveler name..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-center text-sm outline-none text-white focus:border-purple-500 tracking-wide font-bold"
                />
              </div>
            )}

            {/* Step 5: Color Pickers */}
            {currentStep === 5 && (
              <div className="w-full max-w-md space-y-4">
                {/* Visual circle choices */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handleColorSelect(c.name, c.hex)}
                      className={`w-10 h-10 rounded-full border-2 transition-transform duration-200 hover:scale-110 relative flex items-center justify-center cursor-pointer ${c.class}`}
                      style={{ 
                        borderColor: favoriteColor === c.name ? '#ffffff' : 'rgba(255,255,255,0.1)' 
                      }}
                      title={c.name}
                    >
                      {favoriteColor === c.name && (
                        <Check className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Hex:</span>
                  <input 
                    type="color"
                    value={themeAccentColor}
                    onChange={(e) => handleColorSelect('custom', e.target.value)}
                    className="w-7 h-7 rounded border border-white/10 cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={themeAccentColor}
                    onChange={(e) => handleColorSelect('custom', e.target.value)}
                    placeholder="#8b5cf6"
                    className="w-24 px-2 py-1 rounded bg-slate-950 border border-white/10 text-center text-xs font-mono font-bold"
                  />
                </div>

                <div className="text-[9px] text-slate-500 font-medium">
                  Chosen Accent: <span className="font-extrabold uppercase" style={{ color: themeAccentColor }}>{favoriteColor} ({themeAccentColor})</span>
                </div>
              </div>
            )}

            {/* Step 6: Spotify details */}
            {currentStep === 6 && wantsMusic === true && (
              <div className="w-full max-w-md p-3.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-4 text-center mt-2">
                <div className="flex items-center justify-center gap-2 text-green-500 font-extrabold text-xs uppercase tracking-wider">
                  <Music className="w-4 h-4" />
                  Spotify Premium System integration
                </div>

                <div className="text-slate-400 text-xs leading-relaxed">
                  Status: {' '}
                  {spotifyAccessStatus === 'not_requested' && <span className="text-amber-500 font-bold">Not Requested</span>}
                  {spotifyAccessStatus === 'pending' && <span className="text-blue-400 font-bold">Pending VIP Approval ⏳</span>}
                  {spotifyAccessStatus === 'connected' && <span className="text-green-400 font-bold">Authorized & Connected 🎵</span>}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button 
                    onClick={() => setShowVipModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-900/20 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-900/30 text-xs font-extrabold cursor-pointer"
                  >
                    Request VIP Access
                  </button>
                  <button 
                    onClick={() => {
                      if (spotifyAccessStatus === 'not_requested') {
                        setPecosMessageOverride("Hold on, Traveler! You need VIP permission first. Please click 'Request VIP Access' to register your Spotify address.");
                      } else {
                        setShowConnectModal(true);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-green-950/40 border border-green-500/30 hover:border-green-400 text-green-400 text-xs font-extrabold cursor-pointer"
                  >
                    Connect Spotify
                  </button>
                  <button 
                    onClick={() => {
                      setWantsMusic(false);
                      setPecosMessageOverride("No problem! You can set that up anytime from Music mode.");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900/40 border border-slate-700/20 hover:border-slate-500 text-xs text-slate-400 font-bold cursor-pointer"
                  >
                    Set Up Later
                  </button>
                </div>
              </div>
            )}

            {/* Step 7: Birthday input */}
            {currentStep === 7 && !birthdaySkipped && (
              <div className="w-full max-w-sm space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Month</label>
                    <select
                      value={birthdayMonth}
                      onChange={(e) => setBirthdayMonth(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-xs outline-none focus:border-purple-500 text-white font-bold"
                    >
                      <option value="">Month</option>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Day</label>
                    <select
                      value={birthdayDay}
                      onChange={(e) => setBirthdayDay(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-xs outline-none focus:border-purple-500 text-white font-bold"
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }).map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Year (Opt)</label>
                    <input 
                      type="text" 
                      maxLength={4}
                      placeholder="e.g. 1999"
                      value={birthdayYear}
                      onChange={(e) => setBirthdayYear(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-2 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-center text-xs outline-none focus:border-purple-500 text-white font-bold"
                    />
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 font-medium leading-normal pt-1.5 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  Collected solely to show custom birthday indicators in the dashboard. Never sent online.
                </div>
              </div>
            )}

            {/* Step 8: Favorite Foods */}
            {currentStep === 8 && !favoriteFoodsSkipped && (
              <div className="w-full max-w-md space-y-4">
                <form onSubmit={handleAddFood} className="flex gap-2">
                  <input 
                    type="text"
                    value={foodInput}
                    onChange={(e) => setFoodInput(e.target.value)}
                    placeholder="e.g. Sushi, Pizza, Ramen..."
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs outline-none text-white focus:border-purple-500 font-bold"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors cursor-pointer"
                    style={{ background: 'var(--theme-btn-gradient)' }}
                  >
                    Add
                  </button>
                </form>

                {/* Food tags grid */}
                <div className="flex flex-wrap gap-2 items-center justify-center">
                  {favoriteFoods.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No foods added yet</span>
                  ) : (
                    favoriteFoods.map(food => (
                      <span key={food} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-purple-500/20 text-xs text-purple-300 font-semibold uppercase tracking-wider">
                        {food}
                        <button 
                          type="button"
                          onClick={() => handleRemoveFood(food)}
                          className="hover:text-rose-400 text-[10px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 9: Review Panel */}
            {currentStep === 9 && (
              <div className="w-full max-w-md p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3.5 text-left text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Personalization review</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                
                <div className="space-y-2.5 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Display Name:</span>
                    <span className="text-white font-bold">{displayName || 'Skipped'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Favorite Color:</span>
                    <span className="font-bold flex items-center gap-1.5" style={{ color: themeAccentColor }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeAccentColor }} />
                      {favoriteColor}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Music Access:</span>
                    <span className="text-white font-bold">
                      {wantsMusic ? `Spotify VIP (${spotifyAccessStatus})` : 'No Music Connection'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Birthday:</span>
                    <span className="text-white font-bold">
                      {birthdayMonth && birthdayDay ? `${birthdayMonth} ${birthdayDay}${birthdayYear ? `, ${birthdayYear}` : ''}` : 'Skipped'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Favorite Foods:</span>
                    <span className="text-white font-bold truncate max-w-[200px]">
                      {favoriteFoods.length > 0 ? favoriteFoods.join(', ') : 'Skipped'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 10: Feedback Mock Highlight */}
            {currentStep === 10 && showFeedbackGuide && (
              <div className="w-full max-w-md p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-left text-xs leading-relaxed space-y-2.5 mt-2 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-2 text-indigo-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <HelpCircle className="w-4 h-4" />
                  Rift Feedback Terminal Locator
                </div>
                <p className="text-slate-350">
                  You can submit feedback at any time by clicking the <span className="font-extrabold text-white">Feedback ✉</span> button located in the top-right header panel or at the bottom navigation of your Settings.
                </p>
                <p className="text-slate-350">
                  Useful feedback includes browser version details, steps to reproduce errors, screenshots/screen recordings, and suggestions for new widgets!
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: NAVIGATION CONTROLS --- */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-4xl mx-auto border-t border-white/5 pt-4">
        
        {/* Back Button */}
        <div>
          {currentStep > 1 && (
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700/50 hover:border-slate-500 bg-slate-950/20 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
        </div>

        {/* Skip controls for optional questions */}
        <div>
          {/* Step 7 (Birthday) skip */}
          {currentStep === 7 && !birthdaySkipped && (
            <button
              onClick={() => {
                setBirthdaySkipped(true);
                setBirthdayMonth('');
                setBirthdayDay('');
                setBirthdayYear('');
                setPecosMessageOverride("No problem. I respect a mysterious backstory.");
                setShowPecosResponse(true);
              }}
              className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-300 font-bold hover:underline cursor-pointer"
            >
              Skip Birthday Question
            </button>
          )}

          {/* Step 8 (Favorite Foods) skip */}
          {currentStep === 8 && !favoriteFoodsSkipped && (
            <button
              onClick={() => {
                setFavoriteFoodsSkipped(true);
                setFavoriteFoods([]);
                setPecosMessageOverride("Interrogation avoided! Moving forward...");
                setShowPecosResponse(true);
              }}
              className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-300 font-bold hover:underline cursor-pointer"
            >
              Skip Foods Question
            </button>
          )}
        </div>

        {/* Action Button: Continue / Confirm / Enter */}
        <div>
          {/* Step 1 */}
          {currentStep === 1 && (
            <button
              onClick={() => handleNextStep(2)}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
              style={{ background: 'var(--theme-btn-gradient)' }}
            >
              Enter The Portal
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <button
              onClick={() => handleNextStep(3)}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
              style={{ background: 'var(--theme-btn-gradient)' }}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <button
              onClick={() => handleNextStep(4)}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
              style={{ background: 'var(--theme-btn-gradient)' }}
            >
              Meet PECOS
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <button
              onClick={() => {
                if (!showPecosResponse) {
                  const name = displayName.trim();
                  if (!name) {
                    setPecosMessageOverride("Ah, please don't leave this empty! I need something to call you. What name should I register?");
                    return;
                  }
                  setPecosMessageOverride(`${name}? Nice to officially meet you! I have a feeling we’re going to get along.`);
                  setShowPecosResponse(true);
                } else {
                  handleNextStep(5);
                }
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
              style={{ background: 'var(--theme-btn-gradient)' }}
            >
              {!showPecosResponse ? "Nice to Meet You" : "Continue"}
            </button>
          )}

          {/* Step 5 */}
          {currentStep === 5 && (
            <button
              onClick={() => {
                if (!showPecosResponse) {
                  setPecosMessageOverride(`Excellent choice! I’ll use ${favoriteColor} to personalize parts of your Portal. Don’t worry—you can always change it later.`);
                  setShowPecosResponse(true);
                } else {
                  handleNextStep(6);
                }
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
              style={{ background: 'var(--theme-btn-gradient)' }}
            >
              {!showPecosResponse ? "Confirm Color" : "Continue"}
            </button>
          )}

          {/* Step 6: Initial wantsMusic? prompt */}
          {currentStep === 6 && wantsMusic === null && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setWantsMusic(true);
                  setMusicProvider('spotify');
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-black uppercase tracking-wider text-white cursor-pointer transition-colors"
                style={{ background: 'var(--theme-btn-gradient)' }}
              >
                Yes, Set Up Music
              </button>
              <button
                onClick={() => {
                  setWantsMusic(false);
                  setPecosMessageOverride("No problem! You can set that up anytime from Music mode.");
                  setShowPecosResponse(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-black uppercase tracking-wider text-slate-400 cursor-pointer transition-colors"
              >
                No, Maybe Later
              </button>
            </div>
          )}

          {/* Step 6 dialogue responses */}
          {currentStep === 6 && wantsMusic !== null && (
            <button
              onClick={() => handleNextStep(7)}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
              style={{ background: 'var(--theme-btn-gradient)' }}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Step 7 (Birthday) confirm / next */}
          {currentStep === 7 && (
            <button
              onClick={() => {
                if (birthdaySkipped) {
                  handleNextStep(8);
                  return;
                }
                if (!birthdayMonth || !birthdayDay) {
                  setPecosMessageOverride("Please enter both the month and day, or click 'Skip Birthday Question' to skip!");
                  return;
                }
                if (!showPecosResponse) {
                  setPecosMessageOverride("Got it! I’ll make sure The Portal remembers your special day.");
                  setShowPecosResponse(true);
                } else {
                  handleNextStep(8);
                }
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
              style={{ background: 'var(--theme-btn-gradient)' }}
            >
              {!showPecosResponse && !birthdaySkipped ? "Confirm Birthday" : "Continue"}
            </button>
          )}

          {/* Step 8 (Favorite Foods) confirm / next */}
          {currentStep === 8 && (
            <button
              onClick={() => {
                if (favoriteFoodsSkipped) {
                  handleNextStep(9);
                  return;
                }
                if (!showPecosResponse) {
                  setPecosMessageOverride(
                    favoriteFoods.length > 0
                      ? `Got it! I've added ${favoriteFoods.join(', ')} to your profile. I respect a traveler with good taste!`
                      : "You can add some foods or click 'Skip Foods Question' to move ahead!"
                  );
                  if (favoriteFoods.length > 0) {
                    setShowPecosResponse(true);
                  }
                } else {
                  handleNextStep(9);
                }
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
              style={{ background: 'var(--theme-btn-gradient)' }}
            >
              {!showPecosResponse && !favoriteFoodsSkipped ? "Confirm Foods" : "Continue"}
            </button>
          )}

          {/* Step 9 (Review) */}
          {currentStep === 9 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Direct edit list
                  const editField = prompt("What would you like to change?\nOptions: name, color, birthday, foods, music");
                  if (editField) {
                    const norm = editField.trim().toLowerCase();
                    if (norm === 'name') handleNextStep(4);
                    else if (norm === 'color') handleNextStep(5);
                    else if (norm === 'music') handleNextStep(6);
                    else if (norm === 'birthday') {
                      setBirthdaySkipped(false);
                      handleNextStep(7);
                    }
                    else if (norm === 'foods') {
                      setFavoriteFoodsSkipped(false);
                      handleNextStep(8);
                    }
                    else {
                      alert("Invalid field name. Please input 'name', 'color', 'birthday', 'foods', or 'music'.");
                    }
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Make Changes
              </button>
              <button
                onClick={() => handleNextStep(10)}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
                style={{ background: 'var(--theme-btn-gradient)' }}
              >
                Everything Looks Good
              </button>
            </div>
          )}

          {/* Step 10 */}
          {currentStep === 10 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFeedbackGuide(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Show Me How Feedback Works
              </button>
              <button
                onClick={() => handleNextStep(11)}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
                style={{ background: 'var(--theme-btn-gradient)' }}
              >
                I Understand
              </button>
            </div>
          )}

          {/* Step 11 */}
          {currentStep === 11 && (
            <button
              onClick={() => {
                const finalProfile = {
                  displayName,
                  favoriteColor,
                  themeAccentColor,
                  birthdayMonth: birthdayMonth || null,
                  birthdayDay: birthdayDay || null,
                  birthdayYear: birthdayYear || null,
                  favoriteFoods,
                  wantsMusic,
                  musicProvider,
                  spotifyAccessStatus,
                  spotifyConnected,
                  onboardingCompleted: true,
                  onboardingCompletedAt: new Date().toISOString()
                };
                localStorage.setItem(`portal_profile_${userId}`, JSON.stringify(finalProfile));
                // Update active browser theme colors immediately
                document.documentElement.style.setProperty('--theme-accent-color1', themeAccentColor);
                onComplete(finalProfile);
              }}
              className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-white cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-2 animate-[pulse_2s_infinite]"
              style={{ 
                background: 'var(--theme-btn-gradient)',
                boxShadow: `0 0 24px ${themeAccentColor}77`
              }}
            >
              Open My Portal
            </button>
          )}

        </div>
      </div>

      {/* --- NESTED MODALS: SPOTIFY SYSTEM --- */}
      {/* 1. Request VIP Access Modal */}
      {showVipModal && (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black/80 z-[99999] p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0d071d] border border-purple-500/30 p-6 space-y-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Request Spotify VIP Access</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Enter your Spotify account email to register for the beta access list. The Portal creator will add you within 24 hours.
            </p>
            <input 
              type="email"
              value={spotifyEmail}
              onChange={(e) => setSpotifyEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs outline-none text-white text-center font-bold"
            />
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowVipModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!spotifyEmail.includes('@')) {
                    alert("Please enter a valid email address.");
                    return;
                  }
                  setSpotifyAccessStatus('pending');
                  setShowVipModal(false);
                  alert("VIP Access Request Sent! The status is now pending.");
                }}
                className="flex-1 py-2 rounded-lg text-xs font-black uppercase text-white cursor-pointer"
                style={{ background: 'var(--theme-btn-gradient)' }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Connect Spotify Mock Auth Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black/85 z-[99999] p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-green-500/20 p-6 space-y-5 text-center text-white">
            <div className="flex items-center justify-center gap-2.5 text-green-500 font-extrabold uppercase tracking-wider text-sm border-b border-white/5 pb-3">
              <Music className="w-5 h-5 animate-pulse" />
              Spotify Authorization Bridge
            </div>
            
            <div className="text-left space-y-2 text-xs text-slate-300">
              <p className="font-extrabold text-white">The Portal requests the following permissions:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Read current playback state</li>
                <li>Control playback volume & skip tracks</li>
                <li>Access your Premium subscription details</li>
              </ul>
              <div className="p-3 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-[11px] leading-relaxed">
                🔒 Secure OAuth Connection: Your Spotify account password is never collected or stored. All session tokens are saved securely.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSpotifyConnected(true);
                  setSpotifyAccessStatus('connected');
                  setShowConnectModal(false);
                  alert("Spotify Premium Account Authorized successfully!");
                }}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-xs font-black uppercase text-white cursor-pointer"
              >
                Agree & Connect
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
