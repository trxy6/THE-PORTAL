import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Check, User, Calendar, Heart, Music } from 'lucide-react';

interface PecosProfileEditorProps {
  userId: string;
  onUpdate: () => void;
}

export default function PecosProfileEditor({
  userId,
  onUpdate
}: PecosProfileEditorProps) {
  const [displayName, setDisplayName] = useState<string>('');
  const [favoriteColor, setFavoriteColor] = useState<string>('purple');
  const [themeAccentColor, setThemeAccentColor] = useState<string>('#8b5cf6');
  const [birthdayMonth, setBirthdayMonth] = useState<string>('');
  const [birthdayDay, setBirthdayDay] = useState<string>('');
  const [birthdayYear, setBirthdayYear] = useState<string>('');
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [foodInput, setFoodInput] = useState<string>('');
  const [wantsMusic, setWantsMusic] = useState<boolean>(false);
  const [spotifyAccessStatus, setSpotifyAccessStatus] = useState<string>('not_requested');
  const [spotifyConnected, setSpotifyConnected] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(`portal_profile_${userId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.displayName) setDisplayName(data.displayName);
        if (data.favoriteColor) setFavoriteColor(data.favoriteColor);
        if (data.themeAccentColor) setThemeAccentColor(data.themeAccentColor);
        if (data.birthdayMonth) setBirthdayMonth(data.birthdayMonth);
        if (data.birthdayDay) setBirthdayDay(data.birthdayDay);
        if (data.birthdayYear) setBirthdayYear(data.birthdayYear);
        if (data.favoriteFoods) setFavoriteFoods(data.favoriteFoods);
        if (data.wantsMusic !== undefined) setWantsMusic(data.wantsMusic);
        if (data.spotifyAccessStatus) setSpotifyAccessStatus(data.spotifyAccessStatus);
        if (data.spotifyConnected !== undefined) setSpotifyConnected(data.spotifyConnected);
      } catch (e) {
        console.error("Failed to parse onboarding profile in settings editor", e);
      }
    }
  }, [userId]);

  const COLORS = [
    { name: 'Purple', hex: '#8b5cf6', class: 'bg-[#8b5cf6]' },
    { name: 'Blue', hex: '#3b82f6', class: 'bg-[#3b82f6]' },
    { name: 'Red', hex: '#dc2626', class: 'bg-[#dc2626]' },
    { name: 'Green', hex: '#16a34a', class: 'bg-[#16a34a]' },
    { name: 'Pink', hex: '#ec4899', class: 'bg-[#ec4899]' },
    { name: 'Orange', hex: '#f97316', class: 'bg-[#f97316]' },
  ];

  const handleSave = () => {
    const name = displayName.trim();
    if (!name) {
      alert("Display name cannot be empty.");
      return;
    }
    const profile = {
      displayName: name,
      favoriteColor,
      themeAccentColor,
      birthdayMonth: birthdayMonth || null,
      birthdayDay: birthdayDay || null,
      birthdayYear: birthdayYear || null,
      favoriteFoods,
      wantsMusic,
      spotifyAccessStatus,
      spotifyConnected,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString()
    };
    localStorage.setItem(`portal_profile_${userId}`, JSON.stringify(profile));
    
    // Sync with top user status name/avatar if needed
    localStorage.setItem('portal_current_user_display_name', name);
    
    // Update theme vars
    document.documentElement.style.setProperty('--theme-accent-color1', themeAccentColor);
    document.documentElement.style.setProperty('--theme-card-border', themeAccentColor + '40');
    
    onUpdate();
  };

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

  const handleClearBirthday = () => {
    setBirthdayMonth('');
    setBirthdayDay('');
    setBirthdayYear('');
  };

  return (
    <div className="space-y-5 text-left font-sans text-xs">
      
      {/* 1. Name */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          Preferred Display Name
        </label>
        <input 
          type="text" 
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display Name"
          className="w-full max-w-sm px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/5 outline-none text-white focus:border-purple-500 font-bold"
        />
      </div>

      {/* 2. Favorite Color Accent */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Workspace Color Accent
        </label>
        
        <div className="flex flex-wrap items-center gap-3">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => { setFavoriteColor(c.name); setThemeAccentColor(c.hex); }}
              className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 hover:scale-110 relative flex items-center justify-center cursor-pointer ${c.class}`}
              style={{ 
                borderColor: favoriteColor === c.name ? '#ffffff' : 'rgba(255,255,255,0.1)' 
              }}
              title={c.name}
            >
              {favoriteColor === c.name && (
                <Check className="w-4 h-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
              )}
            </button>
          ))}
          
          {/* Custom Hex */}
          <div className="flex items-center gap-2 pl-2">
            <input 
              type="color" 
              value={themeAccentColor}
              onChange={(e) => { setFavoriteColor('custom'); setThemeAccentColor(e.target.value); }}
              className="w-6 h-6 rounded border border-white/10 cursor-pointer"
            />
            <input 
              type="text" 
              value={themeAccentColor}
              onChange={(e) => { setFavoriteColor('custom'); setThemeAccentColor(e.target.value); }}
              placeholder="#8b5cf6"
              className="w-20 px-2 py-1 rounded bg-slate-900 border border-white/5 text-center text-xs font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* 3. Birthday */}
      <div className="space-y-2">
        <div className="flex items-center justify-between max-w-sm">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Special Birthday Rift Celebration
          </label>
          {(birthdayMonth || birthdayDay || birthdayYear) && (
            <button 
              type="button" 
              onClick={handleClearBirthday}
              className="text-[10px] text-rose-400 hover:underline cursor-pointer font-bold"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2 max-w-sm">
          <select
            value={birthdayMonth}
            onChange={(e) => setBirthdayMonth(e.target.value)}
            className="px-2 py-2 rounded-lg bg-slate-900/60 border border-white/5 outline-none focus:border-purple-500 text-white font-bold"
          >
            <option value="">Month</option>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={birthdayDay}
            onChange={(e) => setBirthdayDay(e.target.value)}
            className="px-2 py-2 rounded-lg bg-slate-900/60 border border-white/5 outline-none focus:border-purple-500 text-white font-bold"
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }).map((_, i) => (
              <option key={i+1} value={i+1}>{i+1}</option>
            ))}
          </select>
          <input 
            type="text" 
            maxLength={4}
            placeholder="Year (Opt)"
            value={birthdayYear}
            onChange={(e) => setBirthdayYear(e.target.value.replace(/\D/g, ''))}
            className="px-2 py-2 rounded-lg bg-slate-900/60 border border-white/5 text-center outline-none focus:border-purple-500 text-white font-bold"
          />
        </div>
      </div>

      {/* 4. Favorite Foods */}
      <div className="space-y-2 max-w-sm">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5" />
          Favorite Foods list
        </label>
        
        <form onSubmit={handleAddFood} className="flex gap-2">
          <input 
            type="text"
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            placeholder="Add a food tag..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-white/5 outline-none text-white focus:border-purple-500 font-bold"
          />
          <button 
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors font-bold text-white cursor-pointer"
          >
            Add
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {favoriteFoods.map(food => (
            <span key={food} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-purple-500/10 text-[10px] text-purple-300 font-bold uppercase tracking-wider">
              {food}
              <button 
                type="button" 
                onClick={() => handleRemoveFood(food)} 
                className="hover:text-rose-400 cursor-pointer"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 5. Music */}
      <div className="space-y-2 max-w-sm pt-1.5">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5" />
          Music Integration Settings
        </label>
        
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <div>
            <span className="font-bold text-white block">Spotify Integration</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Spotify Access Status: <span className="text-green-400 font-extrabold">{spotifyAccessStatus}</span></span>
          </div>
          <button
            type="button"
            onClick={() => {
              const connect = !wantsMusic;
              setWantsMusic(connect);
              if (connect) {
                setSpotifyAccessStatus('connected');
                setSpotifyConnected(true);
              } else {
                setSpotifyAccessStatus('not_requested');
                setSpotifyConnected(false);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
              wantsMusic 
                ? 'bg-green-600/10 border border-green-500/30 text-green-400' 
                : 'bg-slate-900 border border-slate-700/25 text-slate-500'
            }`}
          >
            {wantsMusic ? 'Connected' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-white/5 max-w-sm flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white cursor-pointer hover:shadow-lg active:scale-95 transition-all"
          style={{ background: 'var(--theme-btn-gradient)' }}
        >
          Save Profile Changes
        </button>
      </div>

    </div>
  );
}
