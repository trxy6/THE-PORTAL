import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Camera, Upload, X, Sparkles, RefreshCw, FileText, Dices, CalendarRange, Bot, HelpCircle, Check, AlertCircle, Trash, Plus, Trophy, Eye } from 'lucide-react';
import DiceTrayCanvas from './components/DiceTrayCanvas';
import D20War from './components/D20War';
import CosmicWords from './components/CosmicWords';

const SPORTS_LEAGUES = {
  mlb: {
    label: 'MLB Baseball',
    url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  },
  eng1: {
    label: 'Premier League',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
  },
  nba: {
    label: 'NBA Basketball',
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  },
  nfl: {
    label: 'NFL Football',
    url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  },
  nhl: {
    label: 'NHL Hockey',
    url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  },
};

type SportsLeague = keyof typeof SPORTS_LEAGUES;

interface ParlayLeg {
  id: string;
  league: SportsLeague;
  eventId: string;
  teamId: string;
  teamName: string;
  opponentName: string;
  matchup: string;
  pickedAt: string;
  status?: string; // 'won' | 'lost' | 'live' | 'pending' | 'push' | 'leading' | 'trailing'
}

interface Parlay {
  id: string;
  legs: ParlayLeg[];
  savedAt: string;
  status: 'won' | 'lost' | 'live' | 'pending' | 'push';
}

// Global storage helper
const store = {
  get(key: string, fallback: any) {
    try {
      const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
      const isGlobal = (key === 'portal_users' || key === 'global_feedback_ideas' || key === 'portal_current_user');
      const finalKey = isGlobal ? key : `${loggedInUser}_${key}`;
      const v = localStorage.getItem(finalKey);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key: string, val: any) {
    try {
      const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
      const isGlobal = (key === 'portal_users' || key === 'global_feedback_ideas' || key === 'portal_current_user');
      const finalKey = isGlobal ? key : `${loggedInUser}_${key}`;
      localStorage.setItem(finalKey, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  },
};

export default function App() {
  // Pre-seed default users (with creator trxy6: 5234)
  useState(() => {
    const defaultUsers = [{ userId: 'trxy6', pin: '5234', isCreator: true }];
    if (!localStorage.getItem('portal_users')) {
      localStorage.setItem('portal_users', JSON.stringify(defaultUsers));
    } else {
      // Check if "blackmama" exists and remove all instances of it
      try {
        const raw = localStorage.getItem('portal_users');
        if (raw) {
          const users = JSON.parse(raw);
          const filtered = users.filter((u: any) => u.userId && u.userId.toLowerCase() !== 'blackmama');
          if (users.length !== filtered.length) {
            localStorage.setItem('portal_users', JSON.stringify(filtered));
            
            // Also if the currently logged-in user is blackmama, clear it to log them out
            const curr = localStorage.getItem('portal_current_user');
            if (curr && curr.toLowerCase() === 'blackmama') {
              localStorage.removeItem('portal_current_user');
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  });

  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('portal_current_user') || null);
  const [showStartScreen, setShowStartScreen] = useState(() => !localStorage.getItem('portal_current_user'));
  
  const [loginTab, setLoginTab] = useState<'login' | 'signup'>('login');
  const [loginUser, setLoginUser] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [signupUser, setSignupUser] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [authError, setAuthError] = useState('');

  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>({
    turnTracker: false,
    worldClock: false,
    campaignOverview: false,
    upNext: false,
    habitStreak: false,
  });

  const toggleWidget = (name: string) => {
    setCollapsedWidgets(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const [recipeFilter, setRecipeFilter] = useState<string>('all');
  const [charSheet, setCharSheet] = useState<Record<string, string>>({});

  const getModStr = (statId: string) => {
    const val = parseInt(charSheet[statId] || '10', 10) || 10;
    const mod = Math.floor((val - 10) / 2);
    return (mod >= 0 ? '+' : '') + mod;
  };

  const handleRecipeFilterChange = (filter: string) => {
    setRecipeFilter(filter);
    (window as any).recipeFilter = filter;
    if (typeof (window as any).renderRecipesGrid === 'function') {
      (window as any).renderRecipesGrid();
    }
  };
  
  // Feedback ideas state (to live-react when trxy6 reads/resolves ideas)
  const [feedbackList, setFeedbackList] = useState<any[]>(() => {
    try {
      const v = localStorage.getItem('global_feedback_ideas');
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });

  const [githubUrl, setGithubUrl] = useState(() => {
    return localStorage.getItem('portal_github_site_url') || 'https://Treydog-ramirez.github.io/dnd-portal/';
  });
  const [qrType, setQrType] = useState<'live' | 'github'>('live');
  const [gameTab, setGameTab] = useState<'war' | 'cosmic'>('war');

  const haptic = (pattern: number | number[]) => {
    if (typeof (window as any).haptic === 'function') {
      (window as any).haptic(pattern);
    }
  };

  const toast = (msg: string, kind?: string) => {
    if (typeof (window as any).toast === 'function') {
      (window as any).toast(msg, kind);
    }
  };

  const [activeSportsLeague, setActiveSportsLeague] = useState<SportsLeague>('mlb');
  const [sportsGames, setSportsGames] = useState<any[]>([]);
  const [sportsSubTab, setSportsSubTab] = useState<'scores' | 'schedule'>('scores');
  const [sportsStatus, setSportsStatus] = useState('Initiating zero-cost feed connection...');
  const [sportsUpdated, setSportsUpdated] = useState('Just Now');
  const [sportsFavorites, setSportsFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sports_favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [sportsFavoriteInput, setSportsFavoriteInput] = useState('');

  // Parlay Tracker States
  const [parlaySlip, setParlaySlip] = useState<ParlayLeg[]>([]);
  const [sportsParlays, setSportsParlays] = useState<Parlay[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sports_parlays') || '[]');
    } catch {
      return [];
    }
  });

  // Home Page Customization States
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('portal_visible_widgets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      diceTray: true,
      quickLaunch: true,
      utilityTiles: true,
      turnTracker: true,
      worldClock: true,
      campaignOverview: true,
      upNext: true,
      oracle: true,
      habitStreak: true,
    };
  });

  // Dashboard Turn Tracker States & Helpers
  const [combatRound, setCombatRound] = useState<number>(4);
  const [activeCombatantIndex, setActiveCombatantIndex] = useState<number>(0);
  const [combatants, setCombatants] = useState<any[]>([
    { name: 'ELARA', class: 'Half-Elf Wizard', hp: 22, maxHp: 25, color: '#13efb0', avatarType: 'wizard' },
    { name: 'THORGRIM', class: 'Dwarf Fighter', hp: 18, maxHp: 20, color: '#10b981', avatarType: 'fighter' },
    { name: 'LYRA', class: 'Human Rogue', hp: 15, maxHp: 18, color: '#fcd34d', avatarType: 'rogue' },
    { name: 'KAEL', class: 'Dragonborn Paladin', hp: 11, maxHp: 15, color: '#f97316', avatarType: 'paladin' },
    { name: 'DM / ENEMIES', class: 'Dungeon Master', hp: 38, maxHp: 50, color: '#a855f7', avatarType: 'dm' }
  ]);

  const handleHpChange = (index: number, delta: number) => {
    setCombatants(prev => {
      return prev.map((c, idx) => {
        if (idx === index) {
          const nextHp = Math.min(Math.max(0, c.hp + delta), c.maxHp);
          return { ...c, hp: nextHp };
        }
        return c;
      });
    });
    haptic(6);
  };

  const handleEndTurn = () => {
    const nextIndex = (activeCombatantIndex + 1) % combatants.length;
    if (nextIndex === 0) {
      setCombatRound(prev => prev + 1);
    }
    setActiveCombatantIndex(nextIndex);
    haptic(15);
  };

  // Dashboard Habit Streak States & Helpers
  const [habitStreak, setHabitStreak] = useState<number>(0);

  useEffect(() => {
    const updateStreak = () => {
      const streak = store.get('habit_streak', 0);
      setHabitStreak(streak);
    };
    updateStreak();
    (window as any).updateHabitDisplays = updateStreak;
    return () => {
      delete (window as any).updateHabitDisplays;
    };
  }, []);

  // Dashboard Oracle States & Helpers
  const [oracleQuery, setOracleQuery] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleAnswer, setOracleAnswer] = useState('');

  // Rift Vision Multi-Scanner states
  const [showRiftVision, setShowRiftVision] = useState(false);
  const [riftVisionMode, setRiftVisionMode] = useState<'notes' | 'betslip' | 'character' | 'dice' | 'calendar' | 'ask'>('notes');
  const [riftVisionImage, setRiftVisionImage] = useState<string | null>(null);
  const [riftVisionScanning, setRiftVisionScanning] = useState(false);
  const [riftVisionResult, setRiftVisionResult] = useState<string | null>(null);
  const [riftCustomQuestion, setRiftCustomQuestion] = useState('');

  const riftVideoRef = useRef<HTMLVideoElement | null>(null);
  const riftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startRiftCamera = async () => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
      } catch (e) {
        console.warn('Environment camera not found, falling back to default camera:', e);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      setCameraStream(stream);
      if (riftVideoRef.current) {
        riftVideoRef.current.srcObject = stream;
        riftVideoRef.current.play().catch(err => console.log('Video play interrupted:', err));
      }
    } catch (err) {
      console.error('Camera connection failed:', err);
      toast('Could not bind live video feed. File upload fallback active.', 'info');
    }
  };

  const stopRiftCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const captureRiftSnapshot = () => {
    if (riftVideoRef.current && riftCanvasRef.current) {
      const video = riftVideoRef.current;
      const canvas = riftCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setRiftVisionImage(base64);
        stopRiftCamera();
        haptic([15, 30]);
      }
    }
  };

  useEffect(() => {
    (window as any).openRiftVision = (mode: 'notes' | 'betslip' | 'character' | 'dice' | 'calendar' | 'ask') => {
      setRiftVisionMode(mode);
      setRiftVisionResult(null);
      setRiftVisionImage(null);
      setRiftCustomQuestion('');
      setShowRiftVision(true);
    };
    return () => {
      delete (window as any).openRiftVision;
    };
  }, []);

  useEffect(() => {
    if (showRiftVision) {
      startRiftCamera();
    } else {
      stopRiftCamera();
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showRiftVision]);

  const handleOracleConsult = () => {
    haptic([15, 30]);
    const q = oracleQuery.trim();
    if (!q) {
      toast('Please state your query inside the oracle box.', 'warn');
      return;
    }

    setOracleLoading(true);
    setOracleAnswer('');
    
    setTimeout(() => {
      const oracleAnswers = [
        "The runes glow brightly: The path ahead is clear. Go for it! ✨",
        "Shadows cloud the future. Patience is key. Wait for a sign. ⏳",
        "By all indications, the celestial alignments favor this option! 👍",
        "Warning: The energies are highly chaotic. Steer clear for now. 🛑",
        "Do not doubt your instinct; the stars reflect absolute success ahead.",
        "A deep silence from the void. Re-evaluate your focus and try again.",
        "Indeed, the flow of your journey points clearly in that direction.",
        "The elements whisper: No, there is a better quest awaiting you."
      ];
      setOracleLoading(false);
      const index = Math.abs(q.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % oracleAnswers.length;
      setOracleAnswer(`"${q}" → ${oracleAnswers[index]}`);
      haptic([100, 50, 100]);
    }, 1200);
  };

  const scanImageWithGemini = async (base64Image: string, mode: string, questionText?: string) => {
    setRiftVisionScanning(true);
    setRiftVisionResult(null);
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          type: mode,
          question: questionText,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'The scan sequence failed.');
      }

      const data = await response.json();
      const rawText = data.text || '';
      setRiftVisionResult(rawText);

      // Programmatically handle different scan modes to update the app state and storage!
      if (mode === 'notes') {
        if ((window as any).addNote) {
          (window as any).addNote(rawText);
          toast('Transcribed notes saved to your archive!');
        }
      } else if (mode === 'betslip') {
        try {
          // Extract JSON array
          const cleanJson = cleanJsonString(rawText);
          const parsedLegs = JSON.parse(cleanJson);
          if (Array.isArray(parsedLegs)) {
            // Let's add each leg to our active parlay slip!
            parsedLegs.forEach((leg: any) => {
              const newLeg: ParlayLeg = {
                id: 'leg-' + Math.random().toString(36).substr(2, 9),
                league: (leg.league || 'nfl') as SportsLeague,
                eventId: 'scanned-event',
                teamId: 'scanned-team-' + Math.random().toString(36).substr(2, 5),
                teamName: leg.teamName || 'Team',
                opponentName: leg.opponentName || 'Opponent',
                matchup: leg.opponentName ? `${leg.teamName} vs ${leg.opponentName}` : leg.teamName,
                pickedAt: new Date().toISOString(),
                status: 'pending'
              };
              setParlaySlip(prev => [...prev, newLeg]);
            });
            toast(`Successfully scanned ${parsedLegs.length} parlay legs into your ticket!`);
          } else {
            throw new Error('Parsed payload was not an array');
          }
        } catch (jsonErr) {
          console.error('[Betslip Parse Error]:', jsonErr);
          toast('Failed to parse bets as structured legs. Check result in viewer.', 'warn');
        }
      } else if (mode === 'character') {
        try {
          const cleanJson = cleanJsonString(rawText);
          const parsed = JSON.parse(cleanJson);
          
          // Let's update the character sheet!
          const currentSheetData = store.get('char_sheet', {});
          const updated = {
            ...currentSheetData,
            'ch-name': parsed.name || currentSheetData['ch-name'] || '',
            'ch-class': parsed.classAndLevel || currentSheetData['ch-class'] || '',
            'ch-ac': parsed.ac !== undefined ? String(parsed.ac) : currentSheetData['ch-ac'] || '',
            'ch-hpcur': parsed.hp !== undefined ? String(parsed.hp) : currentSheetData['ch-hpcur'] || '',
            'ch-hpmax': parsed.maxHp !== undefined ? String(parsed.maxHp) : currentSheetData['ch-hpmax'] || '',
            'st-str': parsed.abilityScores?.STR !== undefined ? String(parsed.abilityScores.STR) : currentSheetData['st-str'] || '',
            'st-dex': parsed.abilityScores?.DEX !== undefined ? String(parsed.abilityScores.DEX) : currentSheetData['st-dex'] || '',
            'st-con': parsed.abilityScores?.CON !== undefined ? String(parsed.abilityScores.CON) : currentSheetData['st-con'] || '',
            'st-int': parsed.abilityScores?.INT !== undefined ? String(parsed.abilityScores.INT) : currentSheetData['st-int'] || '',
            'st-wis': parsed.abilityScores?.WIS !== undefined ? String(parsed.abilityScores.WIS) : currentSheetData['st-wis'] || '',
            'st-cha': parsed.abilityScores?.CHA !== undefined ? String(parsed.abilityScores.CHA) : currentSheetData['st-cha'] || '',
            'ch-equip': Array.isArray(parsed.equipment) ? parsed.equipment.join(', ') : parsed.equipment || currentSheetData['ch-equip'] || '',
            'ch-notes': parsed.notes || currentSheetData['ch-notes'] || '',
          };
          store.set('char_sheet', updated);
          if ((window as any).loadSheet) {
            (window as any).loadSheet();
          }
          toast('Character Sheet updated with scanned values!');
        } catch (jsonErr) {
          console.error('[Character Sheet Parse Error]:', jsonErr);
          toast('Failed to parse sheet stats automatically.', 'warn');
        }
      } else if (mode === 'dice') {
        try {
          const cleanJson = cleanJsonString(rawText);
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed.rolls)) {
            parsed.rolls.forEach((val: any) => {
              if ((window as any).addCustomRoll) {
                (window as any).addCustomRoll('Vision', val);
              }
            });
            toast(`Dice vision logged rolls: ${parsed.rolls.join(', ')} (Total: ${parsed.total})`);
          } else {
            if ((window as any).addCustomRoll && parsed.total) {
              (window as any).addCustomRoll('Vision', parsed.total);
            }
            toast('Logged dice vision total: ' + (parsed.total || 'Result'));
          }
        } catch (jsonErr) {
          console.error('[Dice Vision Parse Error]:', jsonErr);
          toast('Dice logged to history under vision summary.', 'warn');
          if ((window as any).addCustomRoll) {
            (window as any).addCustomRoll('Vision', 'Scan');
          }
        }
      } else if (mode === 'calendar') {
        try {
          const cleanJson = cleanJsonString(rawText);
          const parsed = JSON.parse(cleanJson);
          if (parsed.title) {
            const dateVal = parsed.date || new Date().toISOString().split('T')[0];
            const eventText = `${parsed.title} [${parsed.time || 'All Day'}] at ${parsed.location || 'Unknown'} - ${parsed.description || ''}`;
            if ((window as any).addCalendarEvent) {
              (window as any).addCalendarEvent(dateVal, eventText);
              toast(`Event "${parsed.title}" scheduled for ${dateVal}!`);
            }
          }
        } catch (jsonErr) {
          console.error('[Calendar Scanner Parse Error]:', jsonErr);
          toast('Failed to automatically format calendar event.', 'warn');
        }
      }

    } catch (error: any) {
      console.error('[Scanner Error]:', error);
      toast(error.message || 'The dimensional scanner encountered interference.', 'err');
    } finally {
      setRiftVisionScanning(false);
    }
  };

  const cleanJsonString = (str: string): string => {
    let cleaned = str.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  };

  const toggleWidgetVisibility = (key: string) => {
    setVisibleWidgets(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('portal_visible_widgets', JSON.stringify(next));
      return next;
    });
    haptic(10);
  };

  // Helper functions for Parlay Slip
  const addToParlaySlip = (event: any, competition: any, competitor: any) => {
    const isAlreadyIn = parlaySlip.some(leg => leg.teamId === String(competitor.id));
    if (isAlreadyIn) {
      setParlaySlip(prev => prev.filter(leg => leg.teamId !== String(competitor.id)));
      toast(`Removed ${competitor.team?.shortDisplayName || competitor.team?.displayName} from parlay slip.`);
      return;
    }

    const isGameIn = parlaySlip.some(leg => leg.eventId === String(event.id));
    if (isGameIn) {
      toast("⚠️ You already have a pick from this game in your parlay!");
      return;
    }

    const competitors = competition?.competitors || [];
    const opponent = competitors.find((c: any) => String(c.id) !== String(competitor.id));

    const getCompetitorName = (c: any) => {
      return c?.team?.shortDisplayName || c?.team?.displayName || c?.team?.name || 'Team';
    };

    const teamName = getCompetitorName(competitor);
    const opponentName = getCompetitorName(opponent);
    const matchup = event.shortName || event.name || `${teamName} vs ${opponentName}`;

    const newLeg: ParlayLeg = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      league: activeSportsLeague,
      eventId: String(event.id),
      teamId: String(competitor.id),
      teamName,
      opponentName,
      matchup,
      pickedAt: new Date().toISOString()
    };

    setParlaySlip(prev => [...prev, newLeg]);
    toast(`Added ${teamName} to parlay slip.`);
  };

  const isTeamInSlip = (teamId: any) => {
    return parlaySlip.some(leg => leg.teamId === String(teamId));
  };

  const saveParlay = () => {
    if (parlaySlip.length === 0) {
      toast("⚠️ Your parlay slip is empty! Pick some teams first.");
      return;
    }

    const newParlay: Parlay = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      legs: parlaySlip.map(leg => ({ ...leg, status: leg.status || 'pending' })),
      savedAt: new Date().toISOString(),
      status: 'pending'
    };

    const nextParlays = [newParlay, ...sportsParlays];
    setSportsParlays(nextParlays);
    localStorage.setItem('sports_parlays', JSON.stringify(nextParlays));
    setParlaySlip([]); // Clear slip
    toast("🏆 Parlay successfully saved to tracker!");

    // Evaluate immediately with current scores
    evaluateParlays(sportsGames, activeSportsLeague);
  };

  const clearParlaySlip = () => {
    setParlaySlip([]);
    toast("Cleared all picks from slip.");
  };

  const deleteParlay = (parlayId: string) => {
    const nextParlays = sportsParlays.filter(p => p.id !== parlayId);
    setSportsParlays(nextParlays);
    localStorage.setItem('sports_parlays', JSON.stringify(nextParlays));
    toast("Deleted saved parlay.");
  };

  const evaluateParlays = useCallback((gamesList: any[], league: SportsLeague) => {
    setSportsParlays(prevParlays => {
      let updated = false;
      const nextParlays = prevParlays.map(parlay => {
        let parlayUpdated = false;
        const nextLegs = parlay.legs.map(leg => {
          if (leg.league !== league) return leg;

          const match = gamesList.find(g => String(g.id) === leg.eventId);
          if (!match) return leg;

          const comp = match.competitions?.[0];
          const statusType = comp?.status?.type || match.status?.type || {};
          const state = statusType.state || ''; // 'pre' | 'in' | 'post'
          
          const teamComp = comp?.competitors?.find((c: any) => String(c.id) === leg.teamId);
          const oppComp = comp?.competitors?.find((c: any) => String(c.id) !== leg.teamId);

          let newStatus = leg.status || 'pending';

          if (state === 'post') {
            if (teamComp?.winner) {
              newStatus = 'won';
            } else if (oppComp?.winner) {
              newStatus = 'lost';
            } else {
              const teamScore = parseInt(teamComp?.score || '0', 10);
              const oppScore = parseInt(oppComp?.score || '0', 10);
              if (teamScore > oppScore) {
                newStatus = 'won';
              } else if (oppScore > teamScore) {
                newStatus = 'lost';
              } else if (teamScore === oppScore && teamScore > 0) {
                newStatus = 'push';
              }
            }
          } else if (state === 'in') {
            const teamScore = parseInt(teamComp?.score || '0', 10);
            const oppScore = parseInt(oppComp?.score || '0', 10);
            if (teamScore > oppScore) {
              newStatus = 'leading';
            } else if (oppScore > teamScore) {
              newStatus = 'trailing';
            } else {
              newStatus = 'live';
            }
          } else {
            newStatus = 'pending';
          }

          if (newStatus !== leg.status) {
            parlayUpdated = true;
            return { ...leg, status: newStatus };
          }
          return leg;
        });

        let overallStatus: 'won' | 'lost' | 'live' | 'pending' | 'push' = 'pending';
        const hasLost = nextLegs.some(l => l.status === 'lost');
        const hasLive = nextLegs.some(l => l.status === 'live' || l.status === 'leading' || l.status === 'trailing');
        const hasPending = nextLegs.some(l => l.status === 'pending');
        const allWonOrPush = nextLegs.every(l => l.status === 'won' || l.status === 'push');

        if (hasLost) {
          overallStatus = 'lost';
        } else if (allWonOrPush) {
          overallStatus = 'won';
        } else if (hasLive) {
          overallStatus = 'live';
        } else if (hasPending) {
          overallStatus = 'pending';
        }

        if (parlayUpdated || overallStatus !== parlay.status) {
          updated = true;
          return { ...parlay, legs: nextLegs, status: overallStatus };
        }
        return parlay;
      });

      if (updated) {
        localStorage.setItem('sports_parlays', JSON.stringify(nextParlays));
        return nextParlays;
      }
      return prevParlays;
    });
  }, []);

  const refreshParlays = async () => {
    toast("🔄 Refreshing parlay outcomes across networks...");
    const uniqueLeagues = Array.from(new Set(sportsParlays.flatMap(p => p.legs.map(l => l.league))));
    if (uniqueLeagues.length === 0) {
      await loadSportsScores();
      return;
    }

    for (const league of uniqueLeagues) {
      const config = SPORTS_LEAGUES[league as keyof typeof SPORTS_LEAGUES];
      if (!config) continue;
      try {
        const res = await fetch(config.url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const games = Array.isArray(data?.events) ? data.events : [];
          evaluateParlays(games, league as string);
        }
      } catch (err) {
        console.error(`Failed to refresh league ${league}:`, err);
      }
    }
    toast("✓ Parlays updated with latest public scores.");
  };

  useEffect(() => {
    if (sportsGames.length > 0) {
      evaluateParlays(sportsGames, activeSportsLeague);
    }
  }, [sportsGames, activeSportsLeague, evaluateParlays]);

  function normalizeTeamName(name: string) {
    return String(name || '').trim().toLowerCase();
  }

  function teamMatchesFavorite(competitor: any) {
    const haystack = [
      competitor?.team?.displayName,
      competitor?.team?.shortDisplayName,
      competitor?.team?.name,
      competitor?.team?.location,
      competitor?.team?.abbreviation,
    ]
      .map(normalizeTeamName)
      .join(' ');

    return sportsFavorites.some((fav) => haystack.includes(normalizeTeamName(fav)));
  }

  function getRecord(competitor: any) {
    const records = competitor?.records || [];
    const total = records.find((r: any) => r.type === 'total') || records[0];
    return total?.summary || '';
  }

  function formatSportsDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const loadSportsScores = useCallback(async (league: SportsLeague = activeSportsLeague) => {
    const config = SPORTS_LEAGUES[league];
    setSportsStatus(`Fetching ${config.label} live streams...`);

    try {
      const res = await fetch(config.url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Scoreboard payload unavailable');

      const data = await res.json();
      setSportsGames(Array.isArray(data?.events) ? data.events : []);
      setSportsStatus('Free Live Network Feed Connected');
      setSportsUpdated(
        new Date().toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch {
      setSportsGames([]);
      setSportsUpdated('');
      setSportsStatus('Failed to load public data networks');
    }
  }, [activeSportsLeague]);

  function addSportsFavorite() {
    const value = sportsFavoriteInput.trim();
    if (!value) return;

    const next = sportsFavorites.some(
      (team) => normalizeTeamName(team) === normalizeTeamName(value)
    )
      ? sportsFavorites
      : [...sportsFavorites, value];

    setSportsFavorites(next);
    localStorage.setItem('sports_favorites', JSON.stringify(next));
    setSportsFavoriteInput('');
  }

  function removeSportsFavorite(index: number) {
    const next = sportsFavorites.filter((_, i) => i !== index);
    setSportsFavorites(next);
    localStorage.setItem('sports_favorites', JSON.stringify(next));
  }

  useEffect(() => {
    loadSportsScores(activeSportsLeague);
  }, [activeSportsLeague, loadSportsScores]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptic([20, 30]);
    const uId = loginUser.trim().toLowerCase();
    const pinVal = loginPin.trim();
    if (!uId || !pinVal) {
      setAuthError("⚠️ Please fill in all credentials!");
      return;
    }
    const rawUsers = localStorage.getItem('portal_users');
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    const matched = users.find((u: any) => u.userId === uId);
    if (matched && matched.pin === pinVal) {
      localStorage.setItem('portal_current_user', matched.userId);
      setCurrentUser(matched.userId);
      setAuthError('');
      setShowStartScreen(false);
      window.location.reload(); // Refresh to bind user-specific keys!
    } else {
      setAuthError("⚠️ Credentials invalid or PIN mismatch!");
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptic([20, 30, 50]);
    const uId = signupUser.trim().toLowerCase();
    const pinVal = signupPin.trim();
    if (uId.length < 3) {
      setAuthError("⚠️ User ID must be at least 3 characters!");
      return;
    }
    if (pinVal.length !== 4) {
      setAuthError("⚠️ PIN must be exactly 4 digits!");
      return;
    }
    const rawUsers = localStorage.getItem('portal_users');
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    const alreadyExists = users.some((u: any) => u.userId && u.userId.toLowerCase() === uId.toLowerCase());
    if (alreadyExists) {
      setAuthError("⚠️ User ID already claimed by another Traveler!");
      return;
    }
    const isCreator = (uId === 'trxy6');
    const newUser = { userId: uId, pin: pinVal, isCreator };
    users.push(newUser);
    localStorage.setItem('portal_users', JSON.stringify(users));
    localStorage.setItem('portal_current_user', uId);
    setCurrentUser(uId);
    setAuthError('');
    setShowStartScreen(false);
    window.location.reload(); // Refresh to bind user-specific keys!
  };

  useEffect(() => {
    /* ============ Live clock & date ============ */
    let clockInterval: any = null;
    const timeEl = document.getElementById('headerTime');
    const dateEl = document.getElementById('headerDate');
    function updateClock() {
      const now = new Date();
      let h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const rawH = h;
      h = h % 12;
      if (h === 0) h = 12;

      if (timeEl) {
        timeEl.innerHTML = `${h}:${m} <span class="text-[11px] font-medium text-[#b4aae2] font-sans ml-0.5">${ampm}</span>`;
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).toUpperCase();
      }

      // Live-rotate dial needles for cosmology world clock card
      const hourHand = document.getElementById('worldClockHour');
      const minHand = document.getElementById('worldClockMin');
      const secHand = document.getElementById('worldClockSec');
      if (hourHand) {
        const degH = ((rawH % 12) * 30) + (now.getMinutes() * 0.5);
        hourHand.style.transform = `rotate(${degH}deg)`;
      }
      if (minHand) {
        const degM = now.getMinutes() * 6;
        minHand.style.transform = `rotate(${degM}deg)`;
      }
      if (secHand) {
        const degS = now.getSeconds() * 6;
        secHand.style.transform = `rotate(${degS}deg)`;
      }
    }
    updateClock();
    clockInterval = setInterval(updateClock, 1000);

    /* ============ Floating nav RGB border animation ============ */
    const nav = document.querySelector('nav');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let navSpinFrame: number | null = null;
    if (reduceMotion) {
      if (nav) nav.style.setProperty('--rgb-angle', '0deg');
    } else {
      let angle = 0;
      function spin() {
        angle = (angle + 0.6) % 360;
        if (nav) nav.style.setProperty('--rgb-angle', angle + 'deg');
        navSpinFrame = requestAnimationFrame(spin);
      }
      navSpinFrame = requestAnimationFrame(spin);
    }

    /* ============ Ambient starfield + glitter ============ */
    const canvas = document.getElementById('starfield') as HTMLCanvasElement | null;
    let canvasAnimFrame: number | null = null;
    let starfieldResizeHandler: (() => void) | null = null;
    let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      const sparkleColors = [
        '237,231,246',
        '212,79,230',
        '79,127,230',
        '242,165,216',
        '63,217,199',
      ];
      let stars: any[] = [];
      let flares: any[] = [];
      let meteors: any[] = [];
      let constellationPoints: any[] = [];
      let constellationEdges: any[] = [];

      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        targetX = (e.clientX / window.innerWidth) - 0.5;
        targetY = (e.clientY / window.innerHeight) - 0.5;
      };

      window.addEventListener('mousemove', handleMouseMove);
      mouseMoveHandler = handleMouseMove;

      function spawnMeteor() {
        if (reduceMotion || !canvas) return;
        const startLeft = Math.random() > 0.5;
        meteors.push({
          x: startLeft ? Math.random() * canvas.width * 0.4 : 0,
          y: startLeft ? 0 : Math.random() * canvas.height * 0.4,
          vx: Math.random() * 5 + 4,
          vy: Math.random() * 3.5 + 2.5,
          len: Math.random() * 90 + 50,
          life: 1.0,
          decay: Math.random() * 0.015 + 0.01,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        });
      }

      let lastMeteorTime = 0;

      function buildConstellation() {
        if (!canvas) return;
        const count = Math.max(7, Math.min(14, Math.floor(canvas.width / 60)));
        constellationPoints = Array.from({ length: count }, () => ({
          x: Math.random() * canvas.width,
          y: canvas.height * 0.32 + Math.random() * canvas.height * 0.62,
          phase: Math.random() * Math.PI * 2,
        }));
        constellationEdges = [];
        constellationPoints.forEach((p, i) => {
          const dists = constellationPoints
            .map((q, j) => ({
              j,
              d: i === j ? Infinity : Math.hypot(p.x - q.x, p.y - q.y),
            }))
            .sort((a, b) => a.d - b.d);
          const linkCount = 1 + Math.floor(Math.random() * 2);
          for (let k = 0; k < linkCount; k++) {
            const target = dists[k];
            if (target && target.d < canvas.width * 0.42) {
              const key = [i, target.j].sort().join('-');
              if (!constellationEdges.find((e) => e.key === key)) {
                constellationEdges.push({ key, a: i, b: target.j });
              }
            }
          }
        });
      }

      function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const count = Math.min(
          110,
          Math.floor((canvas.width * canvas.height) / 10000)
        );
        stars = Array.from({ length: count }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.3,
          baseAlpha: Math.random() * 0.5 + 0.15,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.15 + 0.03,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        }));
        buildConstellation();
      }

      function spawnFlare() {
        if (reduceMotion || !canvas) return;
        flares.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 1.2,
          life: 0,
          maxLife: 1200 + Math.random() * 800,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        });
      }

      let lastFlareSpawn = 0;

      function draw(t: number) {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Smoothly interpolate mouse parallax offset
        mouseX += (targetX - mouseX) * 0.06;
        mouseY += (targetY - mouseY) * 0.06;

        const bx = mouseX * 22;
        const by = mouseY * 22;
        const cx = mouseX * 45;
        const cy = mouseY * 45;
        const fx = mouseX * 70;
        const fy = mouseY * 70;

        // Draw majestic premium swirling cosmic portal background
        if (!reduceMotion) {
          const centerX = canvas.width / 2 + mouseX * 35;
          const centerY = canvas.height * 0.45 + mouseY * 35; // centered relative to primary bento/viewport
          const maxDim = Math.max(canvas.width, canvas.height);
          
          ctx.save();
          
          // Outer stellar nebula core glow
          const portalCoreRad = Math.min(canvas.width, canvas.height) * 0.16;
          const centralGlow = ctx.createRadialGradient(
            centerX, centerY, 10,
            centerX, centerY, portalCoreRad * 2.8
          );
          centralGlow.addColorStop(0, 'rgba(12, 5, 28, 0.98)');
          centralGlow.addColorStop(0.2, 'rgba(40, 16, 75, 0.72)');
          centralGlow.addColorStop(0.5, 'rgba(212, 79, 230, 0.16)');
          centralGlow.addColorStop(0.8, 'rgba(79, 127, 230, 0.06)');
          centralGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = centralGlow;
          ctx.beginPath();
          ctx.arc(centerX, centerY, portalCoreRad * 2.8, 0, Math.PI * 2);
          ctx.fill();

          // Swirling cosmic logarithmic spiral arms
          const armCount = 3;
          for (let s = 0; s < armCount; s++) {
            ctx.beginPath();
            const startAngle = (t * 0.00018) + (s * (Math.PI * 2) / armCount);
            const pointsList: {x: number; y: number; alpha: number}[] = [];
            
            for (let r = portalCoreRad * 0.8; r < maxDim * 0.75; r += 7) {
              const theta = startAngle + 1.9 * Math.log(r / (portalCoreRad * 0.8));
              const px = centerX + r * Math.cos(theta);
              const py = centerY + r * Math.sin(theta) * 0.58; // 3D slope flattening
              const alpha = (1.0 - (r / (maxDim * 0.75))) * 0.35;
              pointsList.push({ x: px, y: py, alpha });
            }

            if (pointsList.length > 0) {
              ctx.moveTo(pointsList[0].x, pointsList[0].y);
              for (let pi = 1; pi < pointsList.length; pi++) {
                const pt = pointsList[pi];
                const grad = ctx.createLinearGradient(
                  pointsList[pi-1].x, pointsList[pi-1].y,
                  pt.x, pt.y
                );
                const color = sparkleColors[s % sparkleColors.length];
                grad.addColorStop(0, `rgba(${color}, ${pointsList[pi-1].alpha})`);
                grad.addColorStop(1, `rgba(${color}, ${pt.alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2.4 + Math.sin(t * 0.0035 + pi * 0.2) * 0.8;
                ctx.lineTo(pt.x, pt.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pt.x, pt.y);
              }
            }
          }

          // Sparkling interactive premium orbital pathways
          const rings = 4;
          for (let ri = 0; ri < rings; ri++) {
            const rotSpeed = 0.00014 * (ri % 2 === 0 ? 1 : -1);
            const rotation = t * rotSpeed + (ri * Math.PI / rings);
            const radX = portalCoreRad * 1.4 + ri * 50;
            const radY = radX * 0.38;
            const color = sparkleColors[ri % sparkleColors.length];
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.shadowBlur = 10 + ri * 6;
            ctx.shadowColor = `rgba(${color}, 0.5)`;
            
            // Outer bright vector trail ring
            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${color}, ${0.08 - (ri * 0.015)})`;
            ctx.lineWidth = 12 + ri * 2;
            ctx.stroke();

            // Inner razor cosmic energy thread
            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 - (ri * 0.02)})`;
            ctx.lineWidth = 1.8;
            ctx.stroke();
            
            ctx.restore();
          }
          ctx.restore();
        }

        // Apply slow interactive transition shift to the main nebula element too
        const nebulaEl = document.querySelector('.nebula-layer') as HTMLElement | null;
        if (nebulaEl) {
          nebulaEl.style.setProperty('--mx', `${mouseX * -30}px`);
          nebulaEl.style.setProperty('--my', `${mouseY * -30}px`);
        }

        // Constellation layer
        ctx.lineWidth = 1;
        constellationEdges.forEach((e) => {
          const a = constellationPoints[e.a];
          const b = constellationPoints[e.b];
          if (!a || !b) return;
          ctx.beginPath();
          ctx.moveTo(a.x + cx, a.y + cy);
          ctx.lineTo(b.x + cx, b.y + cy);
          ctx.strokeStyle = 'rgba(180,170,220,0.14)';
          ctx.stroke();
        });

        constellationPoints.forEach((p) => {
          const pulse = reduceMotion
            ? 0.5
            : 0.4 + Math.sin(t * 0.0006 + p.phase) * 0.25;
          ctx.beginPath();
          ctx.arc(p.x + cx, p.y + cy, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(220,210,255,' + pulse + ')';
          ctx.fill();
        });

        // Stars layer
        stars.forEach((s) => {
          const twinkle = reduceMotion
            ? s.baseAlpha
            : s.baseAlpha + Math.sin(t * 0.001 * s.speed * 10 + s.phase) * 0.2;
          ctx.beginPath();
          ctx.arc(s.x + bx, s.y + by, s.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + s.color + ',' + Math.max(0, twinkle) + ')';
          ctx.fill();
        });

        // Flares layer
        if (!reduceMotion) {
          if (t - lastFlareSpawn > 900 && flares.length < 12) {
            spawnFlare();
            lastFlareSpawn = t;
          }
          flares = flares.filter((f) => f.life < f.maxLife);
          flares.forEach((f) => {
            f.life += 16;
            const progress = f.life / f.maxLife;
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            const r = f.r * (1 + progress * 0.6);
            ctx.beginPath();
            const grad = ctx.createRadialGradient(
              f.x + fx,
              f.y + fy,
              0,
              f.x + fx,
              f.y + fy,
              r * 4
            );
            grad.addColorStop(0, 'rgba(' + f.color + ',' + alpha * 0.9 + ')');
            grad.addColorStop(1, 'rgba(' + f.color + ',0)');
            ctx.fillStyle = grad;
            ctx.arc(f.x + fx, f.y + fy, r * 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(f.x + fx, f.y + fy, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
            ctx.fill();
          });

          // Meteors / Shooting Stars
          if (t - lastMeteorTime > 4500 + Math.random() * 6000) {
            spawnMeteor();
            lastMeteorTime = t;
          }
          meteors = meteors.filter((m) => m.life > 0);
          meteors.forEach((m) => {
            m.x += m.vx;
            m.y += m.vy;
            m.life -= m.decay;
            if (m.life > 0) {
              ctx.beginPath();
              const grad = ctx.createLinearGradient(
                m.x - m.vx * m.len * 0.12,
                m.y - m.vy * m.len * 0.12,
                m.x,
                m.y
              );
              grad.addColorStop(0, 'rgba(' + m.color + ',0)');
              grad.addColorStop(1, 'rgba(' + m.color + ',' + m.life * 0.85 + ')');
              ctx.strokeStyle = grad;
              ctx.lineWidth = 1.6;
              ctx.moveTo(m.x - m.vx * m.len * 0.12, m.y - m.vy * m.len * 0.12);
              ctx.lineTo(m.x, m.y);
              ctx.stroke();

              // Cute glow sparkle at the meteor head
              ctx.beginPath();
              ctx.arc(m.x, m.y, 1.2, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255, 255, 255, ' + m.life + ')';
              ctx.fill();
            }
          });
        }
        canvasAnimFrame = requestAnimationFrame(draw);
      }

      window.addEventListener('resize', resize);
      starfieldResizeHandler = resize;
      resize();
      canvasAnimFrame = requestAnimationFrame(draw);
    }

    /* ============ Storage helpers ============ */
    const store = {
      get(key: string, fallback: any) {
        try {
          const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
          const isGlobal = (key === 'portal_users' || key === 'global_feedback_ideas' || key === 'portal_current_user');
          const finalKey = isGlobal ? key : `${loggedInUser}_${key}`;
          const v = localStorage.getItem(finalKey);
          return v ? JSON.parse(v) : fallback;
        } catch (e) {
          return fallback;
        }
      },
      set(key: string, val: any) {
        try {
          const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
          const isGlobal = (key === 'portal_users' || key === 'global_feedback_ideas' || key === 'portal_current_user');
          const finalKey = isGlobal ? key : `${loggedInUser}_${key}`;
          localStorage.setItem(finalKey, JSON.stringify(val));
          return true;
        } catch (e) {
          return false;
        }
      },
    };

    /* ============ Toast feedback ============ */
    function toast(msg: string, kind?: string) {
      const host = document.getElementById('toastHost');
      if (!host) return;
      const el = document.createElement('div');
      el.className = 'toast' + (kind === 'warn' ? ' warn' : '');
      el.innerHTML = '<span class="dot"></span><span>' + msg + '</span>';
      host.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
    (window as any).toast = toast;

    /* ============ Tab navigation ============ */
    const PANEL_ORDER = [
      'home',
      'roll',
      'notes',
      'sheet',
      'calc',
      'tasks',
      'clock',
      'sports',
      'calendar',
      'recipes',
      'game',
      'companion',
      'settings',
    ];

    function switchToPanel(name: string, opts?: any) {
      opts = opts || {};
      const activePanel = document.querySelector('.panel.active');
      const current = activePanel ? activePanel.id.replace('panel-', '') : '';
      if (current === name) return;

      // Keep track of last sub-panels visited
      if (['roll', 'sheet', 'recipes', 'game'].includes(name)) {
        (window as any).lastAdventurePanel = name;
      }
      if (['calc', 'notes', 'calendar', 'clock', 'tasks', 'sports'].includes(name)) {
        (window as any).lastUtilitiesPanel = name;
      }

      const parentTabMap: any = {
        roll: 'adventure',
        sheet: 'adventure',
        recipes: 'adventure',
        game: 'adventure',
        calc: 'utilities',
        notes: 'utilities',
        calendar: 'utilities',
        clock: 'utilities',
        tasks: 'utilities',
        sports: 'utilities',
        home: 'home',
        companion: 'companion',
        settings: 'settings'
      };
      const parentTab = parentTabMap[name] || name;

      document.querySelectorAll('nav button').forEach((b: any) => {
        b.classList.toggle('active', b.dataset.panel === parentTab);
      });

      // Update active state of sub-navigation buttons
      document.querySelectorAll('.sub-nav-btn').forEach((btn: any) => {
        btn.classList.toggle('active', btn.dataset.subPanel === name);
      });

      const fromIdx = PANEL_ORDER.indexOf(current);
      const toIdx = PANEL_ORDER.indexOf(name);
      const dir = opts.dir || (toIdx > fromIdx ? 'left' : 'right');

      document.querySelectorAll('.panel').forEach((p) => {
        p.classList.remove('active', 'slide-in-left', 'slide-in-right');
      });

      const target = document.getElementById('panel-' + name);
      if (target) {
        target.classList.add(
          'active',
          dir === 'left' ? 'slide-in-left' : 'slide-in-right'
        );
      }
      if (name === 'companion') {
        if ((window as any).populateCompanionAttachDrawerLists) {
          (window as any).populateCompanionAttachDrawerLists();
        }
        if ((window as any).updateActiveAttachmentsBar) {
          (window as any).updateActiveAttachmentsBar();
        }
        if ((window as any).renderCompanionMessages) {
          (window as any).renderCompanionMessages();
        }
      }
      if (!opts.silent) haptic(9);
    }
    (window as any).switchToPanel = switchToPanel;

    (window as any).lastAdventurePanel = (window as any).lastAdventurePanel || 'roll';
    (window as any).lastUtilitiesPanel = (window as any).lastUtilitiesPanel || 'notes';

    document.querySelectorAll('nav button').forEach((btn: any) => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.panel;
        if (p === 'adventure') {
          switchToPanel((window as any).lastAdventurePanel || 'roll');
        } else if (p === 'utilities') {
          switchToPanel((window as any).lastUtilitiesPanel || 'notes');
        } else {
          switchToPanel(p);
        }
      });
    });

    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => switchToPanel('home'));
    }

    document.querySelectorAll('.dash-tile').forEach((tile: any) => {
      tile.addEventListener('click', () => {
        switchToPanel(tile.dataset.panel);
        haptic(10);
      });
    });

    /* ============ Swipe between panels ============ */
    const mainEl = document.querySelector('main');
    let startX = 0,
      startY = 0,
      tracking = false;
    const THRESHOLD = 55;
    const MAX_VERTICAL = 60;

    if (mainEl) {
      mainEl.addEventListener(
        'touchstart',
        (e: TouchEvent) => {
          if (e.touches.length !== 1) return;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          tracking = true;
        },
        { passive: true }
      );

      mainEl.addEventListener(
        'touchend',
        (e: TouchEvent) => {
          if (!tracking) return;
          tracking = false;
          const endX = e.changedTouches[0].clientX;
          const endY = e.changedTouches[0].clientY;
          const dx = endX - startX;
          const dy = endY - startY;
          if (Math.abs(dy) > MAX_VERTICAL) return;
          if (Math.abs(dx) < THRESHOLD) return;

          const activePanel = document.querySelector('.panel.active');
          const current = activePanel ? activePanel.id.replace('panel-', '') : '';
          const idx = PANEL_ORDER.indexOf(current);
          if (dx < 0 && idx < PANEL_ORDER.length - 1) {
            switchToPanel(PANEL_ORDER[idx + 1], { dir: 'left' });
          } else if (dx > 0 && idx > 0) {
            switchToPanel(PANEL_ORDER[idx - 1], { dir: 'right' });
          }
        },
        { passive: true }
      );
    }

    /* ============ DICE ROLLER ============ */
    const DICE = [2, 4, 6, 8, 10, 12, 20, 100];
    let selectedDie = 20;
    const dieGrid = document.getElementById('dieGrid');

    if (dieGrid) {
      dieGrid.innerHTML = '';
      DICE.forEach((d) => {
        const b = document.createElement('button');
        b.className = 'die-btn shiny' + (d === 20 ? ' active' : '');
        b.textContent = d === 2 ? 'coin' : 'd' + d;
        b.dataset.die = String(d);
        b.addEventListener('click', () => {
          selectedDie = d;
          document.querySelectorAll('.die-btn').forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          const rollSubEl = document.getElementById('rollSub');
          if (rollSubEl) {
            rollSubEl.textContent = d === 2 ? 'coin flip selected' : 'd' + d + ' selected';
          }
          haptic(10);
        });
        dieGrid.appendChild(b);
      });
    }

    function secureRandomInt(max: number): number {
      const range = max;
      const maxUint32 = 0xffffffff;
      const limit = Math.floor((maxUint32 + 1) / range) * range;
      let x;
      const buf = new Uint32Array(1);
      do {
        crypto.getRandomValues(buf);
        x = buf[0];
      } while (x >= limit);
      return (x % range) + 1;
    }

    let rollHistory = store.get('roll_history', []);
    function renderHistory() {
      const row = document.getElementById('historyRow');
      if (row) {
        row.innerHTML = '';
        rollHistory.slice(0, 8).forEach((h: any) => {
          const chip = document.createElement('div');
          chip.className = 'history-chip';
          let label, result;
          if (h.die === 2 || h.die === '2' || h.die === 'coin') {
            label = 'coin';
            result = (h.result === 1 || h.result === '1' || h.result === 'Heads') ? 'Heads' : 'Tails';
          } else {
            label = typeof h.die === 'number' ? 'd' + h.die : h.die;
            result = h.result;
          }
          chip.innerHTML =
            '<span class="die-label">' +
            label +
            '</span><span class="die-result">' +
            result +
            '</span>';
          row.appendChild(chip);
        });
      }

      const dashboardRow = document.getElementById('dashboardHistoryRow');
      if (dashboardRow) {
        dashboardRow.innerHTML = '';
        rollHistory.slice(0, 5).forEach((h: any) => {
          const item = document.createElement('div');
          item.className = 'flex justify-between items-center text-[12px] border-b border-[#2e2454]/45 pb-1.5 pt-1 last:border-b-0 text-[#b4aae2] font-mono';
          let label, result;
          if (h.die === 2 || h.die === '2' || h.die === 'coin') {
            label = 'coin';
            result = (h.result === 1 || h.result === '1' || h.result === 'Heads') ? 'Heads' : 'Tails';
          } else {
            label = 'd' + h.die;
            result = h.result;
          }
          item.innerHTML = `
            <span class="text-[#8b7ac4] font-medium">${label}</span>
            <span class="text-[#cf4fe6] font-semibold text-[13px]">${result}</span>
          `;
          dashboardRow.appendChild(item);
        });
        if (rollHistory.length === 0) {
          dashboardRow.innerHTML = '<div class="text-[11px] text-[#8b7ac4]/50 italic py-3 text-center">No recent rolls</div>';
        }
      }
    }
    renderHistory();

    /* ============ Haptics ============ */
    let audioCtx: any = null;

    function playHapticTickSound() {
      try {
        audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        // A crisp, warm triangle pulse that replicates a premium mechanical tap feel
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.024);
        
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.024);
        
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.024);
      } catch (e) {
        /* audio fallback not supported or disabled */
      }
    }

    function hapticRaw(pattern: any) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          const success = navigator.vibrate(pattern);
          if (success) return;
        } catch (e) {
          /* no-op */
        }
      }
      
      // Safari/iOS web vibration fallback: Play a micro acoustic dynamic tick
      try {
        if (Array.isArray(pattern)) {
          let currentDelay = 0;
          pattern.forEach((p, idx) => {
            if (idx % 2 === 0) {
              setTimeout(() => {
                playHapticTickSound();
              }, currentDelay);
            }
            currentDelay += p;
          });
        } else {
          playHapticTickSound();
        }
      } catch (e) {
        /* audio play block / fallback failed */
      }
    }

    function haptic(pattern: any) {
      if (!settings || settings.haptics !== false) {
        hapticRaw(pattern);
      }
    }
    (window as any).haptic = haptic;

    function formatRollFace(die: any, n: number) {
      const d = Number(die);
      if (d === 2) return n === 1 ? 'Heads' : 'Tails';
      return String(n);
    }

    let activeRollInterval: any = null;
    function animateRoll(die: number, finalResult: number, durationMs: number) {
      const els = document.querySelectorAll('.roll-result-val, #rollResult');
      const stages = document.querySelectorAll('.roll-stage, .dice-tray-card');
      if (els.length === 0) return;

      els.forEach(el => {
        el.classList.remove('crit-hi', 'crit-lo', 'landed');
        if (die === 2) el.classList.add('coin-face');
        else el.classList.remove('coin-face');
      });
      stages.forEach(stage => stage.classList.remove('flash-hi', 'flash-lo'));

      const start = Date.now();
      if (activeRollInterval) {
        cancelAnimationFrame(activeRollInterval);
        clearTimeout(activeRollInterval);
      }

      let currentDelay = 25;

      function tick() {
        const elapsed = Date.now() - start;
        if (elapsed >= durationMs) {
          const finalTxt = formatRollFace(die, finalResult);
          els.forEach(el => {
            el.textContent = finalTxt;
            el.classList.add('landed');
            if (die === 20 && finalResult === 20) {
              el.classList.add('crit-hi');
            } else if (die === 20 && finalResult === 1) {
              el.classList.add('crit-lo');
            }
          });

          if (die === 20 && finalResult === 20) {
            stages.forEach(stage => stage.classList.add('flash-hi'));
            setTimeout(() => stages.forEach(stage => stage.classList.remove('flash-hi')), 900);
            haptic([30, 40, 30, 40, 80]);
            playLandTone('hi');
          } else if (die === 20 && finalResult === 1) {
            stages.forEach(stage => stage.classList.add('flash-lo'));
            setTimeout(() => stages.forEach(stage => stage.classList.remove('flash-lo')), 600);
            haptic([80]);
            playLandTone('lo');
          } else {
            haptic([35]);
            playLandTone('normal');
          }
          return;
        }

        haptic(6);

        const tickTxt = formatRollFace(
          die,
          Math.floor(Math.random() * die) + 1
        );
        els.forEach(el => {
          el.textContent = tickTxt;
        });

        // Exponential increase in delay to feel like the die is losing momentum!
        // Start fast (25ms) and slow down up to about 180ms per tick at the very end
        const progress = elapsed / durationMs;
        currentDelay = 25 + Math.pow(progress, 2.5) * 150;

        activeRollInterval = setTimeout(tick, currentDelay);
      }

      activeRollInterval = setTimeout(tick, currentDelay);
    }

    function doRoll(die: number, customLabel?: string) {
      const result = secureRandomInt(die);
      animateRoll(die, result, 750);
      const subs = document.querySelectorAll('.roll-sub-text, #rollSub');
      const textVal = customLabel || (die === 2 ? 'coin flip result' : 'd' + die + ' result');
      subs.forEach(sub => {
        sub.textContent = textVal;
      });
      rollHistory.unshift({ die, result, t: Date.now() });
      rollHistory = rollHistory.slice(0, 30);
      store.set('roll_history', rollHistory);
      renderHistory();
    }

    (window as any).doRoll = doRoll;
    (window as any).switchToPanel = switchToPanel;
    (window as any).setSelectedDie = (die: number) => {
      selectedDie = die;
    };

    const rollBtn = document.getElementById('rollBtn');
    if (rollBtn) {
      rollBtn.addEventListener('click', () => doRoll(selectedDie));
    }

    const dashboardRollBtnMain = document.getElementById('dashboardRollBtnMain');
    if (dashboardRollBtnMain) {
      dashboardRollBtnMain.addEventListener('click', () => doRoll(2));
    }

    // Interactive turn-tracker rotation listener and HP adjuster
    let activeTurnIndex = 0;
    let currentRound = 4;
    const roundCountVal = document.getElementById('roundCountVal');
    const roundBtnMinus = document.getElementById('roundBtnMinus');
    const roundBtnPlus = document.getElementById('roundBtnPlus');

    const updateRoundUI = () => {
      if (roundCountVal) {
        roundCountVal.textContent = `ROUND ${currentRound}`;
      }
    };

    if (roundBtnMinus) {
      roundBtnMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentRound > 1) {
          currentRound--;
          updateRoundUI();
          haptic(8);
        }
      });
    }

    if (roundBtnPlus) {
      roundBtnPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        currentRound++;
        updateRoundUI();
        haptic(8);
      });
    }

    const updateTurnTrackerVisuals = () => {
      const rows = document.querySelectorAll('.combatant-row');
      rows.forEach((row, idx) => {
        const indicator = row.querySelector('.active-dot');
        const isCurrent = idx === activeTurnIndex;
        
        // Handle active highlighting
        if (isCurrent) {
          row.classList.add('border-[#cf4fe6]/90', 'bg-[#211442]/55', 'shadow-[0_0_12px_rgba(207,79,230,0.2)]');
          row.classList.remove('border-[#44387a]/30', 'bg-transparent');
          if (indicator) indicator.classList.remove('opacity-0');
        } else {
          row.classList.remove('border-[#cf4fe6]/90', 'bg-[#211442]/55', 'shadow-[0_0_12px_rgba(207,79,230,0.2)]');
          row.classList.add('border-[#44387a]/30', 'bg-transparent');
          if (indicator) indicator.classList.add('opacity-0');
        }

        // Downed effect check
        const rawHp = row.getAttribute('data-hp');
        const hp = rawHp ? parseInt(rawHp) : 0;
        const nameSpan = row.querySelector('.comb-name');
        if (hp <= 0) {
          row.classList.add('opacity-40');
          if (nameSpan) {
            nameSpan.classList.add('line-through', 'text-red-500/80');
          }
        } else {
          row.classList.remove('opacity-40');
          if (nameSpan) {
            nameSpan.classList.remove('line-through', 'text-red-500/80');
          }
        }
      });
    };

    // Set first row active initially!
    setTimeout(() => {
      updateTurnTrackerVisuals();
    }, 50);

    // Click handler for entire rows to tap-to-activate
    const setupTurnRowClickHandlers = () => {
      const rows = document.querySelectorAll('.combatant-row');
      rows.forEach((row) => {
        row.addEventListener('click', (e) => {
          // If clicked target is a button or input or within it, don't change turn active index
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input')) {
            return;
          }
          const rawIdx = row.getAttribute('data-idx');
          if (rawIdx !== null) {
            activeTurnIndex = parseInt(rawIdx);
            updateTurnTrackerVisuals();
            haptic(12);
          }
        });

        // Add HP minus/plus click listeners
        const minusBtn = row.querySelector('.hp-minus');
        const plusBtn = row.querySelector('.hp-plus');
        const hpText = row.querySelector('.hp-text') as HTMLElement | null;
        const hpBar = row.querySelector('.hp-bar') as HTMLElement | null;

        if (minusBtn) {
          minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rawHp = row.getAttribute('data-hp');
            const rawMax = row.getAttribute('data-max');
            if (rawHp && rawMax) {
              let hp = parseInt(rawHp);
              const max = parseInt(rawMax);
              if (hp > 0) {
                hp--;
                row.setAttribute('data-hp', hp.toString());
                if (hpText) hpText.textContent = hp.toString();
                if (hpBar) {
                  hpBar.style.width = `${Math.round((hp / max) * 100)}%`;
                }
                updateTurnTrackerVisuals(); // refresh downed status style
                haptic(5);
              }
            }
          });
        }

        if (plusBtn) {
          plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rawHp = row.getAttribute('data-hp');
            const rawMax = row.getAttribute('data-max');
            if (rawHp && rawMax) {
              let hp = parseInt(rawHp);
              const max = parseInt(rawMax);
              if (hp < max) {
                hp++;
                row.setAttribute('data-hp', hp.toString());
                if (hpText) hpText.textContent = hp.toString();
                if (hpBar) {
                  hpBar.style.width = `${Math.round((hp / max) * 100)}%`;
                }
                updateTurnTrackerVisuals(); // refresh downed status style
                haptic(5);
              }
            }
          });
        }
      });
    };

    setTimeout(() => {
      setupTurnRowClickHandlers();
    }, 100);

    const dashboardEndTurnBtn = document.getElementById('dashboardEndTurnBtn');
    if (dashboardEndTurnBtn) {
      dashboardEndTurnBtn.addEventListener('click', () => {
        const rows = document.querySelectorAll('.combatant-row');
        if (rows.length === 0) return;
        
        // Find next live / downed-friendly index
        const nextIndex = (activeTurnIndex + 1) % rows.length;
        
        // If wrapping completed a full turn around back to index 0, auto-advance round counter!
        if (nextIndex === 0) {
          currentRound++;
          updateRoundUI();
        }
        
        activeTurnIndex = nextIndex;
        updateTurnTrackerVisuals();
        haptic(15);
      });
    }

    const clearHistory = document.getElementById('clearHistory');
    if (clearHistory) {
      clearHistory.addEventListener('click', () => {
        rollHistory = [];
        store.set('roll_history', rollHistory);
        renderHistory();
        toast('History cleared');
      });
    }

    const customRollBtn = document.getElementById('customRollBtn');
    if (customRollBtn) {
      customRollBtn.addEventListener('click', () => {
        const customDieInput = document.getElementById('customDie') as HTMLInputElement | null;
        if (!customDieInput) return;
        const raw = customDieInput.value.trim().toLowerCase();
        if (!raw) return;
        const match = raw.match(/^(\d*)d(\d+)([+-]\d+)?$/);
        const el = document.getElementById('rollResult');
        const sub = document.getElementById('rollSub');
        if (!el || !sub) return;

        el.classList.remove('crit-hi', 'crit-lo');

        if (match) {
          const n = parseInt(match[1] || '1', 10);
          const sides = parseInt(match[2], 10);
          const mod = match[3] ? parseInt(match[3], 10) : 0;
          if (n > 100 || sides > 1000) {
            sub.textContent = 'keep it reasonable';
            return;
          }
          let total = 0;
          const rolls: number[] = [];
          for (let i = 0; i < n; i++) {
            const r = secureRandomInt(sides);
            rolls.push(r);
            total += r;
          }
          total += mod;
          let frame = 0;
          const maxFrames = 18;
          const iv = setInterval(() => {
            frame++;
            if (frame >= maxFrames) {
              clearInterval(iv);
              el.textContent = String(total);
              el.classList.remove('landed');
              void el.offsetWidth;
              el.classList.add('landed');
              sub.textContent =
                raw +
                ' → [' +
                rolls.join(', ') +
                ']' +
                (mod ? (mod > 0 ? ' +' : ' ') + mod : '');
              haptic([35]);
              playLandTone('normal');
            } else {
              el.textContent = String(
                Math.floor(Math.random() * (sides * n + Math.abs(mod) + 1))
              );
              haptic(8);
            }
          }, 25);
          rollHistory.unshift({ die: raw, result: total, t: Date.now() });
          rollHistory = rollHistory.slice(0, 30);
          store.set('roll_history', rollHistory);
          renderHistory();
        } else {
          sub.textContent = 'format: 3d6+2 or 2d10';
        }
      });
    }

    /* ============ NOTES ============ */
    let notesArr = store.get('notes', []);
    function renderNotes() {
      const list = document.getElementById('notesList');
      if (!list) return;
      list.innerHTML = '';
      if (notesArr.length === 0) {
        list.innerHTML =
          '<div class="empty-state"><span class="text-3xl filter saturate-50 select-none">🪶</span>The page is blank — write your first note</div>';
        return;
      }
      notesArr.forEach((note: any, idx: number) => {
        const item = document.createElement('div');
        item.className = 'note-item';
        const date = new Date(note.t).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        item.innerHTML = `
          <textarea data-idx="${idx}" placeholder="write something...">${note.text}</textarea>
          <div class="note-meta">
            <span>${date}</span>
            <span class="icon-btn" data-del="${idx}">delete</span>
          </div>
        `;
        list.appendChild(item);
      });

      list.querySelectorAll('textarea').forEach((ta: any) => {
        ta.addEventListener('input', () => {
          notesArr[ta.dataset.idx].text = ta.value;
          store.set('notes', notesArr);
        });
      });

      list.querySelectorAll('[data-del]').forEach((d: any) => {
        d.addEventListener('click', () => {
          notesArr.splice(parseInt(d.dataset.del, 10), 1);
          store.set('notes', notesArr);
          renderNotes();
          toast('Note deleted', 'warn');
        });
      });
    }
    renderNotes();

    const addNoteBtn = document.getElementById('addNoteBtn');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        notesArr.unshift({ text: '', t: Date.now() });
        store.set('notes', notesArr);
        renderNotes();
        const first = document.querySelector('#notesList textarea') as HTMLTextAreaElement | null;
        if (first) first.focus();
      });
    }

    /* ============ CHARACTER SHEET ============ */
    const sheetFields = [
      'ch-name',
      'ch-class',
      'ch-species',
      'ch-background',
      'st-str',
      'st-dex',
      'st-con',
      'st-int',
      'st-wis',
      'st-cha',
      'ch-hpcur',
      'ch-hpmax',
      'ch-ac',
      'ch-init',
      'ch-speed',
      'ch-prof',
      'ch-equip',
    ];

    function loadSheet() {
      const data = store.get('char_sheet', {});
      sheetFields.forEach((id) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el && data[id] !== undefined) el.value = data[id];
      });
      setCharSheet(data);
      updateMods();
    }

    let sheetStatusTimer: any = null;
    function saveSheet() {
      const data: any = {};
      sheetFields.forEach((id) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el) data[id] = el.value;
      });
      store.set('char_sheet', data);
      setCharSheet(data);
      const status = document.getElementById('sheetSaveStatus');
      if (status) {
        status.textContent = 'saved';
        clearTimeout(sheetStatusTimer);
        sheetStatusTimer = setTimeout(() => {
          status.textContent = '';
        }, 1200);
      }
    }

    function updateMods() {
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((stat) => {
        const el = document.getElementById('st-' + stat) as HTMLInputElement | null;
        const val = el ? parseInt(el.value, 10) || 10 : 10;
        const mod = Math.floor((val - 10) / 2);
        const modEl = document.getElementById('mod-' + stat);
        if (modEl) modEl.textContent = (mod >= 0 ? '+' : '') + mod;
      });
    }

    sheetFields.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          updateMods();
          saveSheet();
        });
      }
    });
    loadSheet();

    const exportSheet = document.getElementById('exportSheet');
    if (exportSheet) {
      exportSheet.addEventListener('click', () => {
        const data = store.get('char_sheet', {});
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (data['ch-name'] || 'character') + '-sheet.json';
        a.click();
        URL.revokeObjectURL(url);
        toast('Sheet exported');
      });
    }

    const importSheetBtn = document.getElementById('importSheetBtn');
    const importSheetFile = document.getElementById('importSheetFile') as HTMLInputElement | null;
    if (importSheetBtn && importSheetFile) {
      importSheetBtn.addEventListener('click', () => {
        importSheetFile.click();
      });

      importSheetFile.addEventListener('change', (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result as string);
            store.set('char_sheet', data);
            loadSheet();
            toast('Sheet imported');
          } catch (err) {
            toast('Could not read that file', 'warn');
          }
        };
        reader.readAsText(file);
      });
    }

    /* ============ CALCULATOR ============ */
    document.querySelectorAll('#panel-calc > .card > .calc-tabs > .calc-tab').forEach((tab: any) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#panel-calc > .card > .calc-tabs > .calc-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.calc-sub').forEach((s) => s.classList.remove('active'));
        tab.classList.add('active');
        const calcSubEl = document.getElementById('calc-' + tab.dataset.calc);
        if (calcSubEl) calcSubEl.classList.add('active');
      });
    });

    // Basic calculator
    const calcKeysLayout = [
      'C',
      '±',
      '%',
      '÷',
      '7',
      '8',
      '9',
      '×',
      '4',
      '5',
      '6',
      '-',
      '1',
      '2',
      '3',
      '+',
      '0',
      '.',
      '⌫',
      '=',
    ];
    let calcExpr = '';

    function handleCalcKey(k: string) {
      const display = document.getElementById('calcDisplay');
      if (!display) return;
      if (k === 'C') {
        calcExpr = '';
        display.textContent = '0';
        return;
      }
      if (k === '⌫') {
        if (calcExpr.endsWith(' ')) {
          calcExpr = calcExpr.slice(0, -3);
        } else {
          calcExpr = calcExpr.slice(0, -1);
        }
        display.textContent = calcExpr || '0';
        return;
      }
      if (k === '±') {
        if (calcExpr.startsWith('-')) calcExpr = calcExpr.slice(1);
        else calcExpr = '-' + calcExpr;
        display.textContent = calcExpr || '0';
        return;
      }
      if (k === '=') {
        try {
          let safe = calcExpr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/%/g, '/100');
          if (!/^[0-9+\-*/.() ]+$/.test(safe)) throw new Error('bad');
          const result = Function('"use strict"; return (' + safe + ')')();
          calcExpr = String(Math.round(result * 1e8) / 1e8);
          display.textContent = calcExpr;
        } catch (e) {
          display.textContent = 'error';
          calcExpr = '';
        }
        return;
      }
      if (['+', '-', '×', '÷'].includes(k)) {
        if (calcExpr.endsWith(' ')) {
          calcExpr = calcExpr.slice(0, -3) + ` ${k} `;
        } else if (calcExpr !== '') {
          calcExpr += ` ${k} `;
        }
      } else {
        calcExpr += k;
      }
      display.textContent = calcExpr || '0';
    }

    (window as any).handleCalcKey = handleCalcKey;

    // Tip calculator
    function updateTip() {
      const tipBillInput = document.getElementById('tipBill') as HTMLInputElement | null;
      const tipPctInput = document.getElementById('tipPct') as HTMLInputElement | null;
      const tipSplitInput = document.getElementById('tipSplit') as HTMLInputElement | null;

      const bill = tipBillInput ? parseFloat(tipBillInput.value) || 0 : 0;
      const pct = tipPctInput ? parseInt(tipPctInput.value, 10) : 18;
      const split = tipSplitInput
        ? Math.max(1, parseInt(tipSplitInput.value, 10) || 1)
        : 1;

      const tipPctLabel = document.getElementById('tipPctLabel');
      if (tipPctLabel) tipPctLabel.textContent = String(pct);

      const tipAmt = bill * (pct / 100);
      const total = bill + tipAmt;

      const tipAmountEl = document.getElementById('tipAmount');
      const tipTotalEl = document.getElementById('tipTotal');
      const tipPerPersonEl = document.getElementById('tipPerPerson');
      const tipPerPersonNoTipEl = document.getElementById('tipPerPersonNoTip');

      if (tipAmountEl) tipAmountEl.textContent = '$' + tipAmt.toFixed(2);
      if (tipTotalEl) tipTotalEl.textContent = '$' + total.toFixed(2);
      if (tipPerPersonEl) tipPerPersonEl.textContent = '$' + (total / split).toFixed(2);
      if (tipPerPersonNoTipEl) tipPerPersonNoTipEl.textContent = '$' + (bill / split).toFixed(2);
    }

    ['tipBill', 'tipPct', 'tipSplit'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateTip);
    });
    updateTip();

    // Unit converter
    const UNITS: any = {
      length: {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        mi: 1609.34,
        yd: 0.9144,
        ft: 0.3048,
        in: 0.0254,
      },
      weight: {
        kg: 1,
        g: 0.001,
        lb: 0.453592,
        oz: 0.0283495,
        st: 6.35029,
        ton: 907.185,
      },
      cooking: {
        ml: 1,
        tsp: 4.92892,
        tbsp: 14.7868,
        cup: 240,
        oz: 29.5735,
        pint: 473.176,
        quart: 946.353,
        liter: 1000
      }
    };
    let currentConv = 'length';

    function populateConvSelects() {
      const fromSel = document.getElementById('convFrom') as HTMLSelectElement | null;
      const toSel = document.getElementById('convTo') as HTMLSelectElement | null;
      if (!fromSel || !toSel) return;
      fromSel.innerHTML = '';
      toSel.innerHTML = '';
      if (currentConv === 'temp') {
        ['C', 'F', 'K'].forEach((u) => {
          fromSel.innerHTML += `<option value="${u}">${u}</option>`;
          toSel.innerHTML += `<option value="${u}">${u}</option>`;
        });
        toSel.value = 'F';
      } else {
        Object.keys(UNITS[currentConv]).forEach((u) => {
          fromSel.innerHTML += `<option value="${u}">${u}</option>`;
          toSel.innerHTML += `<option value="${u}">${u}</option>`;
        });
        toSel.selectedIndex = 1;
      }
      doConvert();
    }

    function tempConvert(val: number, from: string, to: string) {
      let c;
      if (from === 'C') c = val;
      else if (from === 'F') c = ((val - 32) * 5) / 9;
      else c = val - 273.15;

      if (to === 'C') return c;
      if (to === 'F') return (c * 9) / 5 + 32;
      return c + 273.15;
    }

    function doConvert() {
      const convInput = document.getElementById('convInput') as HTMLInputElement | null;
      const convFromSelect = document.getElementById('convFrom') as HTMLSelectElement | null;
      const convToSelect = document.getElementById('convTo') as HTMLSelectElement | null;

      const input = convInput ? parseFloat(convInput.value) || 0 : 0;
      const from = convFromSelect ? convFromSelect.value : '';
      const to = convToSelect ? convToSelect.value : '';
      if (!from || !to) return;

      let result;
      if (currentConv === 'temp') {
        result = tempConvert(input, from, to);
      } else {
        const base = input * UNITS[currentConv][from];
        result = base / UNITS[currentConv][to];
      }
      const convResultEl = document.getElementById('convResult');
      if (convResultEl) {
        convResultEl.textContent =
          Math.round(result * 10000) / 10000 + ' ' + to;
      }
    }

    document.querySelectorAll('[data-conv]').forEach((tab: any) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-conv]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        currentConv = tab.dataset.conv;
        populateConvSelects();
      });
    });

    ['convInput', 'convFrom', 'convTo'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', doConvert);
    });
    populateConvSelects();

    /* ============ TASKS ============ */
    let tasksArr = store.get('tasks', []);
    function renderTasks() {
      const list = document.getElementById('taskList');
      if (!list) return;
      list.innerHTML = '';
      if (tasksArr.length === 0) {
        list.innerHTML =
          '<div class="empty-state"><span class="text-3xl filter saturate-50 select-none">📜</span>Nothing on the list yet</div>';
        return;
      }
      tasksArr.forEach((task: any, idx: number) => {
        let priorityPill = '';
        const prio = task.priority || 'minor';
        if (prio === 'critical') {
          priorityPill = `<span class="text-[8px] bg-red-500/10 text-red-500 border border-red-500/30 px-1 py-0.5 rounded font-mono mr-1.5 uppercase font-extrabold shrink-0">Lethal</span>`;
        } else if (prio === 'main') {
          priorityPill = `<span class="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1 py-0.5 rounded font-mono mr-1.5 uppercase font-extrabold shrink-0">Main</span>`;
        } else if (prio === 'minor') {
          priorityPill = `<span class="text-[8px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1 py-0.5 rounded font-mono mr-1.5 uppercase font-extrabold shrink-0">Minor</span>`;
        } else if (prio === 'routine') {
          priorityPill = `<span class="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded font-mono mr-1.5 uppercase font-extrabold shrink-0">Routine</span>`;
        }

        const item = document.createElement('div');
        item.className = 'task-item flex items-center justify-between gap-1';
        item.innerHTML = `
          <div class="flex items-center gap-2 min-w-0">
            <div class="task-check ${task.done ? 'done' : ''}" data-toggle="${idx}">${task.done ? '✓' : ''}</div>
            ${priorityPill}
            <div class="task-text truncate ${task.done ? 'done' : ''}">${task.text}</div>
          </div>
          <div class="task-del shrink-0" data-del="${idx}">✕</div>
        `;
        list.appendChild(item);
      });

      list.querySelectorAll('[data-toggle]').forEach((c: any) => {
        c.addEventListener('click', () => {
          const i = parseInt(c.dataset.toggle, 10);
          const oldDone = tasksArr[i].done;
          tasksArr[i].done = !tasksArr[i].done;
          
          if (tasksArr[i].done && !oldDone) {
            const prio = tasksArr[i].priority || 'minor';
            if (prio === 'routine') {
              let curStreak = store.get('habit_streak', 0);
              curStreak += 1;
              store.set('habit_streak', curStreak);
              updateHabitDisplays();
              toast(`Routine complete! Streak increased: ${curStreak} days 🔥`, 'success');
            }
          } else if (!tasksArr[i].done && oldDone) {
            const prio = tasksArr[i].priority || 'minor';
            if (prio === 'routine') {
              let curStreak = store.get('habit_streak', 0);
              curStreak = Math.max(0, curStreak - 1);
              store.set('habit_streak', curStreak);
              updateHabitDisplays();
            }
          }

          store.set('tasks', tasksArr);
          renderTasks();
          haptic(12);
        });
      });

      list.querySelectorAll('.task-del').forEach((d: any) => {
        d.addEventListener('click', () => {
          tasksArr.splice(parseInt(d.dataset.del, 10), 1);
          store.set('tasks', tasksArr);
          renderTasks();
          toast('Task removed', 'warn');
        });
      });
    }
    renderTasks();

    function addTask() {
      const input = document.getElementById('taskInput') as HTMLInputElement | null;
      const select = document.getElementById('taskPrioritySelect') as HTMLSelectElement | null;
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      const priority = select ? select.value : 'minor';
      tasksArr.unshift({ text, done: false, priority });
      store.set('tasks', tasksArr);
      input.value = '';
      renderTasks();
      haptic(10);
    }

    const taskAddBtn = document.getElementById('taskAddBtn');
    if (taskAddBtn) {
      taskAddBtn.addEventListener('click', addTask);
    }

    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
      taskInput.addEventListener('keydown', (e: any) => {
        if (e.key === 'Enter') addTask();
      });
    }

    /* ============ Clock tools: tabs ============ */
    document.querySelectorAll('#panel-clock .calc-tabs .calc-tab').forEach((tab: any) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#panel-clock .calc-tabs .calc-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('#panel-clock .calc-sub').forEach((s: any) => {
          s.classList.remove('active');
          s.style.display = 'none';
        });
        tab.classList.add('active');
        const clockSubEl = document.getElementById('clock-' + tab.dataset.clock);
        if (clockSubEl) {
          clockSubEl.classList.add('active');
          if (tab.dataset.clock === 'pomodoro') {
            clockSubEl.style.display = 'flex';
          } else {
            clockSubEl.style.display = 'block';
          }
        }
        haptic(9);
      });
    });

    /* ============ Pomodoro Timer ============ */
    let pomoTimeLeft = 25 * 60; // 25 minutes
    let pomoInterval: any = null;
    let pomoState = 'focus'; // 'focus' or 'break'
    let pomoRunning = false;

    const pomoDisplay = document.getElementById('pomoTimeDisplay');
    const pomoStateLabel = document.getElementById('pomoStateLabel');
    const pomoStartBtn = document.getElementById('pomoStartBtn');
    const pomoPauseBtn = document.getElementById('pomoPauseBtn');
    const pomoResetBtn = document.getElementById('pomoResetBtn');

    function updatePomoDisplay() {
      if (pomoDisplay) pomoDisplay.textContent = formatMMSS(pomoTimeLeft);
      if (pomoStateLabel) {
        pomoStateLabel.textContent = pomoState === 'focus' ? 'Focus Session' : 'Quick Break ☕';
      }
    }

    if (pomoStartBtn) {
      pomoStartBtn.addEventListener('click', () => {
        if (pomoRunning) return;
        haptic(10);
        pomoRunning = true;
        pomoInterval = setInterval(() => {
          if (pomoTimeLeft > 0) {
            pomoTimeLeft--;
            updatePomoDisplay();
          } else {
            // Ring chime on zero
            clearInterval(pomoInterval);
            pomoRunning = false;
            haptic([100, 200, 100]);
            
            // Switch session mode
            if (pomoState === 'focus') {
              pomoState = 'break';
              pomoTimeLeft = 5 * 60; // 5-minute break
              toast('Focus session ended! Time for a cozy tea break. ☕', 'success');
            } else {
              pomoState = 'focus';
              pomoTimeLeft = 25 * 60;
              toast('Break complete! Ready to start focus sprint? ✨', 'success');
            }
            updatePomoDisplay();
            
            try {
              audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const g = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
              g.gain.setValueAtTime(0.04, audioCtx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.0005, audioCtx.currentTime + 1.2);
              osc.connect(g).connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 1.5);
            } catch (e) {}
          }
        }, 1000);
        toast('Pomodoro timer started!', 'success');
      });
    }

    if (pomoPauseBtn) {
      pomoPauseBtn.addEventListener('click', () => {
        if (!pomoRunning) return;
        clearInterval(pomoInterval);
        pomoRunning = false;
        haptic(8);
        toast('Pomodoro paused.', 'warn');
      });
    }

    if (pomoResetBtn) {
      pomoResetBtn.addEventListener('click', () => {
        clearInterval(pomoInterval);
        pomoRunning = false;
        pomoState = 'focus';
        pomoTimeLeft = 25 * 60;
        updatePomoDisplay();
        haptic(20);
        toast('Pomodoro reset.', 'warn');
      });
    }

    /* ============ Timer ============ */
    let timerTotalSecs = 0;
    let timerRemaining = 0;
    let timerInterval: any = null;
    let timerRunning = false;

    function formatMMSS(totalSecs: number) {
      const m = Math.floor(totalSecs / 60);
      const s = Math.floor(totalSecs % 60);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function updateTimerDisplay() {
      const display = document.getElementById('timerDisplay');
      if (display) display.textContent = formatMMSS(timerRemaining);
    }

    document.querySelectorAll('.timer-presets button').forEach((btn: any) => {
      btn.addEventListener('click', () => {
        timerTotalSecs = parseInt(btn.dataset.secs, 10);
        timerRemaining = timerTotalSecs;
        updateTimerDisplay();
        haptic(9);
      });
    });

    const timerMinInput = document.getElementById('timerMinInput') as HTMLInputElement | null;
    const timerSecInput = document.getElementById('timerSecInput') as HTMLInputElement | null;

    if (timerMinInput) {
      timerMinInput.addEventListener('input', () => {
        const min = parseInt(timerMinInput.value, 10) || 0;
        const sec = timerSecInput ? parseInt(timerSecInput.value, 10) || 0 : 0;
        timerTotalSecs = min * 60 + sec;
        timerRemaining = timerTotalSecs;
        updateTimerDisplay();
      });
    }

    if (timerSecInput) {
      timerSecInput.addEventListener('input', () => {
        const min = timerMinInput ? parseInt(timerMinInput.value, 10) || 0 : 0;
        const sec = parseInt(timerSecInput.value, 10) || 0;
        timerTotalSecs = min * 60 + sec;
        timerRemaining = timerTotalSecs;
        updateTimerDisplay();
      });
    }

    function requestNotifyPermission() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    function notify(title: string, body: string) {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, { body });
        } catch (e) {
          /* no-op */
        }
      }
    }

    const timerStartBtn = document.getElementById('timerStartBtn');
    if (timerStartBtn) {
      timerStartBtn.addEventListener('click', () => {
        const btn = document.getElementById('timerStartBtn');
        if (!btn) return;
        if (timerRunning) {
          clearInterval(timerInterval);
          timerRunning = false;
          btn.textContent = 'Start';
          return;
        }
        if (timerRemaining <= 0) {
          toast('Set a time first', 'warn');
          return;
        }
        requestNotifyPermission();
        timerRunning = true;
        btn.textContent = 'Pause';
        timerInterval = setInterval(() => {
          timerRemaining--;
          updateTimerDisplay();
          if (timerRemaining <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            btn.textContent = 'Start';
            haptic([100, 60, 100, 60, 200]);
            toast('Timer done');
            notify('Timer done', 'Your portal timer has finished.');
          }
        }, 1000);
      });
    }

    const timerResetBtn = document.getElementById('timerResetBtn');
    if (timerResetBtn) {
      timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerRunning = false;
        const startBtn = document.getElementById('timerStartBtn');
        if (startBtn) startBtn.textContent = 'Start';
        timerRemaining = timerTotalSecs;
        updateTimerDisplay();
      });
    }

    /* ============ Stopwatch ============ */
    let stopwatchStart = 0;
    let stopwatchElapsed = 0;
    let stopwatchInterval: any = null;
    let stopwatchRunning = false;
    let laps: any[] = [];

    function formatStopwatch(ms: number) {
      const totalSecs = ms / 1000;
      const m = Math.floor(totalSecs / 60);
      const s = Math.floor(totalSecs % 60);
      const tenths = Math.floor((ms % 1000) / 100);
      return (
        String(m).padStart(2, '0') +
        ':' +
        String(s).padStart(2, '0') +
        '.' +
        tenths
      );
    }

    function updateStopwatchDisplay() {
      const elapsed = stopwatchRunning
        ? Date.now() - stopwatchStart + stopwatchElapsed
        : stopwatchElapsed;
      const display = document.getElementById('stopwatchDisplay');
      if (display) display.textContent = formatStopwatch(elapsed);
    }

    const stopwatchStartBtn = document.getElementById('stopwatchStartBtn');
    if (stopwatchStartBtn) {
      stopwatchStartBtn.addEventListener('click', () => {
        const btn = document.getElementById('stopwatchStartBtn');
        if (!btn) return;
        if (stopwatchRunning) {
          stopwatchElapsed += Date.now() - stopwatchStart;
          stopwatchRunning = false;
          clearInterval(stopwatchInterval);
          btn.textContent = 'Resume';
        } else {
          stopwatchStart = Date.now();
          stopwatchRunning = true;
          btn.textContent = 'Pause';
          stopwatchInterval = setInterval(updateStopwatchDisplay, 100);
        }
        haptic(10);
      });
    }

    const stopwatchLapBtn = document.getElementById('stopwatchLapBtn');
    if (stopwatchLapBtn) {
      stopwatchLapBtn.addEventListener('click', () => {
        if (!stopwatchRunning) return;
        const elapsed = Date.now() - stopwatchStart + stopwatchElapsed;
        laps.unshift(elapsed);
        const list = document.getElementById('lapList');
        if (list) {
          list.innerHTML = '';
          laps.forEach((lap, i) => {
            const row = document.createElement('div');
            row.className = 'lap-row';
            row.innerHTML =
              '<span>Lap ' +
              (laps.length - i) +
              '</span><span class="mono">' +
              formatStopwatch(lap) +
              '</span>';
            list.appendChild(row);
          });
        }
        haptic(9);
      });
    }

    const stopwatchResetBtn = document.getElementById('stopwatchResetBtn');
    if (stopwatchResetBtn) {
      stopwatchResetBtn.addEventListener('click', () => {
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        stopwatchElapsed = 0;
        laps = [];
        const lapList = document.getElementById('lapList');
        if (lapList) lapList.innerHTML = '';
        const startBtn = document.getElementById('stopwatchStartBtn');
        if (startBtn) startBtn.textContent = 'Start';
        updateStopwatchDisplay();
      });
    }

    /* ============ Alarms ============ */
    let alarms = store.get('alarms', []);
    let alarmCheckInterval: any = null;

    function renderAlarms() {
      const list = document.getElementById('alarmList');
      if (!list) return;
      list.innerHTML = '';
      alarms.forEach((alarm: any, idx: number) => {
        const row = document.createElement('div');
        row.className = 'alarm-row';
        row.innerHTML =
          '<span>' +
          alarm.time +
          '</span><span class="alarm-del" data-del="' +
          idx +
          '">remove</span>';
        list.appendChild(row);
      });

      list.querySelectorAll('[data-del]').forEach((d: any) => {
        d.addEventListener('click', () => {
          alarms.splice(parseInt(d.dataset.del, 10), 1);
          store.set('alarms', alarms);
          renderAlarms();
          toast('Alarm removed', 'warn');
        });
      });
    }
    renderAlarms();

    const alarmAddBtn = document.getElementById('alarmAddBtn');
    if (alarmAddBtn) {
      alarmAddBtn.addEventListener('click', () => {
        const input = document.getElementById('alarmTimeInput') as HTMLInputElement | null;
        if (!input || !input.value) return;
        requestNotifyPermission();
        alarms.push({ time: input.value, lastFired: null });
        store.set('alarms', alarms);
        renderAlarms();
        input.value = '';
        toast('Alarm set');
        haptic(10);
      });
    }

    function checkAlarms() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const current = hh + ':' + mm;
      const today = now.toDateString();
      alarms.forEach((alarm: any) => {
        if (alarm.time === current && alarm.lastFired !== today) {
          alarm.lastFired = today;
          store.set('alarms', alarms);
          haptic([150, 80, 150, 80, 150]);
          toast('Alarm: ' + alarm.time);
          notify('Alarm', "It's " + alarm.time);
        }
      });
    }
    alarmCheckInterval = setInterval(checkAlarms, 15000);

    /* ============ Calendar ============ */
    let calViewDate = new Date();
    let calSelectedDate = new Date();
    let calEvents = store.get('cal_events', {});

    function dateKey(d: Date) {
      return (
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0')
      );
    }

    function renderCalendar() {
      const year = calViewDate.getFullYear();
      const month = calViewDate.getMonth();
      const monthLabel = document.getElementById('calMonthLabel');
      if (monthLabel) {
        monthLabel.textContent = calViewDate.toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        });
      }

      const grid = document.getElementById('calGrid');
      if (!grid) return;
      grid.innerHTML = '';
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d) => {
        const el = document.createElement('div');
        el.className = 'cal-dow';
        el.textContent = d;
        grid.appendChild(el);
      });

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const todayDate = new Date();

      for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'cal-day empty';
        grid.appendChild(el);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const thisDate = new Date(year, month, day);
        const key = dateKey(thisDate);
        const el = document.createElement('div');
        el.className = 'cal-day';
        if (thisDate.toDateString() === todayDate.toDateString()) {
          el.classList.add('today');
        }
        if (thisDate.toDateString() === calSelectedDate.toDateString()) {
          el.classList.add('selected');
        }
        const hasEvents = calEvents[key] && calEvents[key].length > 0;
        el.innerHTML = day + (hasEvents ? '<div class="dot"></div>' : '');
        el.addEventListener('click', () => {
          calSelectedDate = thisDate;
          renderCalendar();
          renderCalEvents();
          haptic(9);
        });
        grid.appendChild(el);
      }
    }

    function renderCalEvents() {
      const key = dateKey(calSelectedDate);
      const selectedLabel = document.getElementById('calSelectedLabel');
      if (selectedLabel) {
        selectedLabel.textContent = calSelectedDate.toLocaleDateString(
          undefined,
          { weekday: 'long', month: 'short', day: 'numeric' }
        );
      }
      const list = document.getElementById('calEventList');
      if (!list) return;
      list.innerHTML = '';
      const events = calEvents[key] || [];
      if (events.length === 0) {
        list.innerHTML =
          '<div class="empty-state"><span class="text-3xl filter saturate-50 select-none">🌌</span>Nothing on this day</div>';
        return;
      }
      events.forEach((ev: string, idx: number) => {
        const row = document.createElement('div');
        row.className = 'cal-event-row';
        row.innerHTML =
          '<span>' + ev + '</span><span class="icon-btn" data-del="' + idx + '">delete</span>';
        list.appendChild(row);
      });

      list.querySelectorAll('[data-del]').forEach((d: any) => {
        d.addEventListener('click', () => {
          events.splice(parseInt(d.dataset.del, 10), 1);
          calEvents[key] = events;
          store.set('cal_events', calEvents);
          renderCalEvents();
          renderCalendar();
        });
      });
    }

    const calPrevBtn = document.getElementById('calPrevBtn');
    if (calPrevBtn) {
      calPrevBtn.addEventListener('click', () => {
        calViewDate = new Date(
          calViewDate.getFullYear(),
          calViewDate.getMonth() - 1,
          1
        );
        renderCalendar();
        haptic(9);
      });
    }

    const calNextBtn = document.getElementById('calNextBtn');
    if (calNextBtn) {
      calNextBtn.addEventListener('click', () => {
        calViewDate = new Date(
          calViewDate.getFullYear(),
          calViewDate.getMonth() + 1,
          1
        );
        renderCalendar();
        haptic(9);
      });
    }

    const calEventAddBtn = document.getElementById('calEventAddBtn');
    if (calEventAddBtn) {
      calEventAddBtn.addEventListener('click', () => {
        const input = document.getElementById('calEventInput') as HTMLInputElement | null;
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        const key = dateKey(calSelectedDate);
        if (!calEvents[key]) calEvents[key] = [];
        calEvents[key].push(text);
        store.set('cal_events', calEvents);
        input.value = '';
        renderCalEvents();
        renderCalendar();
        toast('Event added');
      });
    }
    renderCalendar();
    renderCalEvents();

    /* ============ Higher or Lower game ============ */
    let gameCurrentNum = secureRandomInt(20);
    let gameStreak = 0;
    let gameBest = store.get('game_best', 0);

    const gameBestEl = document.getElementById('gameBest');
    const gameStreakEl = document.getElementById('gameStreak');
    const gameCurrentEl = document.getElementById('gameCurrent');

    if (gameBestEl) gameBestEl.textContent = String(gameBest);
    if (gameStreakEl) gameStreakEl.textContent = String(gameStreak);
    if (gameCurrentEl) gameCurrentEl.textContent = String(gameCurrentNum);

    function gameGuess(direction: 'higher' | 'lower') {
      const nextNum = secureRandomInt(20);
      const correct =
        direction === 'higher'
          ? nextNum >= gameCurrentNum
          : nextNum <= gameCurrentNum;

      const sub = document.getElementById('gameSub');
      if (correct) {
        gameStreak++;
        if (gameStreakEl) gameStreakEl.textContent = String(gameStreak);
        if (gameStreak > gameBest) {
          gameBest = gameStreak;
          store.set('game_best', gameBest);
          if (gameBestEl) gameBestEl.textContent = String(gameBest);
        }
        if (sub) sub.textContent = 'correct — keep going';
        haptic(15);
      } else {
        if (sub) sub.textContent = 'streak broken — try again';
        gameStreak = 0;
        if (gameStreakEl) gameStreakEl.textContent = '0';
        haptic([100, 60, 100]);
      }
      gameCurrentNum = nextNum;
      if (gameCurrentEl) gameCurrentEl.textContent = String(gameCurrentNum);
    }

    const gameHigherBtn = document.getElementById('gameHigherBtn');
    if (gameHigherBtn) {
      gameHigherBtn.addEventListener('click', () => gameGuess('higher'));
    }

    const gameLowerBtn = document.getElementById('gameLowerBtn');
    if (gameLowerBtn) {
      gameLowerBtn.addEventListener('click', () => gameGuess('lower'));
    }

    /* ============ Settings ============ */
    const settings = store.get('settings', {
      theme: 'dark',
      motion: true,
      haptics: true,
      sound: false,
      defaultDie: 20,
      greeting: true,
      bgVideoOpacity: 45,
      bgVideoBlur: 0,
      bgVideoBrightness: 70,
      bgVideoHue: 0,
    });
    function saveSettings() {
      store.set('settings', settings);
    }

    /* ============ Custom Video Background (IndexedDB Store) ============ */
    const dbName = "PortalBgDB";
    const storeName = "bgStore";
    const dbKey = (localStorage.getItem('portal_current_user') || 'guest') + "_bgVideo";

    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        };
        request.onsuccess = (e: any) => resolve(e.target.result);
        request.onerror = (e) => reject(e);
      });
    }

    function saveVideoBlob(blob: Blob) {
      return openDB().then((db: any) => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, "readwrite");
          const storeObj = tx.objectStore(storeName);
          const req = storeObj.put(blob, dbKey);
          req.onsuccess = () => resolve(true);
          req.onerror = (e: any) => reject(e);
        });
      });
    }

    function loadVideoBlob(): Promise<Blob | null> {
      return openDB().then((db: any) => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, "readonly");
          const storeObj = tx.objectStore(storeName);
          const req = storeObj.get(dbKey);
          req.onsuccess = (e: any) => resolve(e.target.result || null);
          req.onerror = (e: any) => reject(e);
        });
      });
    }

    function clearVideoBlob() {
      return openDB().then((db: any) => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, "readwrite");
          const storeObj = tx.objectStore(storeName);
          const req = storeObj.delete(dbKey);
          req.onsuccess = () => resolve(true);
          req.onerror = (e: any) => reject(e);
        });
      });
    }

    const bgVideo = document.getElementById('bgVideo') as HTMLVideoElement | null;
    const bgVideoDropzone = document.getElementById('bgVideoDropzone');
    const bgVideoInput = document.getElementById('bgVideoInput') as HTMLInputElement | null;
    const clearBgVideoBtn = document.getElementById('clearBgVideoBtn');
    const bgVideoControls = document.getElementById('bgVideoControls');

    const opSlider = document.getElementById('bgVideoOpacitySlider') as HTMLInputElement | null;
    const blurSlider = document.getElementById('bgVideoBlurSlider') as HTMLInputElement | null;
    const brightSlider = document.getElementById('bgVideoBrightnessSlider') as HTMLInputElement | null;
    const hueSlider = document.getElementById('bgVideoHueSlider') as HTMLInputElement | null;

    const opLabel = document.getElementById('bgOpacityLabel');
    const blurLabel = document.getElementById('bgBlurLabel');
    const brightLabel = document.getElementById('bgBrightnessLabel');
    const hueLabel = document.getElementById('bgHueLabel');

    function applyBgVideoStyles() {
      if (!bgVideo) return;
      const opacity = (settings.bgVideoOpacity !== undefined ? settings.bgVideoOpacity : 45) / 100;
      const blur = settings.bgVideoBlur !== undefined ? settings.bgVideoBlur : 0;
      const brightness = settings.bgVideoBrightness !== undefined ? settings.bgVideoBrightness : 70;
      const hue = settings.bgVideoHue !== undefined ? settings.bgVideoHue : 0;

      bgVideo.style.opacity = String(opacity);
      bgVideo.style.filter = `blur(${blur}px) brightness(${brightness}%) hue-rotate(${hue}deg)`;
    }

    function updateBgControlsUI(hasVideo: boolean) {
      if (clearBgVideoBtn) {
        if (hasVideo) clearBgVideoBtn.classList.remove('hidden');
        else clearBgVideoBtn.classList.add('hidden');
      }
      if (bgVideoControls) {
        if (hasVideo) bgVideoControls.classList.remove('hidden');
        else bgVideoControls.classList.add('hidden');
      }

      if (opSlider) {
        opSlider.value = String(settings.bgVideoOpacity !== undefined ? settings.bgVideoOpacity : 45);
        if (opLabel) opLabel.textContent = `${opSlider.value}%`;
      }
      if (blurSlider) {
        blurSlider.value = String(settings.bgVideoBlur !== undefined ? settings.bgVideoBlur : 0);
        if (blurLabel) blurLabel.textContent = `${blurSlider.value}px`;
      }
      if (brightSlider) {
        brightSlider.value = String(settings.bgVideoBrightness !== undefined ? settings.bgVideoBrightness : 70);
        if (brightLabel) brightLabel.textContent = `${brightSlider.value}%`;
      }
      if (hueSlider) {
        hueSlider.value = String(settings.bgVideoHue !== undefined ? settings.bgVideoHue : 0);
        if (hueLabel) hueLabel.textContent = `Hue: ${hueSlider.value}°`;
      }

      applyBgVideoStyles();
    }

    // Load persisted video
    loadVideoBlob().then((blob) => {
      if (blob && bgVideo) {
        const videoUrl = URL.createObjectURL(blob);
        bgVideo.src = videoUrl;
        bgVideo.classList.remove('hidden');
        bgVideo.play().catch(err => console.log("Video auto-play failed:", err));
        updateBgControlsUI(true);
      } else {
        updateBgControlsUI(false);
      }
    }).catch(err => {
      console.error("Failed to load video from IndexedDB", err);
      updateBgControlsUI(false);
    });

    function handleSelectedVideo(file: File) {
      if (!file.type.startsWith('video/')) {
        toast("⚠️ Only video files are compatible with the Portal background!", "warn");
        return;
      }
      toast("🔮 Channeling video into background database...", "success");
      
      const videoUrl = URL.createObjectURL(file);
      if (bgVideo) {
        bgVideo.src = videoUrl;
        bgVideo.classList.remove('hidden');
        bgVideo.play().catch(err => console.log("Play failed:", err));
      }

      saveVideoBlob(file).then(() => {
        toast("✨ Portal background successfully bound!", "success");
        updateBgControlsUI(true);
      }).catch(err => {
        console.error("IndexedDB Save Error:", err);
        toast("⚠️ Saved to memory only (storage limit exceeded)", "warn");
        updateBgControlsUI(true);
      });
    }

    if (bgVideoDropzone && bgVideoInput) {
      bgVideoDropzone.addEventListener('click', () => {
        bgVideoInput.click();
      });
      bgVideoInput.addEventListener('change', (e: any) => {
        if (e.target.files && e.target.files[0]) {
          handleSelectedVideo(e.target.files[0]);
        }
      });

      // Drag over dropzone
      bgVideoDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        bgVideoDropzone.classList.add('border-[#cf4fe6]');
      });
      bgVideoDropzone.addEventListener('dragleave', () => {
        bgVideoDropzone.classList.remove('border-[#cf4fe6]');
      });
      bgVideoDropzone.addEventListener('drop', (e: any) => {
        e.preventDefault();
        bgVideoDropzone.classList.remove('border-[#cf4fe6]');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleSelectedVideo(e.dataTransfer.files[0]);
        }
      });
    }

    // Clear background video
    if (clearBgVideoBtn) {
      clearBgVideoBtn.addEventListener('click', () => {
        clearVideoBlob().then(() => {
          if (bgVideo) {
            bgVideo.src = "";
            bgVideo.classList.add('hidden');
          }
          toast("🌌 Reverted background to celestial cosmic nebula", "success");
          updateBgControlsUI(false);
        }).catch(err => {
          console.error("Failed to clear background video", err);
        });
      });
    }

    // Sliders event listeners
    if (opSlider) {
      opSlider.addEventListener('input', () => {
        settings.bgVideoOpacity = Number(opSlider.value);
        if (opLabel) opLabel.textContent = `${opSlider.value}%`;
        applyBgVideoStyles();
        saveSettings();
      });
    }
    if (blurSlider) {
      blurSlider.addEventListener('input', () => {
        settings.bgVideoBlur = Number(blurSlider.value);
        if (blurLabel) blurLabel.textContent = `${blurSlider.value}px`;
        applyBgVideoStyles();
        saveSettings();
      });
    }
    if (brightSlider) {
      brightSlider.addEventListener('input', () => {
        settings.bgVideoBrightness = Number(brightSlider.value);
        if (brightLabel) brightLabel.textContent = `${brightSlider.value}%`;
        applyBgVideoStyles();
        saveSettings();
      });
    }
    if (hueSlider) {
      hueSlider.addEventListener('input', () => {
        settings.bgVideoHue = Number(hueSlider.value);
        if (hueLabel) hueLabel.textContent = `Hue: ${hueSlider.value}°`;
        applyBgVideoStyles();
        saveSettings();
      });
    }

    // Full-screen drag-and-drop window overlay
    const dragOverlay = document.getElementById('dragDropVideoOverlay');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e: DragEvent) => {
      e.preventDefault();
      // Check if dragging files
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        dragCounter++;
        if (dragOverlay) {
          dragOverlay.classList.remove('pointer-events-none');
          dragOverlay.classList.add('opacity-100');
        }
      }
    });

    window.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
    });

    window.addEventListener('dragleave', (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        dragCounter--;
        if (dragCounter <= 0) {
          dragCounter = 0;
          if (dragOverlay) {
            dragOverlay.classList.add('pointer-events-none');
            dragOverlay.classList.remove('opacity-100');
          }
        }
      }
    });

    window.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      if (dragOverlay) {
        dragOverlay.classList.add('pointer-events-none');
        dragOverlay.classList.remove('opacity-100');
      }
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleSelectedVideo(e.dataTransfer.files[0]);
      }
    });

    // Theme switching
    function applyTheme(theme: string) {
      document.documentElement.setAttribute('data-theme', theme);
    }

    document.querySelectorAll('#themeSegmented button').forEach((btn: any) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#themeSegmented button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        settings.theme = btn.dataset.theme;
        applyTheme(settings.theme);
        saveSettings();
        haptic(9);
      });
    });

    // Motion toggle
    const motionToggle = document.getElementById('motionToggle') as HTMLInputElement | null;
    if (motionToggle) {
      motionToggle.addEventListener('change', () => {
        settings.motion = motionToggle.checked;
        document.documentElement.setAttribute(
          'data-motion',
          settings.motion ? 'on' : 'off'
        );
        saveSettings();
        haptic(9);
      });
    }

    // Haptics master toggle
    const hapticsToggle = document.getElementById('hapticsToggle') as HTMLInputElement | null;
    if (hapticsToggle) {
      hapticsToggle.addEventListener('change', () => {
        settings.haptics = hapticsToggle.checked;
        saveSettings();
        if (settings.haptics) hapticRaw(10);
      });
    }

    // Sound toggle + tone on roll landing
    const soundToggle = document.getElementById('soundToggle') as HTMLInputElement | null;
    if (soundToggle) {
      soundToggle.addEventListener('change', () => {
        settings.sound = soundToggle.checked;
        saveSettings();
      });
    }

    /* ============ Quest Habit Streak ============ */
    function updateHabitDisplays() {
      const habitStreakNum = document.getElementById('habitStreakNum');
      if (habitStreakNum) {
        const streak = store.get('habit_streak', 0);
        habitStreakNum.textContent = `${streak} ${streak === 1 ? 'Day' : 'Days'}`;
      }
    }
    updateHabitDisplays();

    /* ============ Fate Decision Oracle ============ */
    const oracleInput = document.getElementById('oracleInput') as HTMLInputElement | null;
    const oracleConsultBtn = document.getElementById('oracleConsultBtn');
    const oracleResponseShell = document.getElementById('oracleResponseShell');
    const oracleSpinner = document.getElementById('oracleSpinner');
    const oracleText = document.getElementById('oracleText');

    const oracleAnswers = [
      "The runes glow brightly: The path ahead is clear. Go for it! ✨",
      "Shadows cloud the future. Patience is key. Wait for a sign. ⏳",
      "By all indications, the celestial alignments favor this option! 👍",
      "Warning: The energies are highly chaotic. Steer clear for now. 🛑",
      "Do not doubt your instinct; the stars reflect absolute success ahead.",
      "A deep silence from the void. Re-evaluate your focus and try again.",
      "Indeed, the flow of your journey points clearly in that direction.",
      "The elements whisper: No, there is a better quest awaiting you."
    ];

    if (oracleConsultBtn) {
      oracleConsultBtn.addEventListener('click', () => {
        haptic([15, 30]);
        const q = oracleInput ? oracleInput.value.trim() : '';
        if (!q) {
          toast('Please state your query inside the oracle box.', 'warn');
          return;
        }

        if (oracleResponseShell && oracleSpinner && oracleText) {
          oracleResponseShell.classList.remove('hidden');
          oracleSpinner.style.display = 'block';
          oracleText.textContent = '';
          
          setTimeout(() => {
            oracleSpinner.style.display = 'none';
            const index = Math.abs(q.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % oracleAnswers.length;
            oracleText.textContent = `"${q}" → ${oracleAnswers[index]}`;
            haptic([100, 50, 100]);
          }, 1200);
        }
      });
    }

    /* ============ Game tab switching ============ */
    document.querySelectorAll('[data-game-tab]').forEach((tab: any) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-game-tab]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Hide all views
        document.getElementById('game-view-hilow')?.classList.add('hidden');
        document.getElementById('game-view-score')?.classList.add('hidden');
        document.getElementById('game-view-spin')?.classList.add('hidden');
        document.getElementById('game-view-hilow')?.classList.remove('flex');
        document.getElementById('game-view-score')?.classList.remove('flex');
        document.getElementById('game-view-spin')?.classList.remove('flex');

        const activeId = `game-view-${tab.dataset.gameTab}`;
        const activeEl = document.getElementById(activeId);
        if (activeEl) {
          activeEl.classList.remove('hidden');
          activeEl.classList.add('flex');
        }
        haptic(10);
      });
    });

    /* ============ Astrolabe Group Spinner ============ */
    const astrolabeSpinBtn = document.getElementById('astrolabeSpinBtn');
    const spinOptionsInput = document.getElementById('spinOptionsInput') as HTMLTextAreaElement | null;
    const astrolabeSpinRing = document.getElementById('astrolabeSpinRing');
    const astrolabeSelectedWord = document.getElementById('astrolabeSelectedWord');
    let isSpinning = false;

    if (astrolabeSpinBtn && astrolabeSpinRing && astrolabeSelectedWord) {
      astrolabeSpinBtn.addEventListener('click', () => {
        if (isSpinning) return;
        haptic([10, 40, 80]);
        const optionsText = spinOptionsInput ? spinOptionsInput.value.trim() : '';
        const options = optionsText ? optionsText.split(',').map(o => o.trim()).filter(Boolean) : [];
        if (options.length === 0) {
          toast('Please enter comma-separated choices.', 'warn');
          return;
        }

        isSpinning = true;
        astrolabeSpinRing.classList.add('animate-spin');
        astrolabeSpinRing.style.animationDuration = '0.3s';
        astrolabeSelectedWord.textContent = '...';

        let counter = 0;
        const interval = setInterval(() => {
          const tempWord = options[Math.floor(Math.random() * options.length)];
          astrolabeSelectedWord.textContent = tempWord || '';
        }, 120);

        setTimeout(() => {
          clearInterval(interval);
          astrolabeSpinRing.classList.remove('animate-spin');
          astrolabeSpinRing.style.animationDuration = '';
          const finalWord = options[Math.floor(Math.random() * options.length)];
          astrolabeSelectedWord.textContent = finalWord?.toUpperCase() || 'READY';
          isSpinning = false;
          haptic([100, 200]);
          toast(`Astrolabe selects: ${finalWord}! 💫`, 'success');
        }, 2000);
      });
    }

    /* ============ Board Game Scorekeeper ============ */
    const scorekeeperRows = document.getElementById('scorekeeperRows');
    const scoreAddPlayerBtn = document.getElementById('scoreAddPlayerBtn');
    const scoreNewPlayerName = document.getElementById('scoreNewPlayerName') as HTMLInputElement | null;
    const scoreClearBtn = document.getElementById('scoreClearBtn');

    interface PlayerScore {
      name: string;
      score: number;
    }

    let pScores: PlayerScore[] = store.get('boardgame_scores', [
      { name: 'Player 1', score: 0 },
      { name: 'Player 2', score: 0 }
    ]);

    function renderScorekeeper() {
      if (!scorekeeperRows) return;
      scorekeeperRows.innerHTML = '';
      pScores.forEach((p, idx) => {
        const r = document.createElement('div');
        r.className = 'flex items-center justify-between p-2 rounded-xl bg-[#140a2b]/60 border border-[#44387a]/30';
        r.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-teal-300 uppercase shrink-0">${p.name}</span>
            <span class="text-xs font-mono font-black text-amber-400 select-none bg-black/30 px-2 py-0.5 rounded-md min-w-[28px] text-center">${p.score}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="w-6 h-6 rounded bg-red-600/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-xs cursor-pointer focus:outline-none" onclick="window.adjScore(${idx}, -1)">-1</button>
            <button class="w-6 h-6 rounded bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs cursor-pointer focus:outline-none" onclick="window.adjScore(${idx}, 1)">+1</button>
            <button class="w-8 h-6 rounded bg-[#44387a]/20 border border-[#44387a]/40 hover:bg-[#44387a]/50 text-purple-300 font-bold text-[10px] cursor-pointer focus:outline-none" onclick="window.adjScore(${idx}, 5)">+5</button>
            <button class="w-5 h-6 text-slate-500 hover:text-red-400 font-bold text-[10px] cursor-pointer focus:outline-none" onclick="window.delScore(${idx})">×</button>
          </div>
        `;
        scorekeeperRows.appendChild(r);
      });
      store.set('boardgame_scores', pScores);
    }

    (window as any).adjScore = (idx: number, delta: number) => {
      if (pScores[idx]) {
        pScores[idx].score += delta;
        renderScorekeeper();
        haptic(10);
      }
    };

    (window as any).delScore = (idx: number) => {
      pScores.splice(idx, 1);
      renderScorekeeper();
      haptic(15);
    };

    if (scoreAddPlayerBtn) {
      scoreAddPlayerBtn.addEventListener('click', () => {
        const val = scoreNewPlayerName ? scoreNewPlayerName.value.trim() : '';
        if (!val) {
          toast('Please enter a player name.', 'warn');
          return;
        }
        if (pScores.length >= 8) {
          toast('Maximum 8 scores reached.', 'warn');
          return;
        }
        pScores.push({ name: val, score: 0 });
        renderScorekeeper();
        if (scoreNewPlayerName) scoreNewPlayerName.value = '';
        haptic(12);
      });
    }

    if (scoreClearBtn) {
      scoreClearBtn.addEventListener('click', () => {
        pScores.forEach(p => p.score = 0);
        renderScorekeeper();
        haptic(50);
        toast('Scores reset to 0.', 'success');
      });
    }

    renderScorekeeper();

    /* ============ Ambient Soundscapes Synthesizer ============ */
    let soundscapeNode: any = null;
    let soundscapeGain: any = null;
    let chimingInterval: any = null;
    let rumblingOsc1: any = null;
    let rumblingOsc2: any = null;
    let crackleInterval: any = null;
    let soundscapeActive = false;

    const playSoundscapeBtn = document.getElementById('playSoundscapeBtn');
    const soundscapeSelect = document.getElementById('soundscapeSelect') as HTMLSelectElement | null;
    const soundscapeVol = document.getElementById('soundscapeVol') as HTMLInputElement | null;

    function startSoundscape() {
      try {
        audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        soundscapeGain = audioCtx.createGain();
        const initialVol = soundscapeVol ? parseFloat(soundscapeVol.value) : 0.04;
        soundscapeGain.gain.setValueAtTime(initialVol, audioCtx.currentTime);
        soundscapeGain.connect(audioCtx.destination);

        const track = soundscapeSelect ? soundscapeSelect.value : 'space';
        if (track === 'space') {
          // Warm Deep Space Hum
          rumblingOsc1 = audioCtx.createOscillator();
          rumblingOsc2 = audioCtx.createOscillator();
          const filter = audioCtx.createBiquadFilter();

          rumblingOsc1.type = 'sawtooth';
          rumblingOsc1.frequency.setValueAtTime(55, audioCtx.currentTime); // A1

          rumblingOsc2.type = 'sine';
          rumblingOsc2.frequency.setValueAtTime(55.4, audioCtx.currentTime); // Slight detune

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(150, audioCtx.currentTime);
          filter.Q.setValueAtTime(1.5, audioCtx.currentTime);

          rumblingOsc1.connect(filter);
          rumblingOsc2.connect(filter);
          filter.connect(soundscapeGain);

          rumblingOsc1.start();
          rumblingOsc2.start();

          // Low-frequency filter sweep to mimic space nebulas
          let phase = 0;
          crackleInterval = setInterval(() => {
            if (!audioCtx) return;
            phase += 0.05;
            const cutoff = 120 + Math.sin(phase) * 40;
            filter.frequency.linearRampToValueAtTime(cutoff, audioCtx.currentTime + 0.5);
          }, 500);

        } else if (track === 'campfire') {
          // Warm white noise camp crackler
          const bufferSize = audioCtx.sampleRate * 2;
          const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noiseNode = audioCtx.createBufferSource();
          noiseNode.buffer = noiseBuffer;
          noiseNode.loop = true;

          const baseFilter = audioCtx.createBiquadFilter();
          baseFilter.type = 'bandpass';
          baseFilter.frequency.setValueAtTime(400, audioCtx.currentTime);
          baseFilter.Q.setValueAtTime(0.5, audioCtx.currentTime);

          const noiseGain = audioCtx.createGain();
          noiseGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

          noiseNode.connect(baseFilter).connect(noiseGain).connect(soundscapeGain);
          noiseNode.start();
          soundscapeNode = noiseNode;

          // Campfire random wood-spark cracklings
          crackleInterval = setInterval(() => {
            if (!audioCtx) return;
            const snapOsc = audioCtx.createOscillator();
            const snapGain = audioCtx.createGain();
            snapOsc.type = 'triangle';
            snapOsc.frequency.setValueAtTime(100 + Math.random() * 1000, audioCtx.currentTime);
            snapGain.gain.setValueAtTime(0.06 * Math.random(), audioCtx.currentTime);
            snapGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
            snapOsc.connect(snapGain).connect(soundscapeGain);
            snapOsc.start();
            snapOsc.stop(audioCtx.currentTime + 0.05);
          }, 180);

        } else if (track === 'chimes') {
          // Ambient Astral Chimes
          const rootFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C D E G A C Pentatonic
          chimingInterval = setInterval(() => {
            if (!audioCtx) return;
            const randomNote = rootFreqs[Math.floor(Math.random() * rootFreqs.length)];
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(randomNote, audioCtx.currentTime);
            g.gain.setValueAtTime(0.02 + Math.random() * 0.02, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0005, audioCtx.currentTime + 2.5);
            osc.connect(g).connect(soundscapeGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 3.0);
          }, 1500);
        }
        
        soundscapeActive = true;
        if (playSoundscapeBtn) playSoundscapeBtn.textContent = '🔊 STOP AMBIENT';
        toast('Ambient Soundscape started! Unwind and focus.', 'success');
      } catch (e) {
        toast('Audio system standby', 'warn');
      }
    }

    function stopSoundscape() {
      clearInterval(crackleInterval);
      clearInterval(chimingInterval);
      if (soundscapeNode) {
        try { soundscapeNode.stop(); } catch(e){}
        soundscapeNode = null;
      }
      if (rumblingOsc1) {
        try { rumblingOsc1.stop(); } catch(e){}
        rumblingOsc1 = null;
      }
      if (rumblingOsc2) {
        try { rumblingOsc2.stop(); } catch(e){}
        rumblingOsc2 = null;
      }
      if (soundscapeGain) {
        try { soundscapeGain.disconnect(); } catch(e){}
        soundscapeGain = null;
      }
      soundscapeActive = false;
      if (playSoundscapeBtn) playSoundscapeBtn.textContent = '🔇 PLAY AMBIENT';
      toast('Ambient Soundscape stopped.', 'warn');
    }

    if (playSoundscapeBtn) {
      playSoundscapeBtn.addEventListener('click', () => {
        if (soundscapeActive) {
          stopSoundscape();
        } else {
          startSoundscape();
        }
        haptic(10);
      });
    }

    if (soundscapeVol) {
      soundscapeVol.addEventListener('input', (e: any) => {
        const val = parseFloat(e.target.value);
        if (soundscapeGain) {
          soundscapeGain.gain.setValueAtTime(val, audioCtx?.currentTime || 0);
        }
      });
    }

    if (soundscapeSelect) {
      soundscapeSelect.addEventListener('change', () => {
        if (soundscapeActive) {
          stopSoundscape();
          startSoundscape();
        }
      });
    }

    // audioCtx is declared in parent scope
    function playLandTone(crit: string) {
      if (!settings.sound) return;
      try {
        audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = crit === 'hi' ? 880 : crit === 'lo' ? 220 : 440;
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        /* audio not available, no-op */
      }
    }

    // Default die select
    const defaultDieSelect = document.getElementById('defaultDieSelect') as HTMLSelectElement | null;
    if (defaultDieSelect) {
      defaultDieSelect.addEventListener('change', () => {
        settings.defaultDie = parseInt(defaultDieSelect.value, 10);
        saveSettings();
        toast('Default die updated');
      });
    }

    // Greeting flip toggle
    const greetingToggle = document.getElementById('greetingToggle') as HTMLInputElement | null;
    if (greetingToggle) {
      greetingToggle.addEventListener('change', () => {
        settings.greeting = greetingToggle.checked;
        saveSettings();
      });
    }

    // Export everything as single backup
    const exportAllData = document.getElementById('exportAllData');
    if (exportAllData) {
      exportAllData.addEventListener('click', () => {
        const everything = {
          notes: store.get('notes', []),
          tasks: store.get('tasks', []),
          char_sheet: store.get('char_sheet', {}),
          roll_history: store.get('roll_history', []),
          recipes: store.get('recipes', []),
          pantryChecked: store.get('pantryChecked', []),
          customPantryItems: store.get('customPantryItems', []),
          settings: store.get('settings', {}),
          exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(everything, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          'portal-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        toast('Backup downloaded');
      });
    }

    // Clear all data
    const clearAllData = document.getElementById('clearAllData');
    if (clearAllData) {
      clearAllData.addEventListener('click', () => {
        if (
          !confirm(
            'This clears all notes, tasks, recipes, your sheet, and roll history from your current login. Continue?'
          )
        )
          return;
        ['notes', 'tasks', 'char_sheet', 'roll_history', 'recipes', 'pantryChecked', 'customPantryItems', 'settings'].forEach((k) => {
          const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
          localStorage.removeItem(`${loggedInUser}_${k}`);
        });
        toast('All data cleared', 'warn');
        setTimeout(() => window.location.reload(), 900);
      });
    }

    // Import backup file system (JSON)
    const importAllData = document.getElementById('importAllData');
    const importFileInput = document.getElementById('importFileInput') as HTMLInputElement | null;
    if (importAllData && importFileInput) {
      importAllData.addEventListener('click', () => {
        haptic(10);
        importFileInput.click();
      });

      importFileInput.addEventListener('change', (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const data = JSON.parse(event.target.result);
            if (typeof data !== 'object' || data === null) {
              throw new Error('Invalid format');
            }
            // Import all keys safely without losing other fields
            Object.keys(data).forEach((key) => {
              const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
              const isGlobal = (key === 'portal_users' || key === 'global_feedback_ideas' || key === 'portal_current_user');
              const finalKey = isGlobal ? key : `${loggedInUser}_${key}`;
              if (typeof data[key] === 'object' && data[key] !== null) {
                localStorage.setItem(finalKey, JSON.stringify(data[key]));
              } else if (typeof data[key] === 'string') {
                localStorage.setItem(finalKey, data[key]);
              }
            });
            toast('Backup imported successfully! Reloading...', 'success');
            setTimeout(() => window.location.reload(), 1200);
          } catch (err) {
            toast('Failed to parse backup file', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Apply saved settings
    applyTheme(settings.theme);
    const activeThemeBtn = document.querySelector(
      '#themeSegmented [data-theme="' + settings.theme + '"]'
    );
    if (activeThemeBtn) {
      document.querySelectorAll('#themeSegmented button').forEach((b) => b.classList.remove('active'));
      activeThemeBtn.classList.add('active');
    }

    if (motionToggle) motionToggle.checked = settings.motion;
    document.documentElement.setAttribute(
      'data-motion',
      settings.motion ? 'on' : 'off'
    );
    if (hapticsToggle) hapticsToggle.checked = settings.haptics;
    if (soundToggle) soundToggle.checked = settings.sound;
    if (defaultDieSelect) defaultDieSelect.value = String(settings.defaultDie);
    if (greetingToggle) greetingToggle.checked = settings.greeting;

    selectedDie = settings.defaultDie;
    document.querySelectorAll('.die-btn').forEach((b: any) => {
      b.classList.toggle(
        'active',
        parseInt(b.dataset.die, 10) === settings.defaultDie
      );
    });

    /* ============ Greeting coin flip ============ */
    let coinTimer: any = null;
    if (settings.greeting) {
      coinTimer = setTimeout(() => {
        const coinBtn = document.querySelector('.die-btn[data-die="2"]');
        if (coinBtn) {
          selectedDie = 2;
          document.querySelectorAll('.die-btn').forEach((x) => x.classList.remove('active'));
          coinBtn.classList.add('active');
        }
        doRoll(2, 'the portal greets you');
      }, 500);
    }

    /* ============ RECIPIES & COOKING PORTAL ============ */
    let recipesArr: any[] = store.get('recipes', []).filter((r: any) => !r.id.startsWith('rec_default_'));
    store.set('recipes', recipesArr);

    // Load Pantry Staples Checked list
    let pantryChecked: string[] = store.get('pantryChecked', []);
    let customPantryItems: string[] = store.get('customPantryItems', []);

    // Current active recipe for modal
    let activeRecipe: any = null;
    let cookingTimerInterval: any = null;
    let cookingTimerSecondsLeft = 0;

    // Mode toggling (Transcribe Link vs manual write)
    const modeTranscribeBtn = document.getElementById('modeTranscribeBtn');
    const modeCreateManualBtn = document.getElementById('modeCreateManualBtn');
    const transcriptionForm = document.getElementById('transcriptionForm');
    const manualRecipeForm = document.getElementById('manualRecipeForm');

    if (modeTranscribeBtn && modeCreateManualBtn && transcriptionForm && manualRecipeForm) {
      modeTranscribeBtn.addEventListener('click', () => {
        haptic(8);
        modeTranscribeBtn.classList.add('text-[#ff7597]', 'border-b-2', 'border-[#ff7597]');
        modeTranscribeBtn.classList.remove('text-[#b4aae2]');
        modeCreateManualBtn.classList.remove('text-[#ff7597]', 'border-b-2', 'border-[#ff7597]');
        modeCreateManualBtn.classList.add('text-[#b4aae2]');

        transcriptionForm.classList.remove('hidden');
        manualRecipeForm.classList.add('hidden');
      });

      modeCreateManualBtn.addEventListener('click', () => {
        haptic(8);
        modeCreateManualBtn.classList.add('text-[#ff7597]', 'border-b-2', 'border-[#ff7597]');
        modeCreateManualBtn.classList.remove('text-[#b4aae2]');
        modeTranscribeBtn.classList.remove('text-[#ff7597]', 'border-b-2', 'border-[#ff7597]');
        modeTranscribeBtn.classList.add('text-[#b4aae2]');

        manualRecipeForm.classList.remove('hidden');
        transcriptionForm.classList.add('hidden');
      });
    }

    // Magic Clipboard Fast Paste parser
    const magicPasteParseBtn = document.getElementById('magicPasteParseBtn');
    const magicPasteInput = document.getElementById('magicPasteInput') as HTMLTextAreaElement | null;
    if (magicPasteParseBtn && magicPasteInput) {
      magicPasteParseBtn.addEventListener('click', () => {
        const text = magicPasteInput.value.trim();
        if (!text) {
          toast('Please paste some text first!', 'warn');
          haptic(14);
          return;
        }

        haptic([40, 50]);

        // Smart parser
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return;

        let detectedTitle = '';
        let detectedPrep = '';
        let detectedCook = '';
        let detectedServings = '';
        const detectedIngredients: string[] = [];
        const detectedDirections: string[] = [];
        let detectedSecretTip = '';

        let sectionMode: 'none' | 'ingredients' | 'directions' | 'tips' = 'none';

        for (let i = 0; i < lines.length; i++) {
          const rawLine = lines[i];
          const cleanLine = rawLine.replace(/[\*#_`~]/g, '').trim();
          
          if (!cleanLine) continue;
          const lower = cleanLine.toLowerCase();

          // Title detection - take first line unless it's a section header
          if (!detectedTitle) {
            if (!lower.startsWith('ingredients') && 
                !lower.startsWith('directions') && 
                !lower.startsWith('instructions') && 
                !lower.startsWith('steps') && 
                !lower.startsWith('prep time') && 
                !lower.startsWith('cook time') && 
                !lower.startsWith('servings') &&
                !lower.startsWith('prep:') &&
                !lower.startsWith('cook:')) {
              detectedTitle = cleanLine;
              continue;
            }
          }

          // Section headers switching
          if (/(?:ingredients|ingredients:|shopping\s*list|what\s*you\s*need)/i.test(cleanLine) && cleanLine.length < 24) {
            sectionMode = 'ingredients';
            continue;
          }
          if (/(?:directions|directions:|instructions|instructions:|steps|steps:|method|preparation|how\s*to\s*make)/i.test(cleanLine) && cleanLine.length < 24) {
            sectionMode = 'directions';
            continue;
          }
          if (/(?:tips?|notes?|secret|pro-tip|pro\s*tip)/i.test(cleanLine) && cleanLine.length < 24) {
            sectionMode = 'tips';
            continue;
          }

          // Search embedded info like "prep time: 10 mins" in random lines
          if (!detectedPrep) {
            const pm = cleanLine.match(/(?:prep(?:\s*time)?\s*[:\-]\s*)([0-9a-zA-Z\s\-]+)/i);
            if (pm) { detectedPrep = pm[1].trim(); continue; }
          }
          if (!detectedCook) {
            const cm = cleanLine.match(/(?:cook(?:\s*time)?\s*[:\-]\s*)([0-9a-zA-Z\s\-]+)/i);
            if (cm) { detectedCook = cm[1].trim(); continue; }
          }
          if (!detectedServings) {
            const sm = cleanLine.match(/(?:servings\s*[:\-]\s*)([0-9a-zA-Z\s\-]+)/i);
            if (sm) { detectedServings = sm[1].trim(); continue; }
          }

          // Line processing based on active section mode
          if (sectionMode === 'ingredients') {
            // Strip bullets or list numbers
            let item = cleanLine.replace(/^[\s\-*•+🧄🧅🥛🧀🥖🍗🥩🧂🍲🥚🍜🍚🍟🍕🌭🛒]*\s*/, '').trim();
            item = item.replace(/^\d+[\s\.)\-]\s*/, '').trim(); // "1. ", "2) "
            if (item) detectedIngredients.push(item);
          } else if (sectionMode === 'directions') {
            let step = cleanLine.replace(/^[\s\-*•+]*\s*/, '').trim();
            step = step.replace(/^(?:step\s*)?\d+[\s\.)\-:]\s*/i, '').trim(); // e.g., "1. " or "Step 1: "
            if (step) detectedDirections.push(step);
          } else if (sectionMode === 'tips') {
            if (!detectedSecretTip) {
              detectedSecretTip = cleanLine.replace(/^(?:tip|chef\s*tip|pro\s*tip|note)\s*[:\-]\s*/i, '').trim();
            }
          } else {
            // Fallback guesses
            if (/^[\-*•+]\s*/.test(rawLine)) {
              detectedIngredients.push(cleanLine.replace(/^[\s\-*•+]*\s*/, '').trim());
            } else if (/^\d+[\s\.)]/.test(rawLine)) {
              detectedDirections.push(cleanLine.replace(/^\d+[\s\.)\-]\s*/, '').trim());
            }
          }
        }

        // Fill form
        const titleField = document.getElementById('manualRecipeTitle') as HTMLInputElement | null;
        const prepField = document.getElementById('manualRecipePrep') as HTMLInputElement | null;
        const cookField = document.getElementById('manualRecipeCook') as HTMLInputElement | null;
        const servingsField = document.getElementById('manualRecipeServings') as HTMLInputElement | null;
        const ingredientsField = document.getElementById('manualRecipeIngredients') as HTMLTextAreaElement | null;
        const directionsField = document.getElementById('manualRecipeDirections') as HTMLTextAreaElement | null;
        const tipField = document.getElementById('manualRecipeSecretTip') as HTMLInputElement | null;

        if (titleField && detectedTitle) titleField.value = detectedTitle;
        if (prepField && detectedPrep) prepField.value = detectedPrep;
        if (cookField && detectedCook) cookField.value = detectedCook;
        if (servingsField && detectedServings) servingsField.value = detectedServings;
        if (tipField && detectedSecretTip) tipField.value = detectedSecretTip;

        if (ingredientsField && detectedIngredients.length > 0) {
          ingredientsField.value = detectedIngredients.join('\n');
        }
        if (directionsField && detectedDirections.length > 0) {
          directionsField.value = detectedDirections.join('\n');
        }

        toast('Sorted recipe details populated! Review below, then click Save.', 'success');
      });
    }

    // Save custom manual recipe listener
    const saveManualRecipeBtn = document.getElementById('saveManualRecipeBtn');
    if (saveManualRecipeBtn) {
      saveManualRecipeBtn.addEventListener('click', () => {
        const titleInput = document.getElementById('manualRecipeTitle') as HTMLInputElement | null;
        const platformSelect = document.getElementById('manualRecipePlatform') as HTMLSelectElement | null;
        const diffSelect = document.getElementById('manualRecipeDifficulty') as HTMLSelectElement | null;
        const prepInput = document.getElementById('manualRecipePrep') as HTMLInputElement | null;
        const cookInput = document.getElementById('manualRecipeCook') as HTMLInputElement | null;
        const servingsInput = document.getElementById('manualRecipeServings') as HTMLInputElement | null;
        const ingTextArea = document.getElementById('manualRecipeIngredients') as HTMLTextAreaElement | null;
        const dirTextArea = document.getElementById('manualRecipeDirections') as HTMLTextAreaElement | null;
        const tipInput = document.getElementById('manualRecipeSecretTip') as HTMLInputElement | null;

        const title = titleInput?.value.trim() || '';
        if (!title) {
          toast('Please specify a custom Recipe Name!', 'warn');
          haptic(14);
          return;
        }

        const ingText = ingTextArea?.value.trim() || '';
        const dirText = dirTextArea?.value.trim() || '';

        const parsedIngredients = ingText.split('\n').map(line => {
          const l = line.trim();
          if (!l) return null;
          const match = l.match(/^(\d+(\/\d+)?\s*\w*\.?)\s+(.*)$/);
          if (match) {
            return { name: match[3], qty: match[1], done: false };
          }
          return { name: l, qty: '1 unit', done: false };
        }).filter(Boolean);

        const parsedDirections = dirText.split('\n').map(line => line.trim()).filter(Boolean);

        if (parsedIngredients.length === 0) {
          toast('Specify at least one ingredient!', 'warn');
          haptic(14);
          return;
        }
        if (parsedDirections.length === 0) {
          toast('Specify at least one cooking step!', 'warn');
          haptic(14);
          return;
        }

        const newId = `rec_manual_${Date.now()}`;
        const manualRecipe = {
          id: newId,
          title: title,
          platform: platformSelect?.value || 'custom',
          url: '',
          difficulty: diffSelect?.value || 'Easy',
          prepTime: prepInput?.value.trim() || '10 mins',
          cookTime: cookInput?.value.trim() || '15 mins',
          servings: servingsInput?.value.trim() || '2 portions',
          ingredients: parsedIngredients,
          directions: parsedDirections,
          secretTip: tipInput?.value.trim() || 'Cook thoroughly over fire.',
          chefNotes: 'Custom handcrafted recipe.'
        };

        recipesArr.unshift(manualRecipe);
        store.set('recipes', recipesArr);

        // Clear values
        if (titleInput) titleInput.value = '';
        if (prepInput) prepInput.value = '';
        if (cookInput) cookInput.value = '';
        if (servingsInput) servingsInput.value = '';
        if (ingTextArea) ingTextArea.value = '';
        if (dirTextArea) dirTextArea.value = '';
        if (tipInput) tipInput.value = '';

        renderRecipesGrid();
        haptic([50, 100]);
        toast('Custom recipe saved to Codex!', 'success');

        // Automatically open the new handcrafted recipe modal
        setTimeout(() => {
          openRecipeModal(newId);
        }, 300);
      });
    }

    // Subtab switching
    const recipeTabSwitcher = document.getElementById('recipeTabSwitcher');
    if (recipeTabSwitcher) {
      recipeTabSwitcher.querySelectorAll('button').forEach((b: any) => {
        b.addEventListener('click', () => {
          haptic(8);
          recipeTabSwitcher.querySelectorAll('button').forEach((x: any) => x.classList.remove('active'));
          b.classList.add('active');
          
          const tabName = b.dataset.tab;
          document.querySelectorAll('.recipe-tab-content').forEach((tc: any) => {
            tc.classList.add('hidden');
          });
          const targetTab = document.getElementById('recipeTab-' + tabName);
          if (targetTab) targetTab.classList.remove('hidden');

          if (tabName === 'fusion') {
            updateFusionSelectionDisplay();
          }
        });
      });
    }

    // Helper: update tab count labels
    function updateTabLabels() {
      const switcher = document.getElementById('recipeTabSwitcher');
      if (switcher) {
        const codexBtn = switcher.querySelector('[data-tab="codex"]');
        if (codexBtn) {
          codexBtn.textContent = `Saved Codex (${recipesArr.length})`;
        }
      }
    }

    // SEARCH & FILTER FUNCTION
    const searchRecipesInput = document.getElementById('searchRecipesInput') as HTMLInputElement | null;
    if (searchRecipesInput) {
      searchRecipesInput.addEventListener('input', () => {
        renderRecipesGrid();
      });
    }

    (window as any).renderRecipesGrid = renderRecipesGrid;
    (window as any).recipeFilter = 'all';

    // RENDERING RECIPES GRID METHOD
    function renderRecipesGrid() {
      const grid = document.getElementById('recipeGrid');
      if (!grid) return;
      grid.innerHTML = '';

      const query = searchRecipesInput ? searchRecipesInput.value.toLowerCase().trim() : '';
      
      const filtered = recipesArr.filter(r => {
        let textMatch = true;
        if (query) {
          const matchesTitle = r.title.toLowerCase().includes(query);
          const matchesIngredients = r.ingredients.some((ing: any) => ing.name.toLowerCase().includes(query));
          textMatch = matchesTitle || matchesIngredients;
        }
        if (!textMatch) return false;

        const currentTag = (window as any).recipeFilter || 'all';
        if (currentTag === 'potion') {
          return r.platform === 'fusion' || r.platform === 'custom';
        }
        if (currentTag === 'food') {
          return r.platform === 'pantry';
        }
        if (currentTag === 'social') {
          return r.platform === 'youtube' || r.platform === 'instagram' || r.platform === 'facebook';
        }
        return true;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="card p-6 text-center select-none border border-dashed border-[#44387a]/40 bg-[#150f2e]/20 rounded-2xl">
            <span class="text-3xl block mb-2">🍽️</span>
            <p class="text-xs text-[#b4aae2]/60 font-semibold mb-1">No matching recipes found</p>
            <p class="text-[9.5px] text-[#b4aae2]/40">Type another query or transcribe a social video link above!</p>
          </div>
        `;
        return;
      }

      filtered.forEach((r: any) => {
        // Platform classes
        let textClass = 'text-pink-400';
        let bgClass = 'bg-pink-500/10 border-pink-500/20';
        let iconEmoji = '🍜';

        if (r.platform === 'youtube') {
          textClass = 'text-red-400';
          bgClass = 'bg-red-500/10 border-red-500/20';
          iconEmoji = '🍲';
        } else if (r.platform === 'instagram') {
          textClass = 'text-purple-400';
          bgClass = 'bg-purple-500/10 border-purple-500/20';
          iconEmoji = '🥞';
        } else if (r.platform === 'facebook') {
          textClass = 'text-blue-400';
          bgClass = 'bg-blue-500/10 border-blue-500/20';
          iconEmoji = '🍔';
        } else if (r.platform === 'fusion') {
          textClass = 'text-amber-400';
          bgClass = 'bg-amber-500/10 border-amber-500/20';
          iconEmoji = '⚗️';
        } else if (r.platform === 'pantry') {
          textClass = 'text-emerald-400';
          bgClass = 'bg-emerald-500/10 border-emerald-500/20';
          iconEmoji = '🍳';
        } else if (r.platform === 'custom') {
          textClass = 'text-[#ffe9b8]';
          bgClass = 'bg-amber-500/10 border-amber-500/20';
          iconEmoji = '📖';
        }

        const card = document.createElement('div');
        card.className = `card p-3.5 border border-[#44387a]/40 bg-gradient-to-b from-[#181134] to-[#0c081e] rounded-2xl flex flex-col justify-between hover:border-[#ff7597]/50 transition-all duration-300 relative group`;
        card.id = `card_recipe_${r.id}`;

        const tagLabel = r.platform === 'custom' ? 'Handcrafted' 
          : r.platform === 'pantry' ? 'Pantry Alchemy' 
          : r.platform === 'fusion' ? 'Fused Potion' 
          : `${r.platform} video`;

        card.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-2.5">
              <span class="text-2xl pt-0.5 shrink-0 select-none">${iconEmoji}</span>
              <div class="flex flex-col select-none">
                <span class="text-[8px] font-bold tracking-widest uppercase font-mono px-2 py-0.5 rounded-full border ${bgClass} ${textClass} w-fit mb-1.5">${tagLabel}</span>
                <h4 class="text-xs font-bold text-white leading-snug cursor-pointer hover:text-[#ff7597] transition-colors duration-200 uppercase tracking-wide flex-grow" data-open="${r.id}" style="font-family: 'Cormorant', serif;">${r.title}</h4>
              </div>
            </div>
            
            <div class="flex items-center gap-2 select-none shrink-0 pt-0.5">
              <input 
                type="checkbox" 
                data-fuse-select="${r.id}"
                class="w-3.5 h-3.5 accent-[#ff7597] cursor-pointer" 
                title="Select recipe to fuse"
              />
              <button 
                data-delete-recipe="${r.id}"
                className="w-5 h-5 flex items-center justify-center text-red-400/60 hover:text-red-400 bg-[#120a24]/80 hover:bg-red-500/10 border border-red-500/10 rounded-md transition-all duration-200 cursor-pointer focus:outline-none"
                title="Delete from Codex"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-1.5 border-t border-[#44387a]/20 pt-2.5 mt-3 text-center leading-none select-none text-[9.5px] text-[#b4aae2]/70 font-mono">
            <div>
              <span class="block text-[#ffe9b8] font-bold mb-0.5">${r.difficulty}</span>
              <span class="text-[8px] opacity-60">diff</span>
            </div>
            <div>
              <span class="block text-white font-semibold mb-0.5">${r.prepTime}</span>
              <span class="text-[8px] opacity-60">prep</span>
            </div>
            <div>
              <span class="block text-white font-semibold mb-0.5">${r.cookTime}</span>
              <span class="text-[8px] opacity-60">cook</span>
            </div>
          </div>
        `;

        // Direct click event listener for open details
        const titleEl = card.querySelector('[data-open]');
        if (titleEl) {
          titleEl.addEventListener('click', () => {
            openRecipeModal(r.id);
          });
        }

        // Delete button listener
        const delBtn = card.querySelector('[data-delete-recipe]');
        if (delBtn) {
          delBtn.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            haptic(14);
            if (confirm(`Do you want to delete "${r.title}" from your Alchemical Codex?`)) {
              recipesArr = recipesArr.filter(item => item.id !== r.id);
              store.set('recipes', recipesArr);
              renderRecipesGrid();
              updateTabLabels();
              toast('Recipe removed from codex', 'warn');
            }
          });
        }

        // Checkbox listener to update merge list dynamically
        const fuseCheck = card.querySelector('[data-fuse-select]') as HTMLInputElement | null;
        if (fuseCheck) {
          fuseCheck.addEventListener('change', () => {
            haptic(10);
            updateFusionSelectionDisplay();
          });
        }

        grid.appendChild(card);
      });

      updateTabLabels();
    }

    // INTERACTIVE DETAILS MODAL LOADER
    function openRecipeModal(id: string) {
      const r = recipesArr.find(item => item.id === id);
      if (!r) return;
      activeRecipe = r;
      haptic(12);

      // Stop any running cooking timer first
      resetCookingTimer();

      const modal = document.getElementById('recipeDetailModal');
      if (!modal) return;

      // Unhide
      modal.classList.remove('hidden');

      // Hydrate
      const titleEl = document.getElementById('modalTitle');
      if (titleEl) titleEl.textContent = r.title;

      const badge = document.getElementById('modalPlatformBadge');
      if (badge) {
        badge.textContent = r.platform.toUpperCase();
        badge.className = `text-[8px] font-mono font-bold px-2 py-0.5 rounded-md inline-block w-fit uppercase mb-1 `;
        if (r.platform === 'youtube') badge.classList.add('bg-red-500/10', 'text-red-400');
        else if (r.platform === 'tiktok') badge.classList.add('bg-pink-500/10', 'text-pink-400');
        else if (r.platform === 'instagram') badge.classList.add('bg-purple-500/10', 'text-purple-400');
        else if (r.platform === 'facebook') badge.classList.add('bg-blue-500/10', 'text-blue-400');
        else badge.classList.add('bg-amber-500/10', 'text-amber-400');
      }

      const diffLabel = document.getElementById('modalDifficulty');
      if (diffLabel) diffLabel.textContent = r.difficulty;

      const prepLabel = document.getElementById('modalPrepTime');
      if (prepLabel) prepLabel.textContent = r.prepTime;

      const cookLabel = document.getElementById('modalCookTime');
      if (cookLabel) cookLabel.textContent = r.cookTime;

      const servLabel = document.getElementById('modalServings');
      if (servLabel) servLabel.textContent = r.servings;

      const sourceSub = document.getElementById('modalVideoSubtitle');
      if (sourceSub) sourceSub.textContent = r.url ? r.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 32) + '...' : 'unspecified video address';

      const sourceLink = document.getElementById('modalVideoLink') as HTMLAnchorElement | null;
      if (sourceLink) {
        sourceLink.href = r.url || '#';
        sourceLink.style.display = r.url ? 'inline-block' : 'none';
      }

      const secretTip = document.getElementById('modalSecretTip');
      if (secretTip) secretTip.textContent = r.secretTip || 'Whisk your ingredients thoroughly before applying fire!';

      const inputNotes = document.getElementById('modalChefNotesInput') as HTMLTextAreaElement | null;
      if (inputNotes) inputNotes.value = r.chefNotes || '';

      // Ingredients with interactive checkboxes
      const ingCont = document.getElementById('modalIngredientsList');
      if (ingCont) {
        ingCont.innerHTML = '';
        r.ingredients.forEach((ing: any, idx: number) => {
          const item = document.createElement('div');
          item.className = 'flex items-center justify-between gap-3 text-xs py-1 border-b border-[#44387a]/10 last:border-0';
          item.innerHTML = `
            <div class="flex items-center gap-2.5">
              <input 
                type="checkbox" 
                data-ing-idx="${idx}"
                ${ing.done ? 'checked' : ''}
                class="w-4 h-4 accent-[#ff7597] cursor-pointer"
              />
              <span class="text-[#faebd7] font-sans ${ing.done ? 'line-through text-[#b4aae2]/40' : ''}">${ing.name}</span>
            </div>
            <span class="font-mono text-[10.5px] font-bold text-[#ff7597] shrink-0">${ing.qty}</span>
          `;
          
          item.querySelector('input')?.addEventListener('change', (e: any) => {
            haptic(11);
            const isChecked = e.target.checked;
            ing.done = isChecked;
            
            // Reapply cross styling
            const textSpan = item.querySelector('span');
            if (textSpan) textSpan.className = `text-[#faebd7] font-sans ${isChecked ? 'line-through text-[#b4aae2]/40' : ''}`;
            
            // Commit to parent array immediately
            store.set('recipes', recipesArr);
            checkAllIngredientsShine();
          });

          ingCont.appendChild(item);
        });
        checkAllIngredientsShine();
      }

      // Directions list layout
      const dirCont = document.getElementById('modalDirectionsList');
      if (dirCont) {
        dirCont.innerHTML = '';
        r.directions.forEach((step: string, idx: number) => {
          const stepDiv = document.createElement('div');
          stepDiv.className = 'flex gap-3 text-[11.5px] items-start';
          stepDiv.innerHTML = `
            <div class="w-5 h-5 rounded-full bg-[#ff7597]/15 border border-[#ff7597]/40 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono text-[#ff7597] mt-0.5 select-none">${idx + 1}</div>
            <p class="leading-relaxed text-[#b4aae2]/90 font-sans">${step}</p>
          `;
          dirCont.appendChild(stepDiv);
        });
      }
    }

    function checkAllIngredientsShine() {
      const checkboxes = document.querySelectorAll('#modalIngredientsList input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      const modalBox = document.querySelector('#modalIngredientsList');
      if (checkboxes.length === 0 || !modalBox) return;

      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      if (allChecked) {
        modalBox.classList.add('border-green-500/40', 'bg-green-500/5');
      } else {
        modalBox.classList.remove('border-green-500/40', 'bg-green-500/5');
      }
    }

    // Modal close
    const closeModalBtn = document.getElementById('closeRecipeModalBtn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        haptic(14);
        resetCookingTimer();
        document.getElementById('recipeDetailModal')?.classList.add('hidden');
        renderRecipesGrid();
      });
    }

    // Save active chef notes on key input
    const modalChefNotesInput = document.getElementById('modalChefNotesInput') as HTMLTextAreaElement | null;
    if (modalChefNotesInput) {
      modalChefNotesInput.addEventListener('input', () => {
        if (activeRecipe) {
          activeRecipe.chefNotes = modalChefNotesInput.value;
          store.set('recipes', recipesArr);
        }
      });
    }

    // BUILT-IN COOKING TIMER CONTROLLER
    const cookingTimerBtn = document.getElementById('cookingTimerBtn');
    const cookingTimerDisplay = document.getElementById('cookingTimerDisplay');
    
    if (cookingTimerBtn && cookingTimerDisplay) {
      cookingTimerBtn.addEventListener('click', () => {
        haptic(8);
        if (cookingTimerInterval) {
          // Stop timer
          resetCookingTimer();
        } else {
          // Trigger timer start using pre-determined duration or default 3 minutes (185s)
          if (cookingTimerSecondsLeft === 0) {
            cookingTimerSecondsLeft = 180; // Default
          }
          startCookingTimerEng();
        }
      });
    }

    // Preset minutes click hooks
    document.querySelectorAll('[data-mins]').forEach((btn: any) => {
      btn.addEventListener('click', () => {
        haptic(10);
        cookingTimerSecondsLeft = parseInt(btn.dataset.mins, 10) * 60;
        updateCookingTimerDisplay();
      });
    });

    function updateCookingTimerDisplay() {
      if (!cookingTimerDisplay) return;
      const mins = Math.floor(cookingTimerSecondsLeft / 60);
      const secs = cookingTimerSecondsLeft % 60;
      cookingTimerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function startCookingTimerEng() {
      if (!cookingTimerBtn || !cookingTimerDisplay) return;
      cookingTimerBtn.textContent = 'STOP TIMER';
      cookingTimerBtn.classList.replace('from-amber-500', 'from-red-500');
      cookingTimerBtn.classList.replace('to-amber-600', 'to-red-600');
      
      cookingTimerInterval = setInterval(() => {
        if (cookingTimerSecondsLeft > 0) {
          cookingTimerSecondsLeft--;
          updateCookingTimerDisplay();
          
          if (cookingTimerSecondsLeft === 0) {
            // FINISHED! Alert and Ring
            haptic([100, 50, 100, 50, 150]);
            toast('Cooking Alchemist alert: Cook step is complete! 🛎️', 'warn');
            flashCookingTimerUi();
            resetCookingTimer();
          }
        } else {
          resetCookingTimer();
        }
      }, 1000);
    }

    function resetCookingTimer() {
      if (cookingTimerInterval) {
        clearInterval(cookingTimerInterval);
        cookingTimerInterval = null;
      }
      if (cookingTimerBtn) {
        cookingTimerBtn.textContent = 'START TIMER';
        cookingTimerBtn.classList.replace('from-red-500', 'from-amber-500');
        cookingTimerBtn.classList.replace('to-red-600', 'to-amber-600');
      }
      updateCookingTimerDisplay();
    }

    function flashCookingTimerUi() {
      const display = document.getElementById('cookingTimerDisplay');
      if (display) {
        display.classList.add('text-red-500', 'animate-bounce');
        setTimeout(() => {
          display.classList.remove('text-red-500', 'animate-bounce');
        }, 3000);
      }
    }


    // FUSION BENCH CONTROLLING LOGIC
    function updateFusionSelectionDisplay() {
      const listCont = document.getElementById('fusionSelectionList');
      const fuseBtn = document.getElementById('fuseRecipesBtn') as HTMLButtonElement | null;
      
      if (!listCont) return;

      const checkedBoxes = Array.from(document.querySelectorAll('[data-fuse-select]:checked')) as HTMLInputElement[];
      const checkedIds = checkedBoxes.map(cb => cb.dataset.fuseSelect);

      if (checkedIds.length === 0) {
        listCont.innerHTML = `<div class="italic text-[#b4aae2]/50 text-[10.5px]">No recipes selected. Return to Saved Codex tab to check fusion boxes!</div>`;
        if (fuseBtn) {
          fuseBtn.disabled = true;
          fuseBtn.textContent = 'AUTOCLAVE RECIPES ⚗️';
        }
        return;
      }

      listCont.innerHTML = '';
      const selectedRecipes = recipesArr.filter(r => checkedIds.includes(r.id));
      
      selectedRecipes.forEach(sr => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 py-1 px-2.5 rounded-lg bg-[#2e1d16]/30 border border-[#44387a]/20 text-[11px] text-[#faebd7]';
        row.innerHTML = `🧬 <span class="font-bold truncate">${sr.title}</span>`;
        listCont.appendChild(row);
      });

      if (fuseBtn) {
        if (selectedRecipes.length >= 2) {
          fuseBtn.disabled = false;
          fuseBtn.textContent = `FUSE ${selectedRecipes.length} CODICES ⚗️`;
        } else {
          fuseBtn.disabled = true;
          fuseBtn.textContent = 'SELECT MORE FOR FUSION';
        }
      }
    }

    // Merge Click actions
    const fuseRecipesBtn = document.getElementById('fuseRecipesBtn');
    if (fuseRecipesBtn) {
      fuseRecipesBtn.addEventListener('click', () => {
        haptic([40, 30, 40, 30, 80]);
        executeFusionProcess();
      });
    }

    function executeFusionProcess() {
      const checkedBoxes = Array.from(document.querySelectorAll('[data-fuse-select]:checked')) as HTMLInputElement[];
      const checkedIds = checkedBoxes.map(cb => cb.dataset.fuseSelect);
      const selected = recipesArr.filter(r => checkedIds.includes(r.id));
      if (selected.length < 2) return;

      const btn = document.getElementById('fuseRecipesBtn') as HTMLButtonElement | null;
      const label = document.getElementById('fusionStatusLabel');
      const flames = document.getElementById('fusionFlames');
      const kettle = document.getElementById('fusionCauldron');

      if (btn) btn.disabled = true;
      if (flames) flames.setAttribute('fill', '#f59e0b'); // Turn flame golden!
      if (kettle) kettle.classList.add('animate-bounce');

      let timer = 0;
      const textSteps = [
        'IGNITING MAGIC FURNACE...',
        'PULVERIZING INGREDIENTS...',
        'COMBINING CHEMICAL COMPOUNDS...',
        'CONSOLIDATING POTION CODES...',
        'SYNTESIZING EXOTIC FLAVORS!'
      ];

      const interval = setInterval(() => {
        if (timer < textSteps.length) {
          if (label) {
            label.textContent = textSteps[timer];
            label.className = 'text-[10px] uppercase font-mono font-bold mt-3 text-amber-400';
          }
          haptic(12);
          timer++;
        } else {
          clearInterval(interval);
          completeFusionCreation(selected);
        }
      }, 350);
    }

    function completeFusionCreation(selected: any[]) {
      const btn = document.getElementById('fuseRecipesBtn') as HTMLButtonElement | null;
      const label = document.getElementById('fusionStatusLabel');
      const flames = document.getElementById('fusionFlames');
      const kettle = document.getElementById('fusionCauldron');

      if (flames) flames.setAttribute('fill', '#ff7597');
      if (kettle) kettle.classList.remove('animate-bounce');

      // Create a beautiful alchemical fuse name
      const titleParts = selected.map(s => s.title.replace(/Viral|TikTok|Babish’s|Instagram|Oven|Baked/g, '').trim());
      const newTitle = `${titleParts[0].slice(0, 15)} ${titleParts[1].slice(0, 15)} Hybrid Potion`;

      // Consolidate ingredients list
      const mergedIngredients: any[] = [];
      selected.forEach(s => {
        s.ingredients.forEach((ing: any) => {
          if (!mergedIngredients.some(x => x.name.toLowerCase() === ing.name.toLowerCase())) {
            mergedIngredients.push({ name: ing.name, qty: ing.qty, done: false });
          }
        });
      });

      // Assemble steps
      const newDirections = [
        `Whisk your ${mergedIngredients[0]?.name || 'base elements'} while heating the alchemical burner.`,
        `Gently simmer the combined compounds (${mergedIngredients.slice(1, 4).map(x => x.name).join(', ')}).`,
        `Infuse slowly under low fire while incorporating the remainder of your alchemical codex elements.`,
        `Garnish beautifully with custom syrups, serve hot inside a secure dungeon container!`
      ];

      const newId = `rec_fuse_${Date.now()}`;
      const fusedRecipe = {
        id: newId,
        title: `Fused ${newTitle} ⚗️`,
        platform: 'fusion',
        url: '',
        difficulty: 'Hard',
        prepTime: '15 mins',
        cookTime: '30 mins',
        servings: '3 servings',
        ingredients: mergedIngredients,
        directions: newDirections,
        secretTip: 'This exotic food hybrid fuses contradictory recipes. Pair with absolute culinary adventure!',
        chefNotes: 'Potent alchemical food compound. Generated via dual crucible merges.'
      };

      recipesArr.unshift(fusedRecipe);
      store.set('recipes', recipesArr);

      // Uncheck old items
      document.querySelectorAll('[data-fuse-select]').forEach((cb: any) => {
        cb.checked = false;
      });

      renderRecipesGrid();
      updateFusionSelectionDisplay();
      
      // Toast and pop
      toast('Fusion complete! Potion appended to Codex', 'success');
      haptic([80, 50, 120]);

      if (label) {
        label.textContent = 'POTION CRUCIBLE READY';
        label.className = 'text-[10px] uppercase font-mono font-bold mt-3 text-green-400';
      }

      // Automatically open the fused recipe item to delight the user!
      setTimeout(() => {
        openRecipeModal(newId);
      }, 500);
    }



    // SOCIAL LINK DECOPRILER / EXTRACTOR ENGINE
    const extractRecipeInput = document.getElementById('extractRecipeInput') as HTMLInputElement | null;
    const extractRecipeBtn = document.getElementById('extractRecipeBtn');
    
    if (extractRecipeBtn) {
      extractRecipeBtn.addEventListener('click', () => {
        if (!extractRecipeInput || !extractRecipeInput.value.trim()) {
          toast('Specify a social media link to decode!', 'warn');
          haptic(14);
          return;
        }

        haptic(10);
        executeExtractSimulation(extractRecipeInput.value.trim());
      });
    }

    function executeExtractSimulation(linkUrl: string) {
      const logsCont = document.getElementById('extractionLogsContainer');
      const logsList = document.getElementById('extractionLogsList');
      const btn = document.getElementById('extractRecipeBtn') as HTMLButtonElement | null;
      
      if (!logsCont || !logsList) return;

      // Show container
      logsCont.classList.remove('hidden');
      logsList.innerHTML = '';
      if (btn) btn.disabled = true;

      const stepsLogs = [
        'Connecting to social media viewport API...',
        'Parsing audio spectrum & harvesting captions...',
        'Decoding frame transitions for ingredient visual matching...',
        'Weighing element units & estimating temperature limits...',
        'Compiling gourmet D&D recipe schema...'
      ];

      let logTimer = 0;
      const logInterval = setInterval(() => {
        if (logTimer < stepsLogs.length) {
          const l = document.createElement('div');
          l.className = 'fade-in';
          l.textContent = `> ${stepsLogs[logTimer]}`;
          logsList.appendChild(l);
          
          // Scroll bottom
          logsCont.scrollTop = logsCont.scrollHeight;
          haptic(7);
          logTimer++;
        } else {
          clearInterval(logInterval);
          finalizeExtractionResult(linkUrl);
        }
      }, 300);
    }

    function finalizeExtractionResult(linkUrl: string) {
      const logsCont = document.getElementById('extractionLogsContainer');
      const btn = document.getElementById('extractRecipeBtn') as HTMLButtonElement | null;
      if (logsCont) logsCont.classList.add('hidden');
      if (btn) btn.disabled = false;

      // Deduce platform from host name
      let platform = 'tiktok';
      if (linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')) platform = 'youtube';
      else if (linkUrl.includes('instagram.com')) platform = 'instagram';
      else if (linkUrl.includes('facebook.com')) platform = 'facebook';

      // Smart dynamic decopiling templates matching keywords from url
      const lower = linkUrl.toLowerCase();
      let dTitle = 'Zesty Basil Feta Pasta';
      let dIngredients = [
        { name: 'Pasta spaghetti noodles', qty: '12 oz', done: false },
        { name: 'Fresh Feta cheese block', qty: '8 oz', done: false },
        { name: 'Cherry Tomatoes', qty: '2 cups', done: false },
        { name: 'Olive oil Extra virgin', qty: '1/3 cup', done: false },
        { name: 'Garlic minced', qty: '4 cloves', done: false },
        { name: 'Fresh basil leaves', qty: '10 leaves', done: false }
      ];
      let dDirections = [
        'Preheat convection cauldron or oven to 400°F (200°C).',
        'Toss whole tomatoes, garlic cloves, and olive oil inside a wide ceramic skillet dish.',
        'Place the block of feta cheese directly in the center of the skillet, rolling inside grease.',
        'Roast in oven for 30 minutes until tomatoes explode and feta is beautifully melted.',
        'Gently crush the baked structures with a grand fork, tossing with hot freshly boiled pasta and fresh basil.'
      ];
      let dDiff = 'Easy';
      let dPrep = '10 mins';
      let dCook = '30 mins';
      let dServ = '3 servings';
      
      if (lower.includes('ramen') || lower.includes('noodle')) {
        dTitle = 'Fiery Chili Soy Instant Scallion Noodles';
        dPrep = '5 mins'; dCook = '5 mins';
        dIngredients = [
          { name: 'Instant Hand-Pulled noodles', qty: '1 block', done: false },
          { name: 'Soy sauce dark', qty: '1.5 tbsp', done: false },
          { name: 'Toasted sesame oil', qty: '1 tsp', done: false },
          { name: 'Crushed raw scallions', qty: '3 tbsp', done: false },
          { name: 'Hot chili crisp oil', qty: '1 tbsp', done: false }
        ];
        dDirections = [
          'Boil instant noodles blocks for 4 minutes in salted cauldrons, draining completely.',
          'Pour raw scallions and chili crisp directly into your glass bowl center.',
          'Flash sizzle the dry spices with a tablespoon of boiling neutral butter or oil.',
          'Whisk soy sauce and sesame oil into the chili grease, adding drained noodles last.'
        ];
      } else if (lower.includes('burger') || lower.includes('steak') || lower.includes('meat') || lower.includes('beef')) {
        dTitle = 'Premium Double Crust Smash Cheese Burgers';
        dDiff = 'Medium'; dPrep = '15 mins'; dCook = '10 mins';
        dIngredients = [
          { name: 'Ground Angus Beef chuck (80/20)', qty: '1/2 lb', done: false },
          { name: 'Slices Premium Cheddar cheese', qty: '2 slices', done: false },
          { name: 'Soft potato buns (buttered)', qty: '1 pair', done: false },
          { name: 'Finely diced sweet onions', qty: '1/4 cup', done: false },
          { name: 'Secret burger mustard mayo sauce', qty: '2 tbsp', done: false }
        ];
        dDirections = [
          'Preheat a cast-iron skillet grid till heavy smoke rises over full heat.',
          'Form burger beef into two dense spherical balls, placing on dry skillet.',
          'Press down with complete metal spatula force till flat crusted discs form.',
          'Season with sea salt, flip in 2 minutes, apply cheese, stack pairs, and serve bunned.'
        ];
      } else if (lower.includes('taco') || lower.includes('birria')) {
        dTitle = 'Gourmet Crispy Smashed Birria Quesatacos';
        dDiff = 'Medium'; dPrep = '15 mins'; dCook = '15 mins';
        dIngredients = [
          { name: 'Pulled dry beef barbacoa', qty: '1 cup', done: false },
          { name: 'Corn tortillas', qty: '3', done: false },
          { name: 'Grated Monterey cheese', qty: '1 cup', done: false },
          { name: 'Cilantro and lime juice', qty: 'for garnish', done: false },
          { name: 'Barbacoa dipping consumé bouillon', qty: '1 cup', done: false }
        ];
        dDirections = [
          'Dip corn tortillas directly into the warm dipping consumé fat layer.',
          'Lay tortillas wet onto a roaring hot skillet, covering with grated cheese and beef.',
          'Fold tacos into crescents, pressing down till exceptionally crispy on borders.',
          'Garnish with onion, cilantro, and squeeze fresh lime. Serve with rich consumé cups.'
        ];
      } else if (lower.includes('cookie') || lower.includes('chocolate') || lower.includes('cake') || lower.includes('sweet') || lower.includes('pudding')) {
        dTitle = 'Salty Chocolate Giant Skillet Fudge Cookie';
        dDiff = 'Easy'; dPrep = '10 mins'; dCook = '15 mins'; dServ = '4 portions';
        dIngredients = [
          { name: 'Unsalted sweet butter melt', qty: '1/2 cup', done: false },
          { name: 'Gourmet dark chocolate chips', qty: '1.5 cups', done: false },
          { name: 'Brown sugar packed', qty: '1/2 cup', done: false },
          { name: 'All-Purpose flour', qty: '1.2 cups', done: false },
          { name: 'Whole egg & vanilla extract', qty: '1 pkg', done: false }
        ];
        dDirections = [
          'Preheat your home convection oven or iron crucible to 350°F (175°C).',
          'Stir warm melted butter, brown sugar, eggs, and vanilla till satin rich.',
          'Fold sifted flour and chocolate chips cleanly, forming dense cookie dough.',
          'Press cookie dough directly into the bottom of a greased cast iron skillet.',
          'Bake for 15 minutes till edge rim is golden brown, leaving center gooey. Top with salt!'
        ];
      } else if (lower.includes('chicken') || lower.includes('wing') || lower.includes('fried')) {
        dTitle = 'Air-Fryer Sticky Honey Garlic Sriracha Wings';
        dPrep = '10 mins'; dCook = '20 mins';
        dIngredients = [
          { name: 'Fresh chicken wings (split)', qty: '1.5 lbs', done: false },
          { name: 'Baking powder and salt', qty: '1 tbsp', done: false },
          { name: 'Liquid raw honey', qty: '1/4 cup', done: false },
          { name: 'Sriracha red chili paste', qty: '2 tbsp', done: false },
          { name: 'Grated raw ginger & garlic', qty: '2 tsp', done: false }
        ];
        dDirections = [
          'Pat splits fully dry with towels, dusting in baking powder & salt for crisp.',
          'Air-fry splits inside baskets at 400°F (200°C) for 20 minutes, shaking midway.',
          'Simmer honey, sriracha, ginger, garlic in a saucepan until sticky glaze wraps.',
          'Toss piping hot wings inside bowls of sticky glaze coating every surface.'
        ];
      } else {
        // Generative platform name templates
        const linkWords = lower.replace(/https?:\/\/|www\.|youtube|tiktok|instagram|facebook|\.com|\.org|\/|video|watch|p/g, ' ').replace(/[^a-zA-Z ]/g, '').trim().split(' ');
        const creatorName = linkWords[0] ? linkWords[0].charAt(0).toUpperCase() + linkWords[0].slice(1) : 'Gourmet';
        const recipeWord = linkWords[1] ? linkWords[1].charAt(0).toUpperCase() + linkWords[1].slice(1) : 'Specialty';
        
        dTitle = `${creatorName}’s Secret ${recipeWord} Delight`;
      }

      const generatedId = `rec_extract_${Date.now()}`;
      const extractedRecipe = {
        id: generatedId,
        title: dTitle,
        platform: platform,
        url: linkUrl,
        difficulty: dDiff,
        prepTime: dPrep,
        cookTime: dCook,
        servings: dServ,
        ingredients: dIngredients,
        directions: dDirections,
        secretTip: 'Watch the video pacing on the social link directly to replicate the creator’s specific flipping speed!',
        chefNotes: `Extracted successfully from: ${linkUrl}`
      };

      recipesArr.unshift(extractedRecipe);
      store.set('recipes', recipesArr);
      
      // Clear input
      if (extractRecipeInput) extractRecipeInput.value = '';

      renderRecipesGrid();
      haptic([50, 100]);
      toast('Social media link transcribed into Codex!', 'success');

      // Bounce and open item!
      setTimeout(() => {
        openRecipeModal(generatedId);
      }, 500);
    }



    // PANTRY STAPLES SYNTHESIS CONTROLLER
    const pantryStaples = [
      'Chicken Breast', 'Eggs', 'Rice', 'Cheddar Cheese', 'Garlic Cloves', 
      'Soy Sauce', 'Butter', 'Bread Loaf', 'Potatoes', 'Avocado', 
      'Milk', 'Chocolate Chips', 'Tomato Sauce', 'Chili Flakes', 'Honey', 'Pasta Noodles'
    ];

    // Combine custom items with default ones
    function renderPantryShelves() {
      const parent = document.getElementById('pantryShelvesGrid');
      if (!parent) return;
      parent.innerHTML = '';

      const fullPantry = Array.from(new Set([...pantryStaples, ...customPantryItems]));

      fullPantry.forEach(item => {
        const isChecked = pantryChecked.includes(item);
        const itemBox = document.createElement('div');
        itemBox.className = `flex items-center gap-2 py-1.5 px-2.5 rounded-xl border border-[#44387a]/20 bg-[#120a24]/40 select-none`;
        itemBox.innerHTML = `
          <input 
            type="checkbox" 
            data-pantry-item="${item}"
            ${isChecked ? 'checked' : ''}
            class="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
          />
          <span class="text-[10.5px] text-[#b4aae2] font-semibold truncate flex-grow">${item}</span>
        `;

        itemBox.querySelector('input')?.addEventListener('change', (e: any) => {
          haptic(8);
          const checked = e.target.checked;
          if (checked) {
            if (!pantryChecked.includes(item)) pantryChecked.push(item);
          } else {
            pantryChecked = pantryChecked.filter(x => x !== item);
          }
          store.set('pantryChecked', pantryChecked);
        });

        parent.appendChild(itemBox);
      });
    }

    // Add item to pantry
    const addPantryBtn = document.getElementById('addPantryBtn');
    const addPantryInput = document.getElementById('addPantryInput') as HTMLInputElement | null;
    if (addPantryBtn && addPantryInput) {
      const handleAdd = () => {
        const val = addPantryInput.value.trim();
        if (!val) return;
        haptic(10);
        if (!customPantryItems.includes(val) && !pantryStaples.includes(val)) {
          customPantryItems.push(val);
          store.set('customPantryItems', customPantryItems);
          
          // Auto-check it
          if (!pantryChecked.includes(val)) pantryChecked.push(val);
          store.set('pantryChecked', pantryChecked);

          addPantryInput.value = '';
          renderPantryShelves();
          toast(`Added "${val}" to cooking storage shelves!`);
        } else {
          toast('Item already stored on shelves!', 'warn');
        }
      };

      addPantryBtn.addEventListener('click', handleAdd);
      addPantryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdd();
      });
    }

    // Clear checked elements
    const clearPantryBtn = document.getElementById('clearPantryBtn');
    if (clearPantryBtn) {
      clearPantryBtn.addEventListener('click', () => {
        haptic(14);
        pantryChecked = [];
        store.set('pantryChecked', pantryChecked);
        renderPantryShelves();
        toast('Pantry checklist reset', 'warn');
      });
    }

    // CREATE FROM PANTRY CLICK ACTION
    const synthesizePantryBtn = document.getElementById('synthesizePantryBtn');
    if (synthesizePantryBtn) {
      synthesizePantryBtn.addEventListener('click', () => {
        if (pantryChecked.length === 0) {
          toast('Check some ingredients on your shelves first!', 'warn');
          haptic(14);
          return;
        }

        haptic(12);
        executePantrySynthesis();
      });
    }

    function executePantrySynthesis() {
      // Formulate custom dynamic recipes using their checked items!
      const items = [...pantryChecked];
      
      let synthTitle = 'Alchemist’s Custom Stir-Fry Concoction';
      let rDiff = 'Medium';
      let rPrep = '10 mins';
      let rCook = '12 mins';

      const listIng = items.map(it => {
        return { name: it, qty: 'as desired', done: false };
      });

      // Assemble instructions dynamically
      const flowDirections = [
        `Meticulously arrange and clean your kitchen workspace, gathering: ${items.join(', ')}.`,
        `Chop and slice solids into equal weight parcels so heating transfers smoothly.`,
        `Preheat your primary cooking cauldron or metal skillet to a medium-high temperature.`,
        `Cook checked pantry elements thoroughly, introducing seasonings, fats, or oils.`,
        `Glaze and toss with available sauces. Garnish warm inside a luxury plate bowls & enjoy!`
      ];

      if (items.includes('Eggs') && items.includes('Rice')) {
        synthTitle = 'Golden Pantry Egg Fried Rice';
        rDiff = 'Easy'; rPrep = '5 mins'; rCook = '8 mins';
      } else if (items.includes('Pasta Noodles') && items.includes('Tomato Sauce')) {
        synthTitle = 'Savory Pantry Tomato Glazed Linguine';
        rDiff = 'Easy'; rCook = '15 mins';
      } else if (items.includes('Chicken Breast') && items.includes('Garlic Cloves')) {
        synthTitle = 'Sautéed Garlic Rosemary Chicken Breast';
        rCook = '15 mins';
      } else if (items.includes('Potatoes') && items.includes('Butter')) {
        synthTitle = 'Satin Smooth Whipped Butter Mashed Potatoes';
        rDiff = 'Easy'; rCook = '20 mins';
      }

      const newId = `rec_synth_${Date.now()}`;
      const customRecipe = {
        id: newId,
        title: `Pantry ${synthTitle} 🍳`,
        platform: 'pantry',
        url: '',
        difficulty: rDiff,
        prepTime: rPrep,
        cookTime: rCook,
        servings: '2 portions',
        ingredients: listIng,
        directions: flowDirections,
        secretTip: 'Since this is synthesized purely using items on hand, adjust cook times according to pan volume!',
        chefNotes: 'Formulated dynamically from kitchen shelves checklists.'
      };

      recipesArr.unshift(customRecipe);
      store.set('recipes', recipesArr);

      renderRecipesGrid();
      haptic([70, 100]);
      toast('Dynamic pantry recipe formulated! 🍳', 'success');

      // Pop details
      setTimeout(() => {
        openRecipeModal(newId);
      }, 500);
    }

    // Initial Renders
    renderRecipesGrid();
    renderPantryShelves();

    /* ============ COMPANION BOT ============ */
    let companionMessages = store.get('companion_messages', [
      {
        sender: 'bot',
        text: "Greetings, traveler of the Rift! I am OFFLINE_BOT — your personal, fully local, zero-latency companion. I match patterns in what you type and reply from my alchemical scripts.",
        timestamp: Date.now()
      }
    ]);
    let companionAttachedNotes: number[] = [];
    let companionAttachedRecipes: string[] = [];
    let companionAttachedTasks: number[] = [];

    function saveCompanionMessages() {
      store.set('companion_messages', companionMessages);
    }

    function renderCompanionMessages() {
      const windowEl = document.getElementById('companionChatWindow');
      if (!windowEl) return;
      windowEl.innerHTML = '';

      companionMessages.forEach((msg: any) => {
        const row = document.createElement('div');
        
        let attachmentsMarkup = '';
        if (msg.attachments && msg.attachments.length > 0) {
          attachmentsMarkup = `
            <div class="flex flex-wrap gap-1 mt-1.5 justify-end">
              ${msg.attachments.map((att: any) => `
                <span class="text-[8.5px] px-1.5 py-0.5 rounded bg-white/5 text-[#cf4fe6] border border-[#cf4fe6]/20 font-mono">
                  ${att.type === 'note' ? '📝' : att.type === 'recipe' ? '🍳' : '📌'} ${att.title}
                </span>
              `).join('')}
            </div>
          `;
        }

        const bubble = document.createElement('div');
        if (msg.sender === 'user') {
          row.className = 'flex items-start justify-end gap-2 w-full animate-fade-in';
          bubble.className = 'max-w-[80%] bg-[#cf4fe6]/15 border border-[#cf4fe6]/30 text-white rounded-2xl rounded-tr-none px-3.5 py-2 text-xs shadow-md leading-relaxed';
          bubble.innerHTML = `<div>${msg.text}</div>${attachmentsMarkup}`;
          row.appendChild(bubble);
        } else {
          row.className = 'flex items-start gap-2.5 w-full animate-fade-in';
          
          // Outer avatar container
          const avatarContainer = document.createElement('div');
          avatarContainer.className = 'w-9 h-9 shrink-0 select-none';
          avatarContainer.innerHTML = `
            <svg class="w-9 h-9 rounded-full bg-[#0d071c] border border-[#cf4fe6]/40 p-0.5 shadow-[0_0_8px_rgba(207,79,230,0.3)] filter-holo-glow wizard-flame" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="wiz-flame-${Math.random()}" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stop-color="#4c1d95" stop-opacity="0" />
                  <stop offset="30%" stop-color="#7c3aed" stop-opacity="0.6" />
                  <stop offset="70%" stop-color="#c084fc" stop-opacity="0.85" />
                  <stop offset="100%" stop-color="#f472b6" stop-opacity="1" />
                </linearGradient>
                <radialGradient id="wiz-hood-${Math.random()}" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stop-color="#1e113a" />
                  <stop offset="50%" stop-color="#0a0518" />
                  <stop offset="100%" stop-color="#020105" />
                </radialGradient>
              </defs>
              <g opacity="0.8">
                <path d="M 20,80 Q 5,50 15,25 Q 30,55 45,75 Z" fill="url(#wiz-flame)" />
                <path d="M 80,80 Q 95,50 85,25 Q 70,55 55,75 Z" fill="url(#wiz-flame)" />
                <path d="M 50,90 Q 30,60 50,15 Q 70,60 50,90 Z" fill="url(#wiz-flame)" />
              </g>
              <path d="M 12,38 C 5,28 10,22 28,32 Z" fill="#8a614d" stroke="#52392c" stroke-width="1" />
              <path d="M 88,38 C 95,28 90,22 72,32 Z" fill="#8a614d" stroke="#52392c" stroke-width="1" />
              <path d="M 20,78 Q 50,10 80,78 Q 50,55 20,78 Z" fill="url(#wiz-hood)" stroke="#5b21b6" stroke-width="1.5" />
              <circle cx="42" cy="22" r="0.8" fill="#fff" opacity="0.9" />
              <circle cx="58" cy="24" r="0.8" fill="#fff" opacity="0.9" />
              <path d="M 32,45 C 32,40 68,40 68,45 C 68,68 32,68 32,45 Z" fill="#040209" />
              <path d="M 34,48 Q 50,54 66,48 L 60,68 Q 50,75 40,68 Z" fill="#311042" stroke="#581c77" stroke-width="1" />
              <ellipse cx="42" cy="43" rx="4.5" ry="1.5" fill="#e0f7fa" filter="drop-shadow(0 0 4px #06b6d4)" />
              <ellipse cx="58" cy="43" rx="4.5" ry="1.5" fill="#e0f7fa" filter="drop-shadow(0 0 4px #06b6d4)" />
              <line x1="32" y1="43" x2="52" y2="43" stroke="#06b6d4" stroke-width="1.2" opacity="0.9" />
              <line x1="48" y1="43" x2="68" y2="43" stroke="#06b6d4" stroke-width="1.2" opacity="0.9" />
            </svg>
          `;
          row.appendChild(avatarContainer);

          bubble.className = 'max-w-[80%] bg-[#1e1133] border border-[#44387a]/40 text-[#faebd7] rounded-2xl rounded-tl-none px-3.5 py-2 text-xs shadow-md leading-relaxed';
          
          // Simple client-side Markdown to HTML renderer for formatting responses elegantly
          let htmlContent = msg.text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            // Bold (**text**)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Inline code (`code`)
            .replace(/`(.*?)`/g, '<code class="bg-[#2a1a45] border border-[#cf4fe6]/20 text-[#cf4fe6] px-1 py-0.5 rounded font-mono text-[10px]">$1</code>')
            // Bullet list items
            .replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="ml-3 list-disc mt-0.5">$1</li>')
            // Newlines
            .replace(/\n/g, '<br />');

          bubble.innerHTML = `<div>${htmlContent}</div>`;
          row.appendChild(bubble);
        }
        
        windowEl.appendChild(row);
      });

      // Scroll to bottom
      setTimeout(() => {
        windowEl.scrollTop = windowEl.scrollHeight;
      }, 50);
    }
    (window as any).renderCompanionMessages = renderCompanionMessages;

    function populateCompanionAttachDrawerLists() {
      // Notes list
      const notesListEl = document.getElementById('attachDrawerNotesList');
      if (notesListEl) {
        notesListEl.innerHTML = '';
        if (notesArr.length === 0) {
          notesListEl.innerHTML = '<div class="text-[9px] text-[#b4aae2]/40 italic">No notes created yet</div>';
        } else {
          notesArr.forEach((n: any, idx: number) => {
            const isAttached = companionAttachedNotes.includes(idx);
            const item = document.createElement('label');
            item.className = 'flex items-center gap-1.5 text-[10px] text-[#b4aae2] hover:text-white cursor-pointer select-none py-0.5';
            item.innerHTML = `
              <input type="checkbox" class="accent-amber-400 w-3 h-3 cursor-pointer" data-attach-note="${idx}" ${isAttached ? 'checked' : ''} />
              <span class="truncate">${n.title || `Note #${idx + 1}`}</span>
            `;
            notesListEl.appendChild(item);

            const cb = item.querySelector('input');
            if (cb) {
              cb.addEventListener('change', () => {
                haptic(9);
                if (cb.checked) {
                  if (!companionAttachedNotes.includes(idx)) companionAttachedNotes.push(idx);
                } else {
                  companionAttachedNotes = companionAttachedNotes.filter(x => x !== idx);
                }
                updateActiveAttachmentsBar();
              });
            }
          });
        }
      }

      // Recipes list
      const recipesListEl = document.getElementById('attachDrawerRecipesList');
      if (recipesListEl) {
        recipesListEl.innerHTML = '';
        if (recipesArr.length === 0) {
          recipesListEl.innerHTML = '<div class="text-[9px] text-[#b4aae2]/40 italic">No recipes in codex</div>';
        } else {
          recipesArr.forEach((r: any) => {
            const isAttached = companionAttachedRecipes.includes(r.id);
            const item = document.createElement('label');
            item.className = 'flex items-center gap-1.5 text-[10px] text-[#b4aae2] hover:text-white cursor-pointer select-none py-0.5';
            item.innerHTML = `
              <input type="checkbox" class="accent-pink-500 w-3 h-3 cursor-pointer" data-attach-recipe="${r.id}" ${isAttached ? 'checked' : ''} />
              <span class="truncate">${r.title}</span>
            `;
            recipesListEl.appendChild(item);

            const cb = item.querySelector('input');
            if (cb) {
              cb.addEventListener('change', () => {
                haptic(9);
                if (cb.checked) {
                  if (!companionAttachedRecipes.includes(r.id)) companionAttachedRecipes.push(r.id);
                } else {
                  companionAttachedRecipes = companionAttachedRecipes.filter(x => x !== r.id);
                }
                updateActiveAttachmentsBar();
              });
            }
          });
        }
      }

      // Tasks list
      const tasksListEl = document.getElementById('attachDrawerTasksList');
      if (tasksListEl) {
        tasksListEl.innerHTML = '';
        if (tasksArr.length === 0) {
          tasksListEl.innerHTML = '<div class="text-[9px] text-[#b4aae2]/40 italic">No tasks on quest board</div>';
        } else {
          tasksArr.forEach((t: any, idx: number) => {
            const isAttached = companionAttachedTasks.includes(idx);
            const item = document.createElement('label');
            item.className = 'flex items-center gap-1.5 text-[10px] text-[#b4aae2] hover:text-white cursor-pointer select-none py-0.5';
            item.innerHTML = `
              <input type="checkbox" class="accent-emerald-400 w-3 h-3 cursor-pointer" data-attach-task="${idx}" ${isAttached ? 'checked' : ''} />
              <span class="truncate">${t.text}</span>
            `;
            tasksListEl.appendChild(item);

            const cb = item.querySelector('input');
            if (cb) {
              cb.addEventListener('change', () => {
                haptic(9);
                if (cb.checked) {
                  if (!companionAttachedTasks.includes(idx)) companionAttachedTasks.push(idx);
                } else {
                  companionAttachedTasks = companionAttachedTasks.filter(x => x !== idx);
                }
                updateActiveAttachmentsBar();
              });
            }
          });
        }
      }
    }
    (window as any).populateCompanionAttachDrawerLists = populateCompanionAttachDrawerLists;

    function updateActiveAttachmentsBar() {
      const bar = document.getElementById('companionActiveAttachmentsBar');
      if (!bar) return;

      bar.innerHTML = '';
      const totalAttached = companionAttachedNotes.length + companionAttachedRecipes.length + companionAttachedTasks.length;
      
      if (totalAttached === 0) {
        bar.classList.add('hidden');
        return;
      }
      bar.classList.remove('hidden');

      // Notes
      companionAttachedNotes.forEach((idx) => {
        const n = notesArr[idx];
        if (!n) return;
        const tag = document.createElement('span');
        tag.className = 'text-[8.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 select-none';
        tag.innerHTML = `📝 Note: ${n.title || `Note #${idx + 1}`} <button class="ml-1 hover:text-white bg-transparent border-none p-0 cursor-pointer text-amber-400" data-remove-attached-note="${idx}">✕</button>`;
        bar.appendChild(tag);

        const btn = tag.querySelector('button');
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            companionAttachedNotes = companionAttachedNotes.filter(x => x !== idx);
            updateActiveAttachmentsBar();
            populateCompanionAttachDrawerLists();
            haptic(9);
          });
        }
      });

      // Recipes
      companionAttachedRecipes.forEach((id) => {
        const r = recipesArr.find(item => item.id === id);
        if (!r) return;
        const tag = document.createElement('span');
        tag.className = 'text-[8.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/30 flex items-center gap-1 select-none';
        tag.innerHTML = `🍳 Recipe: ${r.title} <button class="ml-1 hover:text-white bg-transparent border-none p-0 cursor-pointer text-pink-400" data-remove-attached-recipe="${id}">✕</button>`;
        bar.appendChild(tag);

        const btn = tag.querySelector('button');
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            companionAttachedRecipes = companionAttachedRecipes.filter(x => x !== id);
            updateActiveAttachmentsBar();
            populateCompanionAttachDrawerLists();
            haptic(9);
          });
        }
      });

      // Tasks
      companionAttachedTasks.forEach((idx) => {
        const t = tasksArr[idx];
        if (!t) return;
        const tag = document.createElement('span');
        tag.className = 'text-[8.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 select-none';
        tag.innerHTML = `📌 Task: ${t.text} <button class="ml-1 hover:text-white bg-transparent border-none p-0 cursor-pointer text-emerald-400" data-remove-attached-task="${idx}">✕</button>`;
        bar.appendChild(tag);

        const btn = tag.querySelector('button');
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            companionAttachedTasks = companionAttachedTasks.filter(x => x !== idx);
            updateActiveAttachmentsBar();
            populateCompanionAttachDrawerLists();
            haptic(9);
          });
        }
      });
    }
    (window as any).updateActiveAttachmentsBar = updateActiveAttachmentsBar;

    function showCompanionTypingIndicator(statusText: string = 'searching') {
      const windowEl = document.getElementById('companionChatWindow');
      if (!windowEl) return;

      // Remove any existing typing indicator
      const existing = document.getElementById('companionTypingIndicator');
      if (existing) existing.remove();

      const row = document.createElement('div');
      row.id = 'companionTypingIndicator';
      row.className = 'flex items-start gap-2.5 w-full animate-fade-in';
      row.innerHTML = `
        <!-- Outer avatar container -->
        <div class="w-9 h-9 shrink-0 select-none">
          <svg class="w-9 h-9 rounded-full bg-[#0d071c] border border-[#cf4fe6]/40 p-0.5 shadow-[0_0_8px_rgba(207,79,230,0.3)] filter-holo-glow wizard-flame" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="wiz-flame-typing" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#4c1d95" stop-opacity="0" />
                <stop offset="30%" stop-color="#7c3aed" stop-opacity="0.6" />
                <stop offset="70%" stop-color="#c084fc" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#f472b6" stop-opacity="1" />
              </linearGradient>
              <radialGradient id="wiz-hood-typing" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stop-color="#1e113a" />
                <stop offset="50%" stop-color="#0a0518" />
                <stop offset="100%" stop-color="#020105" />
              </radialGradient>
            </defs>
            <g opacity="0.8">
              <path d="M 20,80 Q 5,50 15,25 Q 30,55 45,75 Z" fill="url(#wiz-flame-typing)" />
              <path d="M 80,80 Q 95,50 85,25 Q 70,55 55,75 Z" fill="url(#wiz-flame-typing)" />
              <path d="M 50,90 Q 30,60 50,15 Q 70,60 50,90 Z" fill="url(#wiz-flame-typing)" />
            </g>
            <path d="M 12,38 C 5,28 10,22 28,32 Z" fill="#8a614d" stroke="#52392c" stroke-width="1" />
            <path d="M 88,38 C 95,28 90,22 72,32 Z" fill="#8a614d" stroke="#52392c" stroke-width="1" />
            <path d="M 20,78 Q 50,10 80,78 Q 50,55 20,78 Z" fill="url(#wiz-hood-typing)" stroke="#5b21b6" stroke-width="1.5" />
            <circle cx="42" cy="22" r="0.8" fill="#fff" opacity="0.9" />
            <circle cx="58" cy="24" r="0.8" fill="#fff" opacity="0.9" />
            <path d="M 32,45 C 32,40 68,40 68,45 C 68,68 32,68 32,45 Z" fill="#040209" />
            <path d="M 34,48 Q 50,54 66,48 L 60,68 Q 50,75 40,68 Z" fill="#311042" stroke="#581c77" stroke-width="1" />
            <ellipse cx="42" cy="43" rx="4.5" ry="1.5" fill="#e0f7fa" filter="drop-shadow(0 0 4px #06b6d4)" />
            <ellipse cx="58" cy="43" rx="4.5" ry="1.5" fill="#e0f7fa" filter="drop-shadow(0 0 4px #06b6d4)" />
            <line x1="32" y1="43" x2="52" y2="43" stroke="#06b6d4" stroke-width="1.2" opacity="0.9" />
            <line x1="48" y1="43" x2="68" y2="43" stroke="#06b6d4" stroke-width="1.2" opacity="0.9" />
          </svg>
        </div>
        <div class="max-w-[150px] bg-[#1e1133] border border-[#44387a]/40 text-[#b4aae2]/80 rounded-2xl rounded-tl-none px-3.5 py-2 flex items-center justify-center gap-1 text-[11px] font-mono shadow-md">
          <span>${statusText}</span>
          <span class="animate-bounce" style="animation-delay: 0s">.</span>
          <span class="animate-bounce" style="animation-delay: 0.15s">.</span>
          <span class="animate-bounce" style="animation-delay: 0.3s">.</span>
        </div>
      `;
      windowEl.appendChild(row);
      windowEl.scrollTop = windowEl.scrollHeight;
    }

    function removeCompanionTypingIndicator() {
      const existing = document.getElementById('companionTypingIndicator');
      if (existing) existing.remove();
    }

    async function generateCompanionBotReply(text: string, attachments: any[]) {
      let replyText = '';

      // 1. TRY THE SERVER-SIDE FULL-POWER GEMINI API (FIRST PREFERENCE)
      try {
        showCompanionTypingIndicator('channeling core');
        const apiResponse = await fetch('/api/companion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: text,
            history: companionMessages,
            attachments
          })
        });
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData && apiData.text) {
            replyText = apiData.text;
          } else if (apiData && apiData.error) {
            console.warn("Server-side companion API returned an error:", apiData.error);
            if (apiData.error.toLowerCase().includes("key") || apiData.error.toLowerCase().includes("configured")) {
              replyText = `🔑 **Rift Core Offline: Gemini API Key Required**

I am ready to answer all your complex questions (including recipes, code, emails, and deep logic), but my server-side **Gemini API Key** is not yet connected!

**To activate full, unlimited, and free AI responses:**
1. Open the **Settings** menu (gear/wrench icon) in Google AI Studio or your workspace settings.
2. Under **Secrets / Environment Variables**, add:
   * **Name:** \`GEMINI_API_KEY\`
   * **Value:** *Your free Gemini API Key* (get one from [Google AI Studio](https://aistudio.google.com))
3. Refresh the page to synchronize your Rift core.

Once added, you and your users will have **unlimited questions and full access to Gemini 1.5 Flash** with absolutely no token limits or charges!`;
            }
          }
        } else {
          const apiErrorData = await apiResponse.json().catch(() => ({}));
          console.warn("Server-side companion API failed:", apiErrorData.error || apiResponse.statusText);
          const errMsg = (apiErrorData.error || "").toLowerCase();
          if (errMsg.includes("key") || errMsg.includes("configured") || apiResponse.status === 400) {
            replyText = `🔑 **Rift Core Offline: Gemini API Key Required**

I am ready to answer all your complex questions (including recipes, code, emails, and deep logic), but my server-side **Gemini API Key** is not yet connected!

**To activate full, unlimited, and free AI responses:**
1. Open the **Settings** menu (gear/wrench icon) in Google AI Studio or your workspace settings.
2. Under **Secrets / Environment Variables**, add:
   * **Name:** \`GEMINI_API_KEY\`
   * **Value:** *Your free Gemini API Key* (get one from [Google AI Studio](https://aistudio.google.com))
3. Refresh the page to synchronize your Rift core.

Once added, you and your users will have **unlimited questions and full access to Gemini 1.5 Flash** with absolutely no token limits or charges!`;
          }
        }
      } catch (e) {
        console.warn("Failed to reach server-side companion API:", e);
      }

      // 1.5. TRY CHROME'S EXPERIMENTAL BUILT-IN ON-DEVICE AI (FALLBACK)
      if (!replyText) {
        try {
          if (typeof window !== 'undefined' && (window as any).ai) {
            const ai = (window as any).ai;
            
            // Modern standard API: ai.languageModel
            if (ai.languageModel) {
              const caps = await ai.languageModel.capabilities();
              if (caps && caps.available !== 'no') {
                const session = await ai.languageModel.create({
                  systemPrompt: "You are the Rift Companion, an advanced AI residing in 'The Portal'. Speak with mystery and wisdom. Reply with elegant markdown formatting."
                });
                let prompt = text;
                if (attachments.length > 0) {
                  prompt += `\n[Attached Data Context: ${JSON.stringify(attachments)}]`;
                }
                const result = await session.prompt(prompt);
                session.destroy();
                if (result) {
                  replyText = result;
                }
              }
            } 
            // Legacy Assistant API
            else if (ai.assistant) {
              const caps = await ai.assistant.capabilities();
              if (caps && caps.available !== 'no') {
                const session = await ai.assistant.create({
                  systemPrompt: "You are the Rift Companion. Speak with mystery. Reply with markdown."
                });
                let prompt = text;
                if (attachments.length > 0) {
                  prompt += `\n[Attached Data Context: ${JSON.stringify(attachments)}]`;
                }
                const result = await session.prompt(prompt);
                session.destroy();
                if (result) {
                  replyText = result;
                }
              }
            }
          }
        } catch (e) {
          console.warn("Chrome built-in on-device AI was present but failed to execute:", e);
        }
      }

      // 2. BACKUP / GENERAL CLIENT-SIDE SMART LOCAL INTELLIGENCE COGENT
      if (!replyText) {
        const lower = text.toLowerCase().trim();

        // A. Smart Math / Alchemical Arithmetic Evaluator
        // Handles patterns like: "20 + 10", "calculate 5 * 12", "what is 100 / 4"
        const mathPattern = /(?:what is|calculate|evaluate)?\s*([\d\s\+\-\*\/\(\)\.]+)/i;
        const mathMatch = lower.match(mathPattern);
        if (mathMatch && /[\+\-\*\/]/.test(mathMatch[1])) {
          try {
            const cleanedExpr = mathMatch[1].replace(/[^0-9\+\-\*\/\(\)\.\s]/g, '');
            const result = new Function(`return (${cleanedExpr})`)();
            if (typeof result === 'number' && !isNaN(result)) {
              replyText = `🔮 **Alchemical Arithmetic Alignment**
              
The equations align perfectly in the stars!
- **Formula:** \`${cleanedExpr.trim()}\`
- **Result:** \`${result}\`

*Computed entirely on-device with zero-latency local arithmetic.*`;
            }
          } catch (err) {}
        }

        // B. Handle Note, Recipe, or Task attachments locally with extremely high-fidelity intelligence
        if (!replyText && attachments.length > 0) {
          const notes = attachments.filter(a => a.type === 'note');
          const recipes = attachments.filter(a => a.type === 'recipe');
          const tasks = attachments.filter(a => a.type === 'task');

          const parts: string[] = [];
          parts.push("✨ **LOCAL COGNITIVE ANALYSIS REPORT** ✨\n");

          if (notes.length > 0) {
            parts.push(`📝 **Rift Note Scanned:** *"${notes[0].title}"*`);
            if (notes[0].text) {
              const textContent = notes[0].text;
              const wordsCount = textContent.split(/\s+/).length;
              parts.push(`  * **Stellar Wordcount:** \`${wordsCount} words\``);
              
              // Smart local summary & highlights
              const paragraphs = textContent.split('\n').filter(p => p.trim());
              parts.push(`  * **Syntactic Complexity:** \`${paragraphs.length} blocks detected\``);
              
              // Custom topic tagging
              const tags: string[] = [];
              if (textContent.toLowerCase().includes('dragon') || textContent.toLowerCase().includes('beast') || textContent.toLowerCase().includes('monster')) tags.push('Encounter');
              if (textContent.toLowerCase().includes('gold') || textContent.toLowerCase().includes('coin') || textContent.toLowerCase().includes('treasure')) tags.push('Loot');
              if (textContent.toLowerCase().includes('spell') || textContent.toLowerCase().includes('magic') || textContent.toLowerCase().includes('wizard')) tags.push('Arcane');
              if (textContent.toLowerCase().includes('dungeon') || textContent.toLowerCase().includes('cave') || textContent.toLowerCase().includes('rift')) tags.push('Exploration');
              
              if (tags.length > 0) {
                parts.push(`  * **Auto-Categorizations:** ${tags.map(t => `\`#${t}\``).join(' ')}`);
              }
              
              const snippet = textContent.length > 150 ? textContent.slice(0, 150) + "..." : textContent;
              parts.push(`  * **De-Coded Summary:** "${snippet}"`);
            } else {
              parts.push(`  * **Status:** Empty scroll. Enscribe some campaign logs in the Notes tab!`);
            }
          }

          if (recipes.length > 0) {
            const r = recipes[0].data;
            parts.push(`🍳 **Alchemical Codex Breakdown:** *"${recipes[0].title}"*`);
            parts.push(`  * **Difficulty Rating:** \`${r.difficulty.toUpperCase()}\``);
            parts.push(`  * **Temporal Sync:** \`${r.prepTime} prep\` | \`${r.cookTime} cooking\``);
            if (r.ingredients && r.ingredients.length > 0) {
              parts.push(`  * **Ingredient Compounds (${r.ingredients.length}):**`);
              r.ingredients.forEach((ing: any) => {
                parts.push(`    - \`${ing.amount} ${ing.unit || ''}\` of **${ing.name}**`);
              });
            }
            parts.push(`\n*Tip: Go to the Cook tab and activate the alchemical timer to start brewing!*`);
          }

          if (tasks.length > 0) {
            parts.push(`📌 **Quest Log Inspection:** *"${tasks[0].title}"*`);
            const p = tasks[0].priority || 'minor';
            parts.push(`  * **Threat Level:** \`${p.toUpperCase()}\``);
            parts.push(`  * **Streak Status:** Active on your Quest Board. Fulfill this task to sustain your daily concentration streak!`);
          }

          if (attachments.length > 1) {
            parts.push(`\n🔗 **Cross-Rift Binding:** Coalesced ${attachments.length} separate elements on-device!`);
          }

          replyText = parts.join('\n');
        }

        // C. Extensive Offline General Knowledge & FAQ matcher
        if (!replyText) {
          const faqs = [
            {
              keys: ['help', 'rules', 'what can you do', 'features', 'capability', 'capabilities'],
              reply: `🔮 **Welcome to your on-device Rift Consciousness!** I run 100% locally inside your browser, completely offline with zero server latency. Here is my capabilities matrix:

1. **Local Calculations:** Type any math expression like \`20 + 10\` or \`15 * 40\` and I will evaluate it instantly!
2. **Data Inspection:** Click the 📎 attach button to bind any **Note**, **Recipe**, or **Quest Task** to our conversation. I will run a local cognitive analysis.
3. **Lore & Game Insights:** Ask me about D&D classes, spellcasting, dice rolls, or the Cosmic Words game!
4. **Chrome Built-In AI:** If you are running Chrome with \`window.ai\` enabled, I will channel Gemini Nano directly on your GPU without using any internet connection!`
            },
            {
              keys: ['hello', 'hi', 'hey', 'greetings', 'yo'],
              reply: "Greetings, traveler of the Rift! I am **OFFLINE_BOT** — your personal, fully local companion. No servers, no latency, all running directly on your device."
            },
            {
              keys: ['game', 'cosmic words', 'war', 'rules of cosmic words'],
              reply: `🔮 **Cosmic Words Game Manual:** 
- **The Clue Giver** sees the secret word and forbidden taboo keywords. They must enscribe a *single word* clue.
- **The Guessers** enter their visions. Points are awarded based on speed (1st clue = 15pts, 2nd clue = 10pts, 3rd clue = 5pts).
- Use the **Game** tab to open the Nexus Chamber and invite friends!`
            },
            {
              keys: ['dnd', 'd&d', 'dungeons', 'dragons', 'dm', 'campaign'],
              reply: "🐉 **Dungeons & Dragons Lore:** The dice tray above is ready for action! Cast your D20, manage your spell slots, and use the Notes tab to record your party's epic milestones. Need help with a monster? Attach your encounter notes here!"
            },
            {
              keys: ['spell', 'spellbook', 'slots', 'wizard', 'magic'],
              reply: "✨ **Spellcasting Codex:** A standard wizard regains spell slots on a Long Rest. Keep track of your level 1-9 spell slots in the Home tab, and enscribe custom scrolls in your Notes!"
            },
            {
              keys: ['joke', 'funny', 'humor'],
              reply: "Why did the wizard refuse to use cloud storage? ...Because they preferred keeping their spell scrolls in a local pocket dimension! 🌌"
            },
            {
              keys: ['creator', 'who made', 'developed'],
              reply: "This elegant sanctuary, **The Portal**, was established by the Arch-Mage **TRXY6** using modern alchemical React components. I was conjured to run entirely in your local browser!"
            }
          ];

          for (const faq of faqs) {
            if (faq.keys.some(k => lower.includes(k))) {
              replyText = faq.reply;
              break;
            }
          }
        }

        // D. General fallback conversational AI response generator
        if (!replyText) {
          replyText = `🌌 **Offline Rift Companion Core**

I analyzed your query locally: *"${text}"*

Since I run entirely on-device, I cannot fetch live websites or use external servers, but here is my local analysis:
- **Query Type:** \`General Inquiry\`
- **Words Analyzed:** \`${text.split(/\s+/).length} runes\`
- **Status:** \`Ready\`

💡 **Try these smart offline commands:**
- Type \`20 + 10\` or any arithmetic expression to calculate values.
- Type \`help\` or \`rules\` to view local capabilities.
- Click the 📎 button below to attach a **Note** or **Recipe** for me to scan.
- Turn on Chrome's experimental **Built-in AI** (Gemini Nano) to unlock complete offline conversational AI!`;
        }
      }

      removeCompanionTypingIndicator();

      companionMessages.push({
        sender: 'bot',
        text: replyText,
        timestamp: Date.now()
      });

      saveCompanionMessages();
      renderCompanionMessages();
      haptic(12);
    }

    function submitCompanionMessage() {
      const inputEl = document.getElementById('companionChatInput') as HTMLInputElement | null;
      if (!inputEl) return;
      const text = inputEl.value.trim();
      if (!text && companionAttachedNotes.length === 0 && companionAttachedRecipes.length === 0 && companionAttachedTasks.length === 0) return;

      haptic(11);

      // Construct attachments data for this specific message
      const currentAttachments: any[] = [];
      companionAttachedNotes.forEach((idx) => {
        const n = notesArr[idx];
        if (n) currentAttachments.push({ type: 'note', title: n.title || `Note #${idx + 1}`, text: n.text || '' });
      });
      companionAttachedRecipes.forEach((id) => {
        const r = recipesArr.find(item => item.id === id);
        if (r) currentAttachments.push({ type: 'recipe', title: r.title, data: r });
      });
      companionAttachedTasks.forEach((idx) => {
        const t = tasksArr[idx];
        if (t) currentAttachments.push({ type: 'task', title: t.text, priority: t.priority });
      });

      // Add user message to list
      companionMessages.push({
        sender: 'user',
        text: text || `[Attached ${currentAttachments.length} sources]`,
        timestamp: Date.now(),
        attachments: currentAttachments
      });

      inputEl.value = '';
      saveCompanionMessages();
      renderCompanionMessages();

      // Show typing indicator
      showCompanionTypingIndicator();

      // Clear current active attachments to match user expectations
      companionAttachedNotes = [];
      companionAttachedRecipes = [];
      companionAttachedTasks = [];
      updateActiveAttachmentsBar();
      populateCompanionAttachDrawerLists();

      // Generate bot reply locally or through backend API
      setTimeout(() => {
        generateCompanionBotReply(text, currentAttachments);
      }, 300);
    }

    // Bind click events for companion panel
    const companionAttachBtn = document.getElementById('companionAttachBtn');
    const companionAttachDrawer = document.getElementById('companionAttachDrawer');
    const closeAttachDrawerBtn = document.getElementById('closeAttachDrawerBtn');
    
    if (companionAttachBtn && companionAttachDrawer) {
      companionAttachBtn.addEventListener('click', () => {
        haptic(10);
        companionAttachDrawer.classList.toggle('hidden');
        if (!companionAttachDrawer.classList.contains('hidden')) {
          populateCompanionAttachDrawerLists();
        }
      });
    }

    if (closeAttachDrawerBtn && companionAttachDrawer) {
      closeAttachDrawerBtn.addEventListener('click', () => {
        haptic(9);
        companionAttachDrawer.classList.add('hidden');
      });
    }

    const companionSendBtn = document.getElementById('companionSendBtn');
    if (companionSendBtn) {
      companionSendBtn.addEventListener('click', submitCompanionMessage);
    }

    const companionChatInput = document.getElementById('companionChatInput');
    if (companionChatInput) {
      companionChatInput.addEventListener('keydown', (e: any) => {
        if (e.key === 'Enter') submitCompanionMessage();
      });
    }

    // Expose helpers globally for our modular widgets (e.g., Rift Vision scanner)
    (window as any).addNote = (text: string) => {
      notesArr.unshift({ text, t: Date.now() });
      store.set('notes', notesArr);
      renderNotes();
    };
    (window as any).addCustomRoll = (die: any, result: any) => {
      rollHistory.unshift({ die, result, t: Date.now() });
      store.set('roll_history', rollHistory);
      renderHistory();
    };
    (window as any).addCalendarEvent = (dateStr: string, text: string) => {
      if (!calEvents[dateStr]) calEvents[dateStr] = [];
      calEvents[dateStr].push(text);
      store.set('cal_events', calEvents);
      renderCalendar();
      renderCalEvents();
    };
    (window as any).loadSheet = loadSheet;
    (window as any).saveSheet = saveSheet;

    return () => {
      clearInterval(clockInterval);
      clearInterval(alarmCheckInterval);
      clearInterval(timerInterval);
      clearInterval(stopwatchInterval);
      if (navSpinFrame) cancelAnimationFrame(navSpinFrame);
      if (canvasAnimFrame) cancelAnimationFrame(canvasAnimFrame);
      if (activeRollInterval) {
        cancelAnimationFrame(activeRollInterval);
        clearTimeout(activeRollInterval);
      }
      if (starfieldResizeHandler) {
        window.removeEventListener('resize', starfieldResizeHandler);
      }
      if (mouseMoveHandler) {
        window.removeEventListener('mousemove', mouseMoveHandler);
      }
      clearTimeout(coinTimer);
      clearTimeout(sheetStatusTimer);
    };
  }, []);



  if (showStartScreen) {
    return (
      <>
        <div className="start-screen-overlay flex flex-col items-center p-4">
          <div className="absolute inset-0 bg-cover bg-center opacity-30 pb-20 pointer-events-none mix-blend-screen bg-[radial-gradient(ellipse_at_center,rgba(111,143,255,0.15),transparent_60%)]"></div>
          
          <div className="flex flex-col items-center max-w-sm w-full px-6 text-center select-none z-10 animate-fade-in relative">
            
            {/* Elegant Top Badges */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#cf4fe6]/10 border border-[#cf4fe6]/20 mb-3 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#cf4fe6] animate-pulse"></span>
              <p className="text-[9px] font-bold tracking-[0.25em] text-[#faebd7] uppercase">ON-DEVICE SECURE CORE</p>
            </div>

            {/* Logo Group */}
            <p className="text-[10px] font-extrabold tracking-[0.4em] text-[#3fd9c7] uppercase mb-1 drop-shadow-[0_0_8px_rgba(63,217,199,0.3)]">SECURE TERMINAL</p>
            <h1 className="text-4xl font-extrabold uppercase mb-6 futuristic-title-glow text-[#faebd7]">
              PORTAL
            </h1>
            
            {/* Concentric rotating animated portal logo - scaled for space */}
            <div className="portal-ring-container mb-6 scale-90 relative">
              {/* Galaxy Gradient Definitions & Filters */}
              <svg className="absolute w-0 h-0" style={{ position: 'absolute' }}>
                <defs>
                  <linearGradient id="galaxyGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3fd9c7" />
                    <stop offset="35%" stopColor="#cf4fe6" />
                    <stop offset="70%" stopColor="#fa2f8a" />
                    <stop offset="100%" stopColor="#efc562" />
                  </linearGradient>
                  <linearGradient id="galaxyGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7b2fe0" />
                    <stop offset="45%" stopColor="#cf4fe6" />
                    <stop offset="75%" stopColor="#3fd9c7" />
                    <stop offset="100%" stopColor="#fa2f8a" />
                  </linearGradient>
                  <filter id="galaxyGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>

              {/* Conic laser scanner sweep */}
              <div className="portal-scanner-sweep"></div>

              {/* Crosshair scope grid */}
              <div className="futuristic-scope-grid"></div>

              {/* Orbiting particle nodes / satellites */}
              <div className="absolute w-[210px] h-[210px] animate-spin" style={{ animationDuration: '6s' }}>
                <div className="portal-orbiter-node" style={{ top: '10%', left: '50%', transform: 'translateX(-50%)', background: '#3fd9c7', boxShadow: '0 0 14px #3fd9c7' }}></div>
              </div>
              <div className="absolute w-[150px] h-[150px] animate-spin-reverse" style={{ animationDuration: '4s' }}>
                <div className="portal-orbiter-node" style={{ bottom: '15%', left: '15%', background: '#fa2f8a', boxShadow: '0 0 14px #fa2f8a' }}></div>
              </div>

              {/* Layer 1: Outer High-Tech Circuit/Grid Ring (Clockwise) */}
              <svg className="absolute w-[280px] h-[280px] animate-spin-slow" style={{ animationDuration: '45s' }} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="95" fill="none" stroke="url(#galaxyGrad1)" strokeWidth="3" strokeDasharray="6 12" filter="url(#galaxyGlow)" />
                <circle cx="100" cy="100" r="91" fill="none" stroke="url(#galaxyGrad2)" strokeWidth="4" strokeDasharray="140 30 10 20" filter="url(#galaxyGlow)" />
                <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(180, 170, 226, 0.25)" strokeWidth="1" />
                
                {/* Tick marks around the perimeter */}
                <path d="M 100 2 L 100 10 M 100 190 L 100 198 M 2 100 L 10 100 M 190 100 L 198 100" stroke="url(#galaxyGrad1)" strokeWidth="3" filter="url(#galaxyGlow)" />
                <path d="M 31 31 L 38 38 M 169 169 L 176 176 M 31 169 L 38 162 M 169 31 L 176 38" stroke="url(#galaxyGrad2)" strokeWidth="2" filter="url(#galaxyGlow)" />
              </svg>

              {/* Layer 2: Middle Telemetry Ring (Counter-Clockwise) */}
              <svg className="absolute w-[220px] h-[220px] animate-spin-reverse" style={{ animationDuration: '28s' }} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="82" fill="none" stroke="url(#galaxyGrad2)" strokeWidth="3" strokeDasharray="2 15" filter="url(#galaxyGlow)" />
                <circle cx="100" cy="100" r="76" fill="none" stroke="url(#galaxyGrad1)" strokeWidth="4.5" strokeDasharray="160 100" filter="url(#galaxyGlow)" />
                
                {/* Tech symbols & degree markers */}
                <text x="100" y="32" fill="#efc562" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="'Orbitron', monospace">00°N</text>
                <text x="168" y="102" fill="#efc562" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="'Orbitron', monospace">90°E</text>
                <text x="100" y="174" fill="#efc562" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="'Orbitron', monospace">180°S</text>
                <text x="32" y="102" fill="#efc562" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="'Orbitron', monospace">270°W</text>
              </svg>

              {/* Layer 3: Inner Target/Bracket Reticle (Clockwise) */}
              <svg className="absolute w-[160px] h-[160px] animate-spin" style={{ animationDuration: '15s' }} viewBox="0 0 200 200">
                {/* Triangular teeth / brackets */}
                <path d="M 82 52 L 100 38 L 118 52" fill="none" stroke="url(#galaxyGrad1)" strokeWidth="4.5" filter="url(#galaxyGlow)" />
                <path d="M 82 148 L 100 162 L 118 148" fill="none" stroke="url(#galaxyGrad1)" strokeWidth="4.5" filter="url(#galaxyGlow)" />
                <circle cx="100" cy="100" r="62" fill="none" stroke="url(#galaxyGrad2)" strokeWidth="3" strokeDasharray="12 25" filter="url(#galaxyGlow)" />
                <circle cx="100" cy="100" r="50" fill="none" stroke="url(#galaxyGrad1)" strokeWidth="3" filter="url(#galaxyGlow)" />
              </svg>

              {/* Glimmering multi-colored interactive core */}
              <div className="portal-core"></div>
            </div>

            {/* Account Tabbed Container with upgraded Glassmorphism styling */}
            <div className="w-full portal-glass-card p-6">
              {/* Tabs */}
              <div className="flex border-b border-[#cf4fe6]/15 pb-2 mb-4">
                <button 
                  type="button"
                  onClick={() => { setLoginTab('login'); haptic(10); setAuthError(''); }}
                  className={`flex-1 text-center pb-2.5 text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${loginTab === 'login' ? 'text-[#3fd9c7] border-b-2 border-[#3fd9c7] drop-shadow-[0_0_8px_rgba(63,217,199,0.5)]' : 'text-[#b4aae2]/50 hover:text-[#b4aae2]'}`}
                >
                  Existing Traveler
                </button>
                <button 
                  type="button"
                  onClick={() => { setLoginTab('signup'); haptic(10); setAuthError(''); }}
                  className={`flex-1 text-center pb-2.5 text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${loginTab === 'signup' ? 'text-[#cf4fe6] border-b-2 border-[#cf4fe6] drop-shadow-[0_0_8px_rgba(207,79,230,0.5)]' : 'text-[#b4aae2]/50 hover:text-[#b4aae2]'}`}
                >
                  New Traveler
                </button>
              </div>

              {/* Helpful Explanatory Text */}
              <p className="text-[10px] text-[#b4aae2]/70 italic tracking-wide mb-4">
                {loginTab === 'login' 
                  ? "🔮 Enter your credentials to awaken your offline data chambers." 
                  : "✨ Bind a new ID to the localized browser index with a custom 4-digit security PIN."}
              </p>

              {authError && (
                <div className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-lg p-2.5 mb-3 text-center tracking-wide uppercase">
                  {authError}
                </div>
              )}

              {loginTab === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="text-left space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-[#b4aae2] font-semibold flex items-center gap-1.5">
                      <span>👤</span>
                      <span>User ID / Traveler ID</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. trxy6"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      className="w-full portal-glass-input text-xs"
                    />
                  </div>
                  <div className="text-left space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-[#b4aae2] font-semibold flex items-center gap-1.5">
                      <span>🔑</span>
                      <span>4-Digit PIN Essence</span>
                    </label>
                    <input 
                      type="password" 
                      required
                      maxLength={4}
                      placeholder="••••"
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full portal-glass-input text-xs text-center tracking-[0.5em]"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-[#cf4fe6] to-[#4f7fe6] hover:brightness-110 active:scale-[0.98] text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(207,79,230,0.3)] cursor-pointer"
                  >
                    Unlock Portal & Login 🔮
                  </button>
                </form>
              ) : (
                /* Sign-Up Form */
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div className="text-left space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-[#b4aae2] font-semibold flex items-center gap-1.5">
                      <span>👤</span>
                      <span>Choose User ID</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. mystical_traveler"
                      value={signupUser}
                      onChange={(e) => setSignupUser(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      className="w-full portal-glass-input text-xs"
                    />
                  </div>
                  <div className="text-left space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-[#b4aae2] font-semibold flex items-center gap-1.5">
                      <span>🔑</span>
                      <span>Set 4-Digit PIN</span>
                    </label>
                    <input 
                      type="password" 
                      required
                      maxLength={4}
                      placeholder="••••"
                      value={signupPin}
                      onChange={(e) => setSignupPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full portal-glass-input text-xs text-center tracking-[0.5em]"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-[#3fd9c7] to-[#cf4fe6] hover:brightness-110 active:scale-[0.98] text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(63,217,199,0.3)] cursor-pointer"
                  >
                    Enscribe Rune & Register ✨
                  </button>
                </form>
              )}
            </div>

            <p className="text-[9px] uppercase tracking-[0.25em] text-[#b4aae2]/60 mt-4 font-mono">Secured on-device via local storage indexes</p>
          </div>
        </div>
        <div className="nebula-layer"></div>
        <video id="bgVideo" className="bg-video-layer hidden" loop muted autoPlay playsInline></video>
        <canvas id="starfield"></canvas>
      </>
    );
  }

  return (
    <>

      <div className="nebula-layer"></div>
      <video id="bgVideo" className="bg-video-layer hidden" loop muted autoPlay playsInline></video>
      <canvas id="starfield"></canvas>

      {/* Full-screen Drag & Drop Video Overlay */}
      <div id="dragDropVideoOverlay" className="fixed inset-0 bg-[#0d071c]/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center border-4 border-dashed border-[#cf4fe6] m-4 rounded-3xl opacity-0 pointer-events-none transition-all duration-300">
        <div className="text-center space-y-4 max-w-md p-6 select-none animate-bounce">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#cf4fe6] to-[#3fd9c7] flex items-center justify-center shadow-[0_0_20px_rgba(207,79,230,0.5)]">
            <span className="text-4xl">🔮</span>
          </div>
          <h2 className="text-2xl font-bold text-[#faebd7] uppercase tracking-wider" style={{ fontFamily: "'Cormorant', serif" }}>
            Bind Background Portal
          </h2>
          <p className="text-xs text-[#b4aae2] leading-relaxed">
            Release the video file anywhere to set it as your high-fantasy animated background loop.
          </p>
          <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            Saved locally in your device's rift database
          </p>
        </div>
      </div>

      <header className="flex justify-between items-center py-3 px-4 border-b border-[#2e2454] bg-[#0c081e]/85 backdrop-blur-md sticky top-0 z-50">
        <button className="home-btn flex items-center gap-3 bg-transparent border-none p-0 cursor-pointer text-left focus:outline-none" id="homeBtn" aria-label="Home">
          {/* Glowing Galaxy Swirl Logo Container */}
          <div className="brand-spiral relative w-10 h-10 flex items-center justify-center shrink-0">
            {/* Spinning outward rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#cf4fe6]/40 animate-spin-slow"></div>
            <div className="absolute inset-1.5 rounded-full border border-[1px] border-[#3fd9c7]/30 animate-spin-reverse"></div>
            {/* Glowing gradient core galaxy */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-[#cf4fe6] via-[#e85f7a] to-[#3fd9c7] opacity-80 blur-[2px] animate-pulse"></div>
            <div className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#fff]"></div>
          </div>
          <div className="brand flex flex-col items-start leading-none gap-0.5">
            <span className="text-[9px] font-semibold tracking-[0.25em] text-[#b4aae2] uppercase leading-none opacity-85">THE</span>
            <span className="text-[17px] text-holographic font-semibold tracking-[0.12em] uppercase leading-none" style={{ fontFamily: "'Cormorant', serif" }}>
              PORTAL
            </span>
          </div>
        </button>

        {/* Header Right area */}
        <div className="flex items-center gap-3">
          {/* Universal Rift Vision Scan Trigger */}
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-full border border-[#3fd9c7]/40 bg-[#3fd9c7]/10 hover:bg-[#3fd9c7]/25 text-[#3fd9c7] hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(63,217,199,0.25)] cursor-pointer focus:outline-none shrink-0"
            title="Launch Rift Vision Scanner"
            onClick={() => { haptic(15); if ((window as any).openRiftVision) (window as any).openRiftVision('ask'); }}
          >
            <Camera className="w-4.5 h-4.5" />
          </button>

          {/* Synced Badge showing Traveler ID */}
          <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[#cf4fe6]/10 border border-[#cf4fe6]/35 shadow-[0_0_8px_rgba(207,79,230,0.15)] select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fd9c7] animate-ping"></span>
            <span className="text-[9px] font-bold tracking-[0.1em] text-[#faebd7] uppercase font-mono">
              🔮 {currentUser || 'GUEST'}
            </span>
          </div>

          {/* Clock Display */}
          <div className="header-clock text-right">
            <div className="clock-time text-[17px] font-bold text-[#faebd7] tracking-[0.02em] font-mono leading-none" id="headerTime">
              09:41 <span className="text-[11px] font-medium text-[#b4aae2]">AM</span>
            </div>
            <div className="clock-date text-[9px] text-[#b4aae2]/70 uppercase tracking-[0.1em] font-sans font-semibold mt-1" id="headerDate">
              WED, JUL 12
            </div>
          </div>

          {/* Purple Gear Settings button */}
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-full border border-[#cf4fe6]/30 bg-[#cf4fe6]/10 hover:bg-[#cf4fe6]/25 text-[#cf4fe6] hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(207,79,230,0.25)] cursor-pointer focus:outline-none" 
            title="Settings"
            onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('settings'); }}
          >
            <svg className="w-4.5 h-4.5 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      <main>
        {/* HOME PANEL */}
        <div className="panel active" id="panel-home">

          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="gradD20" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#9fd0ff" />
                <stop offset="55%" stopColor="#6f8fff" />
                <stop offset="100%" stopColor="#5a4fd9" />
              </linearGradient>
              <linearGradient id="gradNotes" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd6ea" />
                <stop offset="100%" stopColor="#e88fc0" />
              </linearGradient>
              <linearGradient id="gradSheet" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e8e4f5" />
                <stop offset="100%" stopColor="#a89fc9" />
              </linearGradient>
              <linearGradient id="gradCalc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffe9b8" />
                <stop offset="100%" stopColor="#e0a85f" />
              </linearGradient>
              <linearGradient id="gradTasks" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c9f5e6" />
                <stop offset="100%" stopColor="#5fc9a8" />
              </linearGradient>
              <linearGradient id="gradClock" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c9e0ff" />
                <stop offset="100%" stopColor="#7a8fd9" />
              </linearGradient>
              <linearGradient id="gradCal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffc9e8" />
                <stop offset="100%" stopColor="#9f7fe0" />
              </linearGradient>
              <linearGradient id="gradGame" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd6a8" />
                <stop offset="100%" stopColor="#e85f7a" />
              </linearGradient>
              <linearGradient id="gradSettings" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#dde3ec" />
                <stop offset="100%" stopColor="#8f96a8" />
              </linearGradient>
              <linearGradient id="gradRecipes" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd3b6" />
                <stop offset="100%" stopColor="#ff7597" />
              </linearGradient>
              <linearGradient id="gradGhost1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a8c4ec" />
                <stop offset="100%" stopColor="#5a6fc9" />
              </linearGradient>
              <linearGradient id="gradGhost2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f0c9e8" />
                <stop offset="100%" stopColor="#c95fa8" />
              </linearGradient>
            </defs>
          </svg>

          {/* MASTER COMPANION DASHBOARD CONTAINER */}
          <div className="home-dashboard flex flex-col gap-5 w-full max-w-5xl mx-auto px-1 py-1 pb-16">
            
            {/* USER GREETING BANNER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-2xl border border-[#cf4fe6]/25 bg-gradient-to-r from-[#170e30]/90 to-[#0e0721]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-fade-in select-none">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#cf4fe6] to-[#3fd9c7] flex items-center justify-center font-bold text-[#faebd7] shadow-[0_0_15px_rgba(207,79,230,0.4)] uppercase font-mono text-base">
                  {currentUser ? currentUser.substring(0, 2) : '??'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#faebd7] tracking-wider" style={{ fontFamily: "'Cormorant', serif" }}>
                    Welcome, {currentUser || 'Traveler'}
                  </h2>
                  <p className="text-[10px] text-[#b4aae2] font-mono tracking-widest uppercase mt-0.5">
                    {currentUser === 'trxy6' ? '👑 SYSTEM CREATOR BOUND TO THE RIFT' : '👤 BOUND RIFT TRAVELER'}
                  </p>
                </div>
              </div>
              <div className="mt-3 md:mt-0 flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => {
                    haptic(15);
                    setShowCustomizeModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#cf4fe6]/10 hover:bg-[#cf4fe6]/20 text-[#cf4fe6] border border-[#cf4fe6]/20 hover:border-[#cf4fe6]/40 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  ⚙️ Customize Layout
                </button>
                <button 
                  onClick={() => {
                    haptic(15);
                    localStorage.removeItem('portal_current_user');
                    window.location.reload();
                  }}
                  className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  🔒 Lock Portal
                </button>
              </div>
            </div>
            
            {/* ROW 1: QUICK TILES AND DICE TRAY */}
            {(visibleWidgets.quickLaunch || visibleWidgets.diceTray) && (
              <div className="flex flex-col md:grid md:grid-cols-12 gap-5 w-full">
                
                {/* Sidebar Quick Launch Buttons (3 cols desktop, horizontal bar mobile) */}
                {visibleWidgets.quickLaunch && (
                  <div className={`flex flex-row md:flex-col justify-between md:justify-start gap-4 ${visibleWidgets.diceTray ? 'col-span-3' : 'col-span-12'} items-center w-full`}>
                
                {/* ROLL MODULE */}
                <button 
                  className="dash-tile-elevated group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl text-center transition-all duration-300 cursor-pointer focus:outline-none flex-1 md:w-full border border-yellow-500/30 bg-yellow-950/5 backdrop-blur-md shadow-[0_0_15px_rgba(251,191,36,0.08)] hover:border-yellow-400/80 hover:shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:bg-yellow-950/15"
                  style={{ height: '110px' }}
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('roll'); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#fbbf24]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="w-11 h-11 mb-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <svg className="w-10 h-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" stroke="#fbbf24" fill="rgba(251,191,36,0.15)" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="7" stroke="#f59e0b" strokeDasharray="3 2" />
                      <path d="M12 8v8M9 10h4.5a2 2 0 0 1 0 4H9" stroke="#fbbf24" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-yellow-300 group-hover:text-white transition-colors duration-200">DICE TRAY</span>
                </button>
 
                {/* NOTES MODULE */}
                <button 
                  className="dash-tile-elevated group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl text-center transition-all duration-300 cursor-pointer focus:outline-none flex-1 md:w-full border border-pink-500/30 bg-pink-950/5 backdrop-blur-md shadow-[0_0_15px_rgba(232,143,192,0.08)] hover:border-pink-400/80 hover:shadow-[0_0_20px_rgba(232,143,192,0.25)] hover:bg-pink-950/15"
                  style={{ height: '110px' }}
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('notes'); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#e88fc0]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="w-11 h-11 mb-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <svg className="w-10 h-10 drop-shadow-[0_0_8px_rgba(232,143,192,0.6)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                      <path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6l-4-4Z" stroke="#ffd6ea" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v4h4" stroke="#e88fc0" />
                      <path d="M16 11H6M16 15H6M10 7H6" stroke="#c27ba0" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-pink-300 group-hover:text-white transition-colors duration-200">JOURNAL</span>
                </button>
 
                {/* STATS MODULE */}
                <button 
                  className="dash-tile-elevated group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl text-center transition-all duration-300 cursor-pointer focus:outline-none flex-1 md:w-full border border-indigo-500/30 bg-indigo-950/5 backdrop-blur-md shadow-[0_0_15px_rgba(122,143,217,0.08)] hover:border-indigo-400/80 hover:shadow-[0_0_20px_rgba(122,143,217,0.25)] hover:bg-indigo-950/15"
                  style={{ height: '110px' }}
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sheet'); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#7a8fd9]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="w-11 h-11 mb-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <svg className="w-10 h-10 drop-shadow-[0_0_8px_rgba(122,143,217,0.6)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                      <path d="M11 1.8 4 4.3v6.4c0 4.8 2.9 7.6 7 9 4.1-1.4 7-4.2 7-9V4.3L11 1.8Z" stroke="#e8e4f5" strokeLinejoin="round" />
                      <circle cx="11" cy="9" r="3" stroke="#a89fc9" />
                      <path d="M6 15.5c0-1.8 1.8-3.2 5-3.2s5 1.4 5 3.2" stroke="#a89fc9" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-300 group-hover:text-white transition-colors duration-200">HERO SHEET</span>
                </button>
 
                {/* RECIPE PORTAL MODULE */}
                <button 
                  className="dash-tile-elevated group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl text-center transition-all duration-300 cursor-pointer focus:outline-none flex-1 md:w-full border border-rose-500/30 bg-rose-950/5 backdrop-blur-md shadow-[0_0_15px_rgba(255,117,151,0.08)] hover:border-rose-400/80 hover:shadow-[0_0_20px_rgba(255,117,151,0.25)] hover:bg-rose-950/15"
                  style={{ height: '110px' }}
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('recipes'); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#ff7597]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="w-11 h-11 mb-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <span className="text-[32px] filter drop-shadow-[0_0_8px_rgba(255,117,151,0.6)]">🧪</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-rose-300 group-hover:text-white transition-colors duration-200">ALCHEMIST COOK</span>
                </button>
                  </div>
                )}
 
                {/* Central Dice Tray Card (9 cols desktop, fill mobile) */}
                {visibleWidgets.diceTray && (
                  <div className={`${visibleWidgets.quickLaunch ? 'col-span-9' : 'col-span-12'} flex flex-col relative overflow-hidden self-stretch rounded-2xl border border-cyan-500/30 bg-cyan-950/5 backdrop-blur-md p-5 shadow-[0_0_30px_rgba(6,182,212,0.15)]`}>
                
                {/* Card Header title */}
                <div className="flex justify-between items-center pb-3 border-b border-[#2e2454] mb-4">
                  <span className="text-[12px] font-bold text-[#b4aae2] tracking-[0.25em] uppercase font-sans">DICE TRAY</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fa2f8a] shadow-[0_0_6px_#fa2f8a]"></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-center justify-between flex-grow py-1">
                  
                  {/* Interactive Summoning Stage */}
                  <div className="roll-stage relative w-[170px] h-[170px] flex items-center justify-center shrink-0">
                    {/* Concentric rotating rune SVG compilation */}
                    <svg className="absolute inset-0 w-full h-full animate-spin-slow opacity-40 pointer-events-none" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="92" fill="none" stroke="#cf4fe6" strokeWidth="0.8" strokeDasharray="4 8" />
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#4f7fe6" strokeWidth="1" />
                      <circle cx="100" cy="100" r="65" fill="none" stroke="#3fd9c7" strokeWidth="0.5" strokeDasharray="1 5" />
                      <path d="M 100 8 L 100 16 M 100 184 L 100 192 M 8 100 L 16 100 M 184 100 L 192 100" stroke="#cf4fe6" strokeWidth="1" />
                      <text x="100" y="28" fill="#3fd9c7" fontSize="7" textAnchor="middle" fontFamily="monospace">✵</text>
                      <text x="100" y="180" fill="#3fd9c7" fontSize="7" textAnchor="middle" fontFamily="monospace">✵</text>
                      <text x="28" y="103" fill="#cf4fe6" fontSize="7" textAnchor="middle" fontFamily="monospace">⚔</text>
                      <text x="172" y="103" fill="#cf4fe6" fontSize="7" textAnchor="middle" fontFamily="monospace">⚔</text>
                    </svg>
                    
                    <svg className="absolute inset-0 w-full h-full animate-spin-reverse opacity-25 pointer-events-none" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="74" fill="none" stroke="#fa2f8a" strokeWidth="0.6" strokeDasharray="2 6" />
                      <circle cx="100" cy="100" r="54" fill="none" stroke="#efc562" strokeWidth="1.2" strokeDasharray="6 24" />
                    </svg>

                    {/* Floating Polyhedral Dice selectors around the circle rim replaced with clean Coin Flip display */}
                    


                    

                    

                    

                    

                    
                    {/* Central Glowing Live roll value */}
                    <div className="flex flex-col items-center justify-center relative select-none">
                      <span className="roll-result-val text-[46px] font-bold text-[#faebd7] drop-shadow-[0_0_12px_rgba(207,79,230,0.75)] font-mono leading-none tracking-tight">Heads</span>
                      <span className="roll-sub-text text-[9px] uppercase tracking-[0.16em] text-[#8b7ac4] mt-1 text-center font-bold opacity-80 max-w-[100px] truncate font-sans">coin flip ready</span>
                    </div>
                  </div>

                  {/* Synchronized Real-time Recent Rolls column */}
                  <div className="flex flex-col w-full sm:w-[150px] shrink-0 border-t sm:border-t-0 sm:border-l border-[#3a206b]/40 pt-4 sm:pt-0 sm:pl-4 self-stretch justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#8b7ac4] tracking-[0.15em] uppercase block mb-2 font-sans">Recent Flips</span>
                      <div id="dashboardHistoryRow" className="flex flex-col gap-1.5 overflow-hidden">
                        {/* Dynamic compilation updates this list on sync */}
                      </div>
                    </div>
                    <div className="text-right mt-3 sm:mt-0 select-none">
                      <button 
                        className="text-[10px] text-[#ae95eb]/70 hover:text-white uppercase tracking-[0.14em] font-bold bg-transparent border-none cursor-pointer transition-colors duration-200 focus:outline-none" 
                        onClick={() => { const clr = document.getElementById('clearHistory'); if (clr) clr.click(); }}
                      >
                        Clear flips
                      </button>
                    </div>
                  </div>
                </div>

                {/* Wide Magical Primary button */}
                <button 
                  id="dashboardRollBtnMain" 
                  onClick={() => { if ((window as any).doRoll) (window as any).doRoll(2); }}
                  className="roll-btn w-full py-3.5 px-6 mt-4 rounded-xl font-sans font-extrabold text-[12px] tracking-[0.25em] uppercase cursor-pointer text-center select-none focus:outline-none transition-all duration-300 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                >
                  FLIP COIN
                </button>
                  </div>
                )}

              </div>
            )}

            {/* ROW 2: TRI-GRID COMPACT UTILITY TILES */}
            {visibleWidgets.utilityTiles && (
              <div className="grid grid-cols-3 gap-4 w-full">
              
              {/* SHEET CARD */}
              <button 
                className="relative overflow-hidden group flex flex-col items-center justify-center py-4 px-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/5 backdrop-blur-md hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 transform active:scale-95 cursor-pointer focus:outline-none" 
                onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sheet'); }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="mb-2 text-[#fff]/80 group-hover:text-white transition-transform duration-300 group-hover:scale-110">
                  {/* Magic Book SVG icon */}
                  <svg className="w-8 h-8 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zM20 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z" stroke="#e8e4f5" />
                    <path d="M6 6h2M6 10h2M14 6h2M14 10h2" stroke="#a89fc9" strokeLinecap="round" />
                    <path d="m11 2 .5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z" fill="#ffebaa" stroke="none" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-[0.18em] font-sans group-hover:text-white transition-colors duration-200">CHARACTERS</span>
              </button>

              {/* TASKS CARD */}
              <button 
                className="relative overflow-hidden group flex flex-col items-center justify-center py-4 px-3 rounded-2xl border border-purple-500/30 bg-purple-950/5 backdrop-blur-md hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 transform active:scale-95 cursor-pointer focus:outline-none" 
                onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('tasks'); }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-2.5 right-4 w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-b from-[#b22ce2] to-[#7f1da7] rounded-full shadow-[0_0_8px_rgba(178,44,226,0.6)] animate-pulse">3</div>
                <div className="mb-2 text-[#fff]/80 group-hover:text-white transition-transform duration-300 group-hover:scale-110">
                  {/* Ancient Map Scroll SVG icon */}
                  <svg className="w-8 h-8 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6l-4-4Z" stroke="#ffc9e8" />
                    <path d="M14 2v4h4" stroke="#e85f7a" />
                    <circle cx="8" cy="11" r="1.1" fill="#fff" />
                    <circle cx="8" cy="15" r="1.1" fill="#fff" />
                    <path d="M11 11h3M11 15h3" stroke="#ffd6ea" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-[0.18em] font-sans group-hover:text-white transition-colors duration-200">QUEST LOG</span>
              </button>

              {/* SETTINGS CARD */}
              <button 
                className="relative overflow-hidden group flex flex-col items-center justify-center py-4 px-3 rounded-2xl border border-pink-500/30 bg-pink-950/5 backdrop-blur-md hover:border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.15)] transition-all duration-300 transform active:scale-95 cursor-pointer focus:outline-none" 
                onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('settings'); }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="mb-2 text-[#fff]/80 group-hover:text-white transition-transform duration-300 group-hover:scale-110">
                  {/* Astrolabe compass gear SVG icon */}
                  <svg className="w-8 h-8 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <circle cx="11" cy="11" r="7" stroke="#c9f5e6" />
                    <circle cx="11" cy="11" r="2.5" stroke="#13efb0" />
                    <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.6 4.6l1.4 1.4M16 16l1.4 1.4M16 4.6l-1.4 1.4M4.6 16l1.4-1.4" stroke="#5fc9a8" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-pink-300 uppercase tracking-[0.18em] font-sans group-hover:text-white transition-colors duration-200">PORTAL SET</span>
              </button>
              </div>
            )}

            {/* ROW 3: TURN TRACKER & WEATHER WORLD DIAL COLUMNS */}
            {(visibleWidgets.turnTracker || visibleWidgets.worldClock) && (
              <div className={`grid grid-cols-1 ${visibleWidgets.turnTracker && visibleWidgets.worldClock ? 'md:grid-cols-2' : ''} gap-5 w-full`}>
                
                {/* Left Column: COMBAT TURN TRACKER */}
                {visibleWidgets.turnTracker && (
                  <div className="card rounded-2xl border border-fuchsia-500/30 bg-fuchsia-950/5 backdrop-blur-md p-4 flex flex-col shadow-[0_0_30px_rgba(217,70,239,0.12)]">
                
                {/* Header elements */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 mb-3.5">
                  <div className="flex items-center gap-2">
                    {/* Hourglass SVG symbol */}
                    <svg className="w-4 h-4 text-fuchsia-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 2h14M5 22h14M19 2v4a7 7 0 0 1-7 7a7 7 0 0 1-7-7V2 M5 22v-4a7 7 0 0 1 7-7a7 7 0 0 1 7 7v4" />
                      <circle cx="12" cy="5" r="1" fill="currentColor" />
                      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="text-[12px] font-bold text-[#faebd7] uppercase tracking-[0.15em]" style={{ fontFamily: "'Cormorant', serif" }}>TURN TRACKER</span>
                  </div>
                  <div className="flex items-center gap-1.5 select-none bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-0.5 rounded-lg text-fuchsia-300">
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (combatRound > 1) { setCombatRound(r => r - 1); haptic(8); } }}
                      className="text-[10px] font-extrabold hover:text-white px-1 cursor-pointer select-none focus:outline-none"
                    >
                      ‹
                    </button>
                    <span className="text-[9px] font-bold text-fuchsia-300 uppercase tracking-wider font-mono">ROUND {combatRound}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCombatRound(r => r + 1); haptic(8); }}
                      className="text-[10px] font-extrabold hover:text-white px-1 cursor-pointer select-none focus:outline-none"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Combatants list rows */}
                <div className="flex flex-col gap-2 flex-grow">
                  {combatants.map((c, idx) => {
                    const isActive = idx === activeCombatantIndex;
                    return (
                      <div 
                        key={idx}
                        onClick={() => { setActiveCombatantIndex(idx); haptic(12); }}
                        className={`combatant-row group/row cursor-pointer flex items-center justify-between border rounded-xl p-1.5 transition-all duration-300 ${
                          isActive 
                            ? 'border-fuchsia-500/60 bg-fuchsia-500/10 shadow-[0_0_12px_rgba(217,70,239,0.15)]' 
                            : 'border-[#44387a]/30 hover:border-fuchsia-500/30 hover:bg-fuchsia-500/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Active glowing index dot indicator */}
                          <span className={`w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_6px_#f55fe6] transition-all duration-300 ${isActive ? 'opacity-100 scale-110' : 'opacity-0'}`}></span>
                          
                          {/* Avatar based on type */}
                          {c.avatarType === 'wizard' && (
                            <svg className="w-10 h-10 rounded-full border border-teal-500/30 shadow-[0_0_8px_rgba(20,240,160,0.15)] shrink-0 bg-gradient-to-tr from-[#0e0c24] to-[#122e2a]" viewBox="0 0 40 40">
                              <circle cx="20" cy="20" r="18" fill="none" stroke="#2dd4bf" strokeWidth="0.5" strokeDasharray="2 3" />
                              <path d="M12 25 Q13 14 20 12 Q27 10 28 5 Q29 12 30 18 Q31 25 21 34 Z" fill="#cf4fe6" opacity="0.65" />
                              <path d="M15 27 Q14 16 19 14 Q24 12 26 8 Q27 15 26 21 Q25 27 18 35 Z" fill="#3fd9c7" opacity="0.45" />
                              <path d="M16 23 Q15 15 19 15 C21 15 22 17 22 19 C22 21 21 22 20 23" stroke="#fff" strokeWidth="0.8" fill="none" />
                              <path d="M19 16 Q23 10 26 13 Z" fill="#fff" opacity="0.9" />
                              <circle cx="21" cy="18" r="1" fill="#13efb0" className="animate-pulse" />
                            </svg>
                          )}
                          {c.avatarType === 'fighter' && (
                            <svg className="w-10 h-10 rounded-full border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)] shrink-0 bg-gradient-to-tr from-[#0a0f20] to-[#0d2a1a]" viewBox="0 0 40 40">
                              <circle cx="20" cy="20" r="18" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 3" />
                              <path d="M13 18 L20 8 L27 18 L25 22 L15 22 Z" fill="#5b6782" />
                              <path d="M20 8 L20 22" stroke="#efc562" strokeWidth="1" />
                              <path d="M14 22 Q20 36 26 22 L23 20 L20 22 L17 20 Z" fill="#e85f7a" />
                              <path d="M16 22 Q20 32 24 22" fill="none" stroke="#ffe9b8" strokeWidth="0.8" />
                            </svg>
                          )}
                          {c.avatarType === 'rogue' && (
                            <svg className="w-10 h-10 rounded-full border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)] shrink-0 bg-gradient-to-tr from-[#110418] to-[#2b102b]" viewBox="0 0 40 40">
                              <circle cx="20" cy="20" r="18" fill="none" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2 3" />
                              <path d="M11 28 Q10 12 20 10 Q30 12 29 28 L27 34 L13 34 Z" fill="#20113c" />
                              <path d="M13 28 Q12 14 20 12 Q28 14 27 28 Z" fill="#0d041c" />
                              <ellipse cx="17" cy="21" rx="1.8" ry="0.6" fill="#fcd34d" />
                              <ellipse cx="23" cy="21" rx="1.8" ry="0.6" fill="#fcd34d" />
                              <path d="M15 32 L16 25 L18 25 L16 32 Z M25 32 L24 25 L22 25 L24 32 Z" fill="#e8e4f5" opacity="0.6" />
                            </svg>
                          )}
                          {c.avatarType === 'paladin' && (
                            <svg className="w-10 h-10 rounded-full border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.15)] shrink-0 bg-gradient-to-tr from-[#1a0505] to-[#2b120c]" viewBox="0 0 40 40">
                              <circle cx="20" cy="20" r="18" fill="none" stroke="#f97316" strokeWidth="0.5" strokeDasharray="2 3" />
                              <path d="M12 18 L15 11 L18 13 L20 8 L22 13 L25 11 L28 18 L20 30 Z" fill="#7c2d12" />
                              <path d="M15 18 L20 14 L25 18 L20 28 Z" fill="#b91c1c" />
                              <path d="M17 18 L20 21 L23 18" stroke="#efc562" strokeWidth="0.8" fill="none" />
                              <polygon points="17,16 19,16 18,17" fill="#ffe9b8" />
                              <polygon points="23,16 21,16 22,17" fill="#ffe9b8" />
                            </svg>
                          )}
                          {c.avatarType === 'dm' && (
                            <svg className="w-10 h-10 rounded-full border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.15)] shrink-0 bg-gradient-to-tr from-[#0e041c] to-[#1e0a2b]" viewBox="0 0 40 40">
                              <circle cx="20" cy="20" r="18" fill="none" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2 3" />
                              <path d="M15 18 C14 11 26 11 25 18 C25 21 23 21 23 23 L22 26 L18 26 L17 23 C17 21 15 21 15 18 Z" fill="#ffebaa" opacity="0.85" />
                              <circle cx="18" cy="18" r="1.8" fill="#e85f7a" />
                              <circle cx="22" cy="18" r="1.8" fill="#e85f7a" />
                              <polygon points="20,20 19,21.5 21,21.5" fill="#0d041c" />
                              <path d="M18 24 L18 26 M20 24 L20 26 M22 24 L22 26" stroke="#0d041c" strokeWidth="0.8" />
                            </svg>
                          )}
                          
                          <div className="flex flex-col leading-none">
                            <span className={`text-[12px] font-bold uppercase tracking-wide comb-name ${idx === 4 ? 'text-red-400' : 'text-[#ffe9b8]'}`}>{c.name}</span>
                            <span className="text-[10px] text-[#b4aae2]/60 mt-0.5 font-medium font-sans">{c.class}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-[65px] sm:w-[80px] h-2 bg-[#2d244c] rounded-full overflow-hidden border border-[#cf4fe6]/15">
                            <div 
                              className="hp-bar h-full bg-gradient-to-r from-emerald-400 to-[#13efb0] rounded-full transition-all duration-300" 
                              style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center bg-[#251b47]/60 rounded-md border border-[#44387a]/50 p-0.5">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleHpChange(idx, -1); }}
                              className="hp-minus text-[11px] font-extrabold text-[#fa2f8a] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none"
                            >
                              -
                            </button>
                            <span className="hp-text text-[12px] font-bold font-mono text-emerald-400 min-w-[20px] text-center px-0.5">{c.hp}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleHpChange(idx, 1); }}
                              className="hp-plus text-[11px] font-extrabold text-[#13efb0] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* END TURN interactive button */}
                <button 
                  id="dashboardEndTurnBtn" 
                  onClick={handleEndTurn}
                  className="w-full py-2.5 mt-3 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/15 hover:bg-fuchsia-500/30 text-fuchsia-300 hover:text-white font-sans text-[11px] tracking-[0.16em] uppercase font-bold transition-all duration-200 cursor-pointer text-center select-none focus:outline-none hover:shadow-[0_0_15px_rgba(217,70,239,0.4)]"
                >                
                  END TURN
                </button>

                  </div>
                )}

                {/* Right Column: ASTROLOGICAL CLOCK & WEATHER CONDITIONS */}
                {visibleWidgets.worldClock && (
                  <div 
                    className="card rounded-2xl border border-cyan-500/30 bg-cyan-950/5 backdrop-blur-md p-4 flex flex-col items-center justify-between shadow-[0_0_30px_rgba(6,182,212,0.12)] cursor-pointer group hover:border-cyan-400"
                    onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('clock'); }}
                    title="Open Alarms & stopwatch panel"
                  >
                
                {/* Header elements */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 w-full mb-3 select-none">
                  <div className="flex items-center gap-2">
                    {/* Astronomical compass grid icon */}
                    <svg className="w-4 h-4 text-[#7a8fd9] group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10a15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12A15.3 15.3 0 0 1 12 2Z" strokeDasharray="2 3" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-[12px] font-bold text-[#faebd7] uppercase tracking-[0.15em] transition-colors duration-200 group-hover:text-white" style={{ fontFamily: "'Cormorant', serif" }}>WORLD CLOCK & WEATHER</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-70">
                    <span className="text-[8px] font-mono font-bold text-[#b4aae2] uppercase tracking-[0.1em]">EST</span>
                  </div>
                </div>

                {/* Main Astronomical Dial Face SVG and corner displays */}
                <div className="relative w-full flex-grow flex items-center justify-center py-2.5 select-none">
                  
                  {/* Outer corner displays layout details: */}
                  {/* Bottom-Left: Temp stats */}
                  <div className="absolute bottom-0 left-0 text-left leading-tight flex flex-col">
                    <span className="text-[10px] font-bold tracking-wide text-[#3fd9c7] font-mono">72°F</span>
                    <span className="text-[8px] text-[#b4aae2]/65 font-medium mt-0.5 font-sans flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" strokeLinecap="round" /><path d="M8 16v4M12 16v4M16 16v4" strokeLinecap="round" /></svg>
                      Light Rain
                    </span>
                  </div>
                  {/* Bottom-Right: Wind speed */}
                  <div className="absolute bottom-0 right-0 text-right leading-tight flex flex-col">
                    <span className="text-[10px] font-bold tracking-wide text-[#e85f7a] font-mono">8 MPH</span>
                    <span className="text-[8px] text-[#b4aae2]/65 font-medium mt-0.5 font-sans">Wind NE</span>
                  </div>

                  {/* Analog Clock Astrolabe wheel */}
                  <div className="relative w-[130px] h-[130px] rounded-full border border-[#2e2454]/60 bg-gradient-to-tr from-[#0a051d] via-[#150a31] to-[#040108] p-0.5 flex items-center justify-center shadow-[inset_0_0_15px_rgba(46,36,84,0.4)]">
                    
                    {/* Inner glowing galaxy background vortex inside clock */}
                    <div className="absolute inset-2.5 rounded-full bg-radial from-[#12194c]/50 via-transparent to-transparent opacity-65 pointer-events-none"></div>
                    <div className="absolute w-2 h-2 rounded-full bg-white/20 blur-[1px] animate-pulse"></div>

                    {/* Fine aesthetic lines and Roman numerals dial */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="#ffe9b8" strokeWidth="0.4" strokeOpacity="0.4" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#2e2454" strokeWidth="0.5" strokeOpacity="0.8" strokeDasharray="1 3" />
                      
                      {/* Roman Numerals XII, III, VI, IX */}
                      <text x="50" y="11" fill="#ffe9b8" fillOpacity="0.8" fontSize="6.5" textAnchor="middle" fontFamily="'Cormorant', serif" fontWeight="600">XII</text>
                      <text x="89" y="52" fill="#ffe9b8" fillOpacity="0.8" fontSize="6.5" textAnchor="middle" fontFamily="'Cormorant', serif" fontWeight="600">III</text>
                      <text x="50" y="93" fill="#ffe9b8" fillOpacity="0.8" fontSize="6.5" textAnchor="middle" fontFamily="'Cormorant', serif" fontWeight="600">VI</text>
                      <text x="11" y="52" fill="#ffe9b8" fillOpacity="0.8" fontSize="6.5" textAnchor="middle" fontFamily="'Cormorant', serif" fontWeight="600">IX</text>
                    </svg>

                    {/* Clock Needles Hands rotating dynamically! */}
                    {/* HOUR HAND */}
                    <div id="worldClockHour" className="absolute w-[4px] h-[34px] origin-bottom transition-all duration-1000 ease-out" style={{ bottom: '50%', transform: "rotate(0deg)", transformOrigin: '50% 100%' }}>
                      <div className="w-[2px] h-[32px] mx-auto rounded-full bg-gradient-to-t from-[#faebd7] to-[#e0a85f] shadow-[0_0_4px_#faebd7]"></div>
                    </div>
                    {/* MINUTE HAND */}
                    <div id="worldClockMin" className="absolute w-[3px] h-[46px] origin-bottom transition-all duration-1000 ease-out" style={{ bottom: '50%', transform: "rotate(0deg)", transformOrigin: '50% 100%' }}>
                      <div className="w-[1.5px] h-[44px] mx-auto rounded-full bg-[#faebd7]"></div>
                    </div>
                    {/* SECOND HAND */}
                    <div id="worldClockSec" className="absolute w-[2px] h-[52px] origin-bottom transition-all duration-100" style={{ bottom: '50%', transform: "rotate(0deg)", transformOrigin: '50% 100%' }}>
                      <div className="w-[0.8px] h-[50px] mx-auto rounded-full bg-[#fa2f8a]/90 shadow-[0_0_4px_#fa2f8a]"></div>
                    </div>

                    {/* Central Core Pin */}
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-white to-[#ffe9b8] z-10 shadow-[0_0_6px_#fff]"></div>
                    <div className="absolute w-4 h-4 rounded-full border border-[#ffe9b8]/35 pointer-events-none"></div>
                  </div>

                </div>

                <div className="text-[10px] uppercase font-bold text-[#7a8fd9]/75 tracking-[0.14em] font-sans pb-0.5 select-none">
                  ASTRONOMICAL WORLD COMPASS
                </div>

              </div>
                )}

              </div>
            )}

            {/* ROW 4: BEAUTIFUL DETAILED CAMPAIGN MAP ILLUSTRATION */}
            {(visibleWidgets.campaignOverview || visibleWidgets.upNext) && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
                
                {/* Left Side: CAMPAIGN OVERVIEW card (spans 8 columns on desktop, fill mobile) */}
                {visibleWidgets.campaignOverview && (
                  <div className={`card rounded-2xl border border-indigo-500/30 bg-indigo-950/5 backdrop-blur-md p-4 flex flex-col shadow-[0_0_30px_rgba(99,102,241,0.12)] ${visibleWidgets.upNext ? 'col-span-12 md:col-span-8' : 'col-span-12'} overflow-hidden relative min-h-[220px] justify-between`}>
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 z-10 mb-4 select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 text-[13px]">✦</span>
                    <span className="text-[12px] font-bold text-[#faebd7] uppercase tracking-[0.15em]" style={{ fontFamily: "'Cormorant', serif" }}>CAMPAIGN OVERVIEW</span>
                  </div>
                  <div className="w-4 h-4 text-[#8b7ac4] hover:text-white transition-colors duration-200 cursor-pointer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                  </div>
                </div>

                {/* BREATHTAKING PURE SVG LANDSCAPE BACKDROP ART IN REAL TIME RESPONSIVE SCALE */}
                <div className="absolute inset-x-0 bottom-0 top-[45px] opacity-35 pointer-events-none overflow-hidden select-none">
                  <svg className="w-full h-full object-cover" viewBox="0 0 400 180" preserveAspectRatio="none">
                    <defs>
                      <radialGradient id="skyNebula" cx="60%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#431477" />
                        <stop offset="45%" stopColor="#25084f" />
                        <stop offset="100%" stopColor="transparent" />
                      </radialGradient>
                    </defs>
                    
                    {/* Sky Background */}
                    <rect width="400" height="180" fill="url(#skyNebula)" />

                    {/* Cosmic stars sky cluster */}
                    <circle cx="80" cy="40" r="0.8" fill="#fff" />
                    <circle cx="120" cy="20" r="1" fill="#fff" opacity="0.8" />
                    <circle cx="280" cy="60" r="0.6" fill="#fff" />
                    <circle cx="340" cy="30" r="1.2" fill="#fff" className="animate-pulse" />
                    <circle cx="320" cy="20" r="0.5" fill="#fff" />
                    <circle cx="190" cy="45" r="0.7" fill="#fff" />
                    
                    {/* Huge Glowing Moon */}
                    <circle cx="310" cy="45" r="24" fill="#faf0e6" opacity="0.25" filter="blur(3px)" />
                    <circle cx="310" cy="45" r="21" fill="#fcf6eb" opacity="0.15" />

                    {/* Far Mountains silhouette */}
                    <polygon points="-20,180 80,100 150,140 220,95 290,145 370,80 430,180" fill="#0d081c" opacity="0.9" />
                    <polygon points="-40,180 50,130 110,155 190,120 250,150 310,110 390,150 450,180" fill="#1b1236" opacity="0.6" />

                    {/* Mystical Silhouette Fantasy Castle */}
                    <path 
                      d="M200 125 L200 85 L205 85 L205 125 L209 125 L209 90 L214 90 L214 125 L218 125 L218 78 L225 78 L225 65 L221 65 L221 55 L223 55 L223 65 L228 65 L228 125 L231 125 L231 82 L237 82 L237 125" 
                      fill="#06030c" 
                      opacity="0.95" 
                    />
                    {/* Spires rooftops */}
                    <polygon points="219,78 226,78 222.5,58" fill="#06030c" />
                    <polygon points="231,82 237,82 234,68" fill="#06030c" />
                    <polygon points="209,90 214,90 211.5,82" fill="#06030c" />
                    <polygon points="200,85 205,85 202.5,77" fill="#06030c" />

                    {/* Pine Trees forest silhouettes in the foreground base */}
                    <polygon points="10,180 18,160 26,180" fill="#030107" />
                    <polygon points="20,180 30,152 40,180" fill="#030107" />
                    <polygon points="35,180 42,165 49,180" fill="#030107" />
                    <polygon points="360,180 370,150 380,180" fill="#030107" />
                    <polygon points="375,180 382,162 389,180" fill="#030107" />
                  </svg>
                </div>

                {/* Overlaid Title and content descriptions */}
                <div className="z-10 mt-2 flex flex-col justify-start">
                  <span className="text-[9px] font-bold text-indigo-400 tracking-[0.25em] h-5 uppercase select-none">CURRENT CAMPAIGN</span>
                  <span className="text-[23px] font-semibold text-[#faebd7] tracking-wider leading-none mt-1 shadow-inner select-all" style={{ fontFamily: "'Cormorant', serif" }}>THE TOMB OF ASHES</span>
                  <span className="text-[11.5px] italic text-indigo-300/85 mt-2 tracking-wide font-sans select-all">Chapter 3: Shadows Awaken</span>
                </div>

                {/* Bottom metrics horizontal breakdown table panels */}
                <div className="grid grid-cols-4 gap-2 border-t border-indigo-500/20 pt-3 z-10 mt-6 select-none leading-none">
                  <div className="flex flex-col border-r border-indigo-500/20 pr-2">
                    <span className="text-[8px] text-indigo-300 uppercase tracking-wider font-semibold">Sessions</span>
                    <span className="text-[14px] font-bold text-indigo-200 font-mono mt-1">12</span>
                  </div>
                  <div className="flex flex-col border-r border-indigo-500/20 px-2">
                    <span className="text-[8px] text-indigo-300 uppercase tracking-wider font-semibold">Players</span>
                    <span className="text-[14px] font-bold text-indigo-200 font-mono mt-1">5</span>
                  </div>
                  <div className="flex flex-col border-r border-indigo-500/20 px-2 text-left">
                    <span className="text-[8px] text-indigo-300 uppercase tracking-wider font-semibold">Play Time</span>
                    <span className="text-[13px] font-bold text-indigo-200 font-mono mt-1">24h 30m</span>
                  </div>
                  <div className="flex flex-col pl-2 text-left">
                    <span className="text-[8px] text-indigo-300 uppercase tracking-wider font-semibold">Next Session</span>
                    <span className="text-[13px] font-bold text-[#e0a85f] mt-1 font-mono tracking-tight">JUL 15</span>
                  </div>
                </div>

                  </div>
                )}

                {/* Right Side: "UP NEXT" quest info card block (spans 4 columns on desktop, fill mobile) */}
                {visibleWidgets.upNext && (
                  <div className={`card rounded-2xl border border-pink-500/30 bg-pink-950/5 backdrop-blur-md p-4 flex flex-col shadow-[0_0_30px_rgba(236,72,153,0.12)] ${visibleWidgets.campaignOverview ? 'col-span-12 md:col-span-4' : 'col-span-12'} justify-between`}>
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-pink-500/20 mb-3.5 select-none">
                  <span className="text-[11px] font-bold text-pink-300 tracking-[0.16em] uppercase font-sans">UP NEXT</span>
                  <span className="text-[9px] font-bold text-pink-400 uppercase font-mono tracking-widest leading-none">QUEST</span>
                </div>

                <div className="flex items-center gap-3.5 mb-3.5">
                  {/* Knight/Dragon Shield crest emblem SVG */}
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-tr from-[#2d123c] to-[#0e071c] border border-pink-500/35 flex items-center justify-center shadow-[0_0_12px_rgba(236,72,153,0.22)]">
                    <svg className="w-8 h-8 text-[#ffe9b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#31134a" />
                      {/* Fire sparks */}
                      <path d="M12 7 L14 11 L10 11 Z" stroke="#cf4fe6" fill="#fa2f8a" />
                      <circle cx="12" cy="14" r="1.5" fill="#faebd7" />
                    </svg>
                  </div>

                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] font-bold text-pink-100 tracking-wider uppercase" style={{ fontFamily: "'Cormorant', serif" }}>Dragon Council</span>
                    <span className="text-[10px] text-pink-400 mt-0.5 font-bold font-mono uppercase tracking-wider">Main Quest — In 3 days</span>
                  </div>
                </div>

                {/* NPC check items */}
                <div className="flex flex-col gap-2 flex-grow justify-start">
                  <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg border border-pink-500/15 bg-pink-500/5">
                    <input 
                      type="checkbox" 
                      id="prepareNpcChk" 
                      defaultChecked 
                      className="accent-pink-500 w-3.5 h-3.5 rounded border-pink-500/40 cursor-pointer focus:outline-none" 
                      onClick={() => { haptic(8); }}
                    />
                    <label htmlFor="prepareNpcChk" className="text-[10.5px] text-pink-300 font-semibold tracking-wide cursor-pointer select-none">Prepare dragon models (3/3)</label>
                  </div>
                  <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg border border-pink-500/10 bg-transparent">
                    <input 
                      type="checkbox" 
                      id="gatherMinisChk" 
                      className="accent-pink-500 w-3.5 h-3.5 rounded border-pink-500/40 cursor-pointer focus:outline-none"
                      onClick={() => { haptic(8); }}
                    />
                    <label htmlFor="gatherMinisChk" className="text-[10.5px] text-pink-300/70 font-medium tracking-wide cursor-pointer select-none">Read Chapter 3 notes</label>
                  </div>
                </div>

                {/* Navigation Link button */}
                <button 
                  className="w-full py-2.5 mt-4 rounded-xl border border-pink-500/40 bg-pink-500/15 hover:bg-pink-500/30 text-pink-300 hover:text-white font-sans text-[11px] tracking-[0.16em] uppercase font-bold transition-all duration-300 cursor-pointer text-center select-none focus:outline-none hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calendar'); }}
                >
                  VIEW CALENDAR
                </button>

              </div>
                )}

              </div>
            )}

            {/* ROW 5: FATE ORACLE & HABIT STREAK CONTROLLERS */}
            {(visibleWidgets.oracle || visibleWidgets.habitStreak) && (
              <div className={`grid grid-cols-1 ${visibleWidgets.oracle && visibleWidgets.habitStreak ? 'md:grid-cols-12' : ''} gap-5 w-full`}>
                
                {/* Fate Decision Oracle Card */}
                {visibleWidgets.oracle && (
                  <div className={`card rounded-2xl border border-amber-500/30 bg-amber-950/5 backdrop-blur-md p-4 flex flex-col shadow-[0_0_30px_rgba(245,158,11,0.12)] ${visibleWidgets.habitStreak ? 'col-span-12 md:col-span-7' : 'col-span-12'} justify-between`}>
                <div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-amber-500/20 mb-3 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400">🔮</span>
                      <span className="text-[12px] font-bold text-amber-200 uppercase tracking-[0.15em]" style={{ fontFamily: "'Cormorant', serif" }}>Fate Decision Oracle</span>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">Alchemical Ask</span>
                  </div>
                  <p className="text-[10px] text-amber-300/70 mb-3 leading-snug">
                    Ask the Portal any question and focus your intent. The runes will consult your energy and reveal your path.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={oracleQuery}
                        onChange={(e) => setOracleQuery(e.target.value)}
                        placeholder="Should I go for a run today?..." 
                        className="flex-grow bg-amber-500/5 border border-amber-500/20 rounded-lg px-2.5 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-500/50 font-sans"
                      />
                      <button 
                        onClick={handleOracleConsult}
                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-150 shrink-0 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)] focus:outline-none"
                      >
                        Consult
                      </button>
                    </div>
                    
                    {/* Swirling CSS Ring and text for output */}
                    {(oracleLoading || oracleAnswer) && (
                      <div className="flex flex-col items-center justify-center p-3 relative bg-amber-950/15 border border-amber-500/20 rounded-xl transition-all duration-300 animate-fadeIn">
                        {oracleLoading ? (
                          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                        ) : (
                          <p className="text-xs font-semibold text-amber-200 text-center italic">{oracleAnswer}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                  </div>
                )}

                {/* Habit Streak Tracker Card */}
                {visibleWidgets.habitStreak && (
                  <div className={`card rounded-2xl border border-emerald-500/30 bg-emerald-950/5 backdrop-blur-md p-4 flex flex-col justify-between shadow-[0_0_30px_rgba(16,185,129,0.12)] ${visibleWidgets.oracle ? 'col-span-12 md:col-span-5' : 'col-span-12'}`}>
                <div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-emerald-500/20 mb-2 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 animate-pulse">🔥</span>
                      <span className="text-[12px] font-bold text-emerald-200 uppercase tracking-[0.15em]" style={{ fontFamily: "'Cormorant', serif" }}>Quest Habit Streak</span>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Routine Track</span>
                  </div>
                  <p className="text-[10px] text-emerald-300/70 mb-3 leading-snug">
                    Execute your everyday routine items! Each completed "Routine" task on your Quest Log grows your streak.
                  </p>
                  <div className="flex items-center gap-4 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 mt-1 select-none">
                    <div className="relative flex items-center justify-center shrink-0 w-10 h-10">
                      {/* Glowing outer rings */}
                      <div className="absolute inset-0 rounded-full border border-emerald-500/20 border-dashed animate-spin"></div>
                      <span className="text-2xl filter drop-shadow-[0_0_6px_#10b981]">🔥</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest leading-none">Active Streak</span>
                      <span className="text-xl font-black text-emerald-300 leading-none mt-1 font-mono">{habitStreak} {habitStreak === 1 ? 'Day' : 'Days'}</span>
                      <span className="text-[9px] text-emerald-300/60 mt-1 leading-tight">Complete everyday routine tasks to maintain.</span>
                    </div>
                  </div>
                </div>
                  </div>
                )}

              </div>
            )}

            {/* Empty state when all widgets are hidden */}
            {Object.values(visibleWidgets).every(v => v === false) && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-[#44387a]/45 rounded-3xl bg-[#130a2a]/30 shadow-inner">
                <span className="text-4xl mb-4 filter drop-shadow-[0_0_10px_rgba(207,79,230,0.4)]">✨</span>
                <h3 className="text-lg font-bold text-[#faebd7] tracking-wider font-sans uppercase">Your Dashboard is empty</h3>
                <p className="text-[12px] text-[#b4aae2]/70 mt-2 max-w-sm leading-relaxed">
                  All widgets are currently hidden. Tap the button below to add your favorite features back!
                </p>
                <button 
                  onClick={() => setShowCustomizeModal(true)}
                  className="px-4 py-2 mt-5 bg-gradient-to-r from-[#cf4fe6] to-[#ff7597] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 shadow-[0_0_15px_rgba(207,79,230,0.4)] transition cursor-pointer"
                >
                  ⚙️ Configure Widgets
                </button>
              </div>
            )}

          </div>

          {/* CUSTOMIZE LAYOUT MODAL */}
          {showCustomizeModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
                onClick={() => setShowCustomizeModal(false)}
              ></div>
              
              <div className="relative w-full max-w-lg rounded-2xl border border-[#cf4fe6]/40 bg-gradient-to-b from-[#1a103c] to-[#0a051d] p-6 shadow-[0_0_50px_rgba(207,79,230,0.15)] flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-[#3d2766]/60 mb-4 select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚙️</span>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#faebd7] uppercase tracking-wider font-sans">Customize Dashboard</h3>
                      <p className="text-[10px] text-[#b4aae2]/60 mt-0.5 font-sans">Toggle widgets to arrange your screen</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCustomizeModal(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-[#24174d]/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-[#3d2766]/50 transition cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mb-4 select-none">
                  <button 
                    onClick={() => {
                      haptic(10);
                      setVisibleWidgets({
                        quickLaunch: true,
                        diceTray: true,
                        utilityTiles: true,
                        turnTracker: true,
                        worldClock: true,
                        campaignOverview: true,
                        upNext: true,
                        oracle: true,
                        habitStreak: true
                      });
                    }}
                    className="flex-1 py-1.5 bg-[#cf4fe6]/10 hover:bg-[#cf4fe6]/20 text-[#cf4fe6] border border-[#cf4fe6]/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Show All
                  </button>
                  <button 
                    onClick={() => {
                      haptic(10);
                      setVisibleWidgets({
                        quickLaunch: false,
                        diceTray: false,
                        utilityTiles: false,
                        turnTracker: false,
                        worldClock: false,
                        campaignOverview: false,
                        upNext: false,
                        oracle: false,
                        habitStreak: false
                      });
                    }}
                    className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Hide All
                  </button>
                </div>

                {/* List of Widgets */}
                <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 py-1">
                  {[
                    { key: 'quickLaunch', label: 'Quick Launch Buttons', desc: 'Shortcuts to Roll Panel, Journal, Stats & Cook', icon: '🚀' },
                    { key: 'diceTray', label: 'Central Dice Tray', desc: 'Roll dice, flip coins, and view roll history', icon: '🎲' },
                    { key: 'utilityTiles', label: 'Character & Quest Shortcuts', desc: 'Direct links to characters, quest logs & settings', icon: '📜' },
                    { key: 'turnTracker', label: 'Combat Turn Tracker', desc: 'Track rounds, active turns, and initiative', icon: '⏳' },
                    { key: 'worldClock', label: 'Astrological Clock & Weather', desc: 'Animated clock dial face and regional weather info', icon: '☀️' },
                    { key: 'campaignOverview', label: 'Campaign Overview Map', desc: 'Detailed campaign settings, player count & calendar', icon: '🗺️' },
                    { key: 'upNext', label: 'Up Next Active Quest', desc: 'Track current milestones and quick task checkboxes', icon: '🎯' },
                    { key: 'oracle', label: 'Fate Decision Oracle', desc: 'Consult the cosmos and ask open-ended questions', icon: '🔮' },
                    { key: 'habitStreak', label: 'Quest Habit Streak', desc: 'Keep track of consecutive days completing routines', icon: '🔥' },
                  ].map((w) => (
                    <div 
                      key={w.key}
                      onClick={() => toggleWidgetVisibility(w.key)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                        visibleWidgets[w.key] 
                          ? 'bg-[#1e1346]/40 border-[#cf4fe6]/45 shadow-[0_0_12px_rgba(207,79,230,0.1)]' 
                          : 'bg-black/20 border-[#3d2766]/30 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{w.icon}</span>
                        <div className="text-left">
                          <span className="text-xs font-bold text-[#faebd7] leading-tight block">{w.label}</span>
                          <span className="text-[10px] text-[#b4aae2]/60 mt-0.5 leading-snug block">{w.desc}</span>
                        </div>
                      </div>
                      
                      {/* Visual Switch */}
                      <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${
                        visibleWidgets[w.key] ? 'bg-[#cf4fe6]' : 'bg-slate-700'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          visibleWidgets[w.key] ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-[#3d2766]/60 flex justify-end select-none">
                  <button 
                    onClick={() => {
                      haptic(15);
                      setShowCustomizeModal(false);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#cf4fe6] to-[#fa2f8a] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 shadow-[0_4px_15px_-3px_rgba(207,79,230,0.4)] transition cursor-pointer"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ROLL PANEL */}
        <div className="panel" id="panel-roll">
          <div className="sub-navigation">
            <button className="sub-nav-btn" data-sub-panel="roll" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('roll'); }}>🎮 Co-op Games</button>
            <button className="sub-nav-btn" data-sub-panel="sheet" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sheet'); }}>📜 Sheet</button>
            <button className="sub-nav-btn" data-sub-panel="recipes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('recipes'); }}>🍳 Cook</button>
            <button className="sub-nav-btn" data-sub-panel="game" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('game'); }}>🎯 Mini-Games</button>
          </div>
          <div className="flex flex-col gap-6">
            {/* Holographic Dice Vision Button */}
            <div className="flex justify-between items-center bg-[#150f2e]/60 rounded-xl border border-[#3fd9c7]/25 p-2 px-3 select-none">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎲</span>
                <span className="text-[11px] font-bold text-[#3fd9c7] uppercase tracking-wider">On-Table Dice Scanner</span>
              </div>
              <button 
                className="px-3 py-1.5 rounded-lg border border-[#3fd9c7]/40 bg-[#3fd9c7]/10 hover:bg-[#3fd9c7]/20 text-[#3fd9c7] hover:text-white font-bold text-[9.5px] uppercase tracking-wider flex items-center gap-1.5 transition duration-200 cursor-pointer shadow-[0_0_10px_rgba(63,217,199,0.15)]"
                onClick={() => { haptic(10); if ((window as any).openRiftVision) (window as any).openRiftVision('dice'); }}
              >
                <Camera size={11} /> Scan Dice Roll
              </button>
            </div>

            <DiceTrayCanvas />
            
            {/* Game Selector Segmented Tabs */}
            <div className="segmented flex p-1 bg-[#120826]/80 border border-[#3fd9c7]/15 rounded-xl w-full">
              <button
                onClick={() => { setGameTab('war'); haptic(10); }}
                className={`flex-1 py-2 text-[10px] font-extrabold tracking-widest uppercase transition-all rounded-lg ${gameTab === 'war' ? 'active bg-[#3fd9c7]/20 text-[#3fd9c7] border border-[#3fd9c7]/30' : 'text-[#b4aae2]/50'}`}
              >
                ⚔️ D20 War
              </button>
              <button
                onClick={() => { setGameTab('cosmic'); haptic(10); }}
                className={`flex-1 py-2 text-[10px] font-extrabold tracking-widest uppercase transition-all rounded-lg ${gameTab === 'cosmic' ? 'active bg-[#3fd9c7]/20 text-[#3fd9c7] border border-[#3fd9c7]/30' : 'text-[#b4aae2]/50'}`}
              >
                🔮 Cosmic Words
              </button>
            </div>

            {gameTab === 'war' ? (
              <D20War currentUser={currentUser} />
            ) : (
              <CosmicWords currentUser={currentUser} />
            )}
          </div>
        </div>

        {/* NOTES PANEL */}
        <div className="panel" id="panel-notes">
          <div className="sub-navigation flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between border-b border-[#2e2454]/45 pb-3 mb-4 select-none">
            {/* ORGANIZER GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#ff7597] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Organizer</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="notes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('notes'); }}>📝 Notes</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calendar" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calendar'); }}>📅 Calendar</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="tasks" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('tasks'); }}>✅ Tasks</button>
              </div>
            </div>
            {/* TOOLS GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#3fd9c7] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Tools</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calc" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calc'); }}>🧮 Calc</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="clock" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('clock'); }}>⏳ Timer</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="sports" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sports'); }}>🏆 Sports</button>
              </div>
            </div>
          </div>
          <section className="card">
            <p className="section-label">Notes</p>
            <div className="notes-list" id="notesList"></div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button className="add-note-btn flex-1" id="addNoteBtn">
                + add a note
              </button>
              <button 
                className="px-4 py-2.5 rounded-xl border border-[#3fd9c7]/40 bg-[#3fd9c7]/10 hover:bg-[#3fd9c7]/20 text-[#3fd9c7] hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                onClick={() => { haptic(10); if ((window as any).openRiftVision) (window as any).openRiftVision('notes'); }}
              >
                <Camera size={14} /> Scan Notes
              </button>
            </div>
          </section>
        </div>

        {/* SHEET PANEL */}
        <div className="panel" id="panel-sheet">
          <div className="sub-navigation">
            <button className="sub-nav-btn" data-sub-panel="roll" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('roll'); }}>🎮 Co-op Games</button>
            <button className="sub-nav-btn" data-sub-panel="sheet" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sheet'); }}>📜 Sheet</button>
            <button className="sub-nav-btn" data-sub-panel="recipes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('recipes'); }}>🍳 Cook</button>
            <button className="sub-nav-btn" data-sub-panel="game" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('game'); }}>🎯 Mini-Games</button>
          </div>
          <section className="card">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 mb-4 select-none">
              <p className="section-label m-0">Identity</p>
              <button 
                className="px-3 py-1.5 rounded-lg border border-[#cf4fe6]/40 bg-[#cf4fe6]/10 hover:bg-[#cf4fe6]/20 text-[#cf4fe6] hover:text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition duration-200 cursor-pointer"
                onClick={() => { haptic(10); if ((window as any).openRiftVision) (window as any).openRiftVision('character'); }}
              >
                <Camera size={12} /> Scan sheet
              </button>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Character name</label>
                <input id="ch-name" type="text" />
              </div>
              <div className="field">
                <label>Class & level</label>
                <input id="ch-class" type="text" placeholder="Fighter 3" />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Species</label>
                <input id="ch-species" type="text" />
              </div>
              <div className="field">
                <label>Background</label>
                <input id="ch-background" type="text" />
              </div>
            </div>
          </section>

          <section className="card">
            <p className="section-label">Ability scores</p>
            <div className="stat-grid">
              <div className="stat-box">
                <label>STR</label>
                <input id="st-str" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-str">
                  +0
                </div>
              </div>
              <div className="stat-box">
                <label>DEX</label>
                <input id="st-dex" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-dex">
                  +0
                </div>
              </div>
              <div className="stat-box">
                <label>CON</label>
                <input id="st-con" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-con">
                  +0
                </div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-box">
                <label>INT</label>
                <input id="st-int" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-int">
                  +0
                </div>
              </div>
              <div className="stat-box">
                <label>WIS</label>
                <input id="st-wis" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-wis">
                  +0
                </div>
              </div>
              <div className="stat-box">
                <label>CHA</label>
                <input id="st-cha" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-cha">
                  +0
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <p className="section-label">Combat</p>
            <div className="hp-row">
              <div className="field">
                <label>HP current</label>
                <input id="ch-hpcur" type="number" />
              </div>
              <div className="field">
                <label>HP max</label>
                <input id="ch-hpmax" type="number" />
              </div>
              <div className="field">
                <label>AC</label>
                <input id="ch-ac" type="number" />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Initiative</label>
                <input id="ch-init" type="text" />
              </div>
              <div className="field">
                <label>Speed</label>
                <input id="ch-speed" type="text" placeholder="30 ft" />
              </div>
            </div>
            <div className="field-row full">
              <div className="field">
                <label>Proficiency bonus</label>
                <input id="ch-prof" type="number" defaultValue="2" />
              </div>
            </div>
          </section>

          <section className="card">
            <p className="section-label">Notes & equipment</p>
            <div className="field-row full">
              <div className="field">
                <textarea
                  id="ch-equip"
                  rows={4}
                  className="sheet-textarea"
                  placeholder="Weapons, spells, items..."
                ></textarea>
              </div>
            </div>
            <div className="save-status" id="sheetSaveStatus"></div>
            <div className="backup-row">
              <button id="exportSheet" className="btn-glass">
                Export sheet
              </button>
              <button id="importSheetBtn" className="btn-glass">
                Import sheet
              </button>
            </div>
            <input
              type="file"
              id="importSheetFile"
              accept="application/json"
              style={{ display: 'none' }}
            />
          </section>
        </div>

        {/* CALC PANEL */}
        <div className="panel" id="panel-calc">
          <div className="sub-navigation flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between border-b border-[#2e2454]/45 pb-3 mb-4 select-none">
            {/* ORGANIZER GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#ff7597] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Organizer</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="notes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('notes'); }}>📝 Notes</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calendar" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calendar'); }}>📅 Calendar</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="tasks" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('tasks'); }}>✅ Tasks</button>
              </div>
            </div>
            {/* TOOLS GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#3fd9c7] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Tools</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calc" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calc'); }}>🧮 Calc</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="clock" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('clock'); }}>⏳ Timer</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="sports" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sports'); }}>🏆 Sports</button>
              </div>
            </div>
          </div>
          <section className="card">
            <div className="calc-tabs">
              <div className="calc-tab active" data-calc="basic">
                Calculator
              </div>
              <div className="calc-tab" data-calc="tip">
                Tip / Split
              </div>
              <div className="calc-tab" data-calc="convert">
                Convert
              </div>
            </div>

            <div className="calc-sub active" id="calc-basic">
              <div className="calc-display mono" id="calcDisplay">
                0
              </div>
              <div className="calc-keys" id="calcKeys">
                {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='].map((k) => (
                  <button
                    key={k}
                    className={`calc-key${['÷', '×', '-', '+'].includes(k) ? ' op' : ''}${k === '=' ? ' eq' : ''}${['C', '±', '%', '⌫'].includes(k) ? ' fn' : ''}`}
                    onClick={() => {
                      if ((window as any).handleCalcKey) {
                        (window as any).handleCalcKey(k);
                      }
                      haptic(7);
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="calc-sub" id="calc-tip">
              <div className="tip-row">
                <label>Bill amount</label>
                <input type="number" id="tipBill" placeholder="0.00" inputMode="decimal" />
              </div>
              <div className="tip-row">
                <label>
                  Tip percent: <span id="tipPctLabel">18</span>%
                </label>
                <input type="range" id="tipPct" min="0" max="35" defaultValue="18" />
              </div>
              <div className="tip-row">
                <label>Split between</label>
                <input type="number" id="tipSplit" defaultValue="1" min="1" inputMode="numeric" />
              </div>
              <div className="tip-results">
                <div className="tip-result-box">
                  <div className="val mono" id="tipAmount">
                    $0.00
                  </div>
                  <div className="lbl">tip</div>
                </div>
                <div className="tip-result-box">
                  <div className="val mono" id="tipTotal">
                    $0.00
                  </div>
                  <div className="lbl">total</div>
                </div>
                <div className="tip-result-box">
                  <div className="val mono" id="tipPerPerson">
                    $0.00
                  </div>
                  <div className="lbl">each (w/ tip)</div>
                </div>
                <div className="tip-result-box">
                  <div className="val mono" id="tipPerPersonNoTip">
                    $0.00
                  </div>
                  <div className="lbl">each (bill only)</div>
                </div>
              </div>
            </div>

            <div className="calc-sub" id="calc-convert">
              <div className="calc-tabs" style={{ marginBottom: '14px' }}>
                <div className="calc-tab active" data-conv="length">
                  Length
                </div>
                <div className="calc-tab" data-conv="weight">
                  Weight
                </div>
                <div className="calc-tab" data-conv="temp">
                  Temp
                </div>
                <div className="calc-tab" data-conv="cooking">
                  Kitchen
                </div>
              </div>
              <div className="convert-row">
                <input type="number" id="convInput" defaultValue="1" inputMode="decimal" />
                <select id="convFrom"></select>
              </div>
              <div style={{ textAlign: 'center' }} className="convert-arrow">
                ↓
              </div>
              <div className="convert-row">
                <select id="convTo" style={{ flex: 1 }}></select>
              </div>
              <div className="convert-result mono" id="convResult">
                —
              </div>
            </div>
          </section>
        </div>

        {/* TASKS PANEL */}
        <div className="panel" id="panel-tasks">
          <div className="sub-navigation flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between border-b border-[#2e2454]/45 pb-3 mb-4 select-none">
            {/* ORGANIZER GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#ff7597] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Organizer</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="notes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('notes'); }}>📝 Notes</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calendar" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calendar'); }}>📅 Calendar</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="tasks" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('tasks'); }}>✅ Tasks</button>
              </div>
            </div>
            {/* TOOLS GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#3fd9c7] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Tools</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calc" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calc'); }}>🧮 Calc</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="clock" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('clock'); }}>⏳ Timer</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="sports" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sports'); }}>🏆 Sports</button>
              </div>
            </div>
          </div>
          <section className="card">
            <p className="section-label">To-do</p>
            <div className="task-input-row flex gap-2">
              <input type="text" id="taskInput" placeholder="add a task..." className="flex-grow min-w-0" />
              <select id="taskPrioritySelect" className="bg-[#1a1138] border border-[#44387a]/40 rounded-lg px-2 text-xs text-[#b4aae2] focus:outline-none focus:border-[#cf4fe6] cursor-pointer">
                <option value="critical">🚨 Lethal</option>
                <option value="main">🎯 Main</option>
                <option value="minor" selected>⚙ Minor</option>
                <option value="routine">🔄 Routine</option>
              </select>
              <button id="taskAddBtn" className="btn-icon shrink-0">
                +
              </button>
            </div>
            <div id="taskList"></div>
          </section>
        </div>

        {/* CLOCK PANEL */}
        <div className="panel" id="panel-clock">
          <div className="sub-navigation flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between border-b border-[#2e2454]/45 pb-3 mb-4 select-none">
            {/* ORGANIZER GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#ff7597] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Organizer</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="notes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('notes'); }}>📝 Notes</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calendar" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calendar'); }}>📅 Calendar</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="tasks" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('tasks'); }}>✅ Tasks</button>
              </div>
            </div>
            {/* TOOLS GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#3fd9c7] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Tools</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calc" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calc'); }}>🧮 Calc</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="clock" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('clock'); }}>⏳ Timer</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="sports" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sports'); }}>🏆 Sports</button>
              </div>
            </div>
          </div>
          <section className="card">
            <div className="calc-tabs">
              <div className="calc-tab active" data-clock="timer">
                Timer
              </div>
              <div className="calc-tab" data-clock="stopwatch">
                Stopwatch
              </div>
              <div className="calc-tab" data-clock="alarm">
                Alarm
              </div>
              <div className="calc-tab" data-clock="pomodoro">
                Pomodoro
              </div>
            </div>

            <div className="calc-sub active" id="clock-timer">
              <div className="big-display mono" id="timerDisplay">
                00:00
              </div>
              <div className="timer-presets">
                <button data-secs="60" className="btn-chip">
                  1 min
                </button>
                <button data-secs="300" className="btn-chip">
                  5 min
                </button>
                <button data-secs="600" className="btn-chip">
                  10 min
                </button>
                <button data-secs="900" className="btn-chip">
                  15 min
                </button>
              </div>
              <div className="convert-row">
                <input type="number" id="timerMinInput" placeholder="min" inputMode="numeric" min="0" />
                <input type="number" id="timerSecInput" placeholder="sec" inputMode="numeric" min="0" max="59" />
              </div>
              <button className="roll-btn btn-primary shiny" id="timerStartBtn">
                Start
              </button>
              <button className="btn-glass" id="timerResetBtn" style={{ width: '100%', marginTop: '8px' }}>
                Reset
              </button>
              <p className="settings-note" id="timerNote">
                Set a time and start. A notification fires when it ends, if your browser
                allows it.
              </p>
            </div>

            <div className="calc-sub" id="clock-stopwatch">
              <div className="big-display mono" id="stopwatchDisplay">
                00:00.0
              </div>
              <button className="roll-btn btn-primary shiny" id="stopwatchStartBtn">
                Start
              </button>
              <div className="backup-row">
                <button id="stopwatchLapBtn" className="btn-glass">
                  Lap
                </button>
                <button id="stopwatchResetBtn" className="btn-glass danger">
                  Reset
                </button>
              </div>
              <div id="lapList"></div>
            </div>

            <div className="calc-sub" id="clock-alarm">
              <div className="task-input-row">
                <input type="time" id="alarmTimeInput" />
                <button id="alarmAddBtn" className="btn-icon">
                  +
                </button>
              </div>
              <p className="settings-note">
                Alarms fire as a notification while this app is open or running in the
                background. They will not wake a locked phone the way a built-in clock
                app can — that requires system-level access a web app cannot get.
              </p>
              <div id="alarmList"></div>
            </div>

            <div className="calc-sub flex flex-col items-center" id="clock-pomodoro" style={{ display: 'none' }}>
              <p className="section-label self-start w-full">Pomodoro Focus Timer</p>
              <div className="flex flex-col items-center justify-center p-3 w-full">
                <div className="text-4xl font-extrabold font-mono text-[#fa2f8a] mb-2 tracking-wider" id="pomoTimeDisplay">
                  25:00
                </div>
                <div className="text-[9px] text-[#b4aae2] uppercase tracking-[0.2em] font-extrabold mb-4" id="pomoStateLabel">
                  Focus Session
                </div>
                
                <div className="flex gap-2 w-full justify-center">
                  <button id="pomoStartBtn" className="px-4 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase rounded-lg cursor-pointer transition-all">
                    Start
                  </button>
                  <button id="pomoPauseBtn" className="px-4 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/20 text-amber-400 font-bold text-xs uppercase rounded-lg cursor-pointer transition-all">
                    Pause
                  </button>
                  <button id="pomoResetBtn" className="px-4 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/20 text-red-400 font-bold text-xs uppercase rounded-lg cursor-pointer transition-all">
                    Reset
                  </button>
                </div>
              </div>
              <div className="text-[9.5px] text-[#b4aae2]/60 mt-3 text-center max-w-xs leading-relaxed select-none">
                A 25-minute productivity sprint with a soft organic chime on zero, helping you stay in deep creative flow.
              </div>
            </div>
          </section>
        </div>

        {/* SPORTS PANEL */}
        <div className="panel" id="panel-sports">
          <div className="sub-navigation flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between border-b border-[#2e2454]/45 pb-3 mb-4 select-none">
            {/* ORGANIZER GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#ff7597] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Organizer</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="notes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('notes'); }}>📝 Notes</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calendar" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calendar'); }}>📅 Calendar</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="tasks" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('tasks'); }}>✅ Tasks</button>
              </div>
            </div>
            {/* TOOLS GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#3fd9c7] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Tools</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calc" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calc'); }}>🧮 Calc</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="clock" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('clock'); }}>⏳ Timer</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="sports" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sports'); }}>🏆 Sports</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
            {/* Real-time scores sheet */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
              <section className="card p-5 rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 mb-4 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#3fd9c7]">🏆</span>
                    <span className="text-[12px] font-bold text-[#faebd7] uppercase tracking-[0.15em]" style={{ fontFamily: "'Cormorant', serif" }}>SportCast FreeGate scoreboard</span>
                  </div>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-black">Free live feeds</span>
                </div>

                {/* ONLINE REQUIREMENT WARNING */}
                <div className="mb-4 p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl flex items-start gap-2.5">
                  <span className="text-teal-400 mt-0.5 text-xs">🌐</span>
                  <div>
                    <h4 className="text-[10.5px] font-bold text-[#faebd7] uppercase tracking-wider">Free online connectivity required</h4>
                    <p className="text-[9.5px] text-[#b4aae2]/75 leading-relaxed mt-0.5">
                      SportCast is 100% free and requires no premium tokens or subscriptions. However, you <strong>must remain online</strong> with an active internet connection to stream, refresh, and query the live scores from public feed networks.
                    </p>
                  </div>
                </div>

                {/* Categories and actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(SPORTS_LEAGUES).map(([key, league]) => (
                      <button
                        key={key}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer border ${
                          activeSportsLeague === key 
                            ? 'bg-gradient-to-r from-[#cf4fe6] to-[#ff7597] text-white border-transparent shadow-[0_0_10px_rgba(207,79,230,0.3)]' 
                            : 'bg-[#1a1138]/60 text-[#b4aae2] border-[#44387a]/45 hover:text-white hover:border-[#cf4fe6]/50'
                        }`}
                        onClick={() => setActiveSportsLeague(key as SportsLeague)}
                      >
                        {league.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#cf4fe6]/10 hover:bg-[#cf4fe6]/20 border border-[#cf4fe6]/40 hover:border-[#cf4fe6] rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-[#cf4fe6] hover:text-white transition cursor-pointer"
                      onClick={() => { haptic(10); if ((window as any).openRiftVision) (window as any).openRiftVision('betslip'); }}
                    >
                      📷 Scan Slip
                    </button>
                    <button 
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1138] hover:bg-[#251950] border border-[#cf4fe6]/40 hover:border-[#cf4fe6] rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-white transition cursor-pointer" 
                      onClick={() => loadSportsScores()}
                    >
                      🔄 Fetch Live
                    </button>
                  </div>
                </div>

                {/* Status/last refreshed */}
                <div className="flex items-center justify-between text-[9px] text-[#b4aae2]/60 bg-[#150f2e]/40 px-3 py-2 rounded-lg border border-[#44387a]/20 mb-4 select-none">
                  <span>{sportsStatus}</span>
                  <span className="font-mono text-[#faebd7]">Updated: {sportsUpdated}</span>
                </div>

                {/* Score vs Schedule Sub Tabs */}
                <div className="flex border-b border-[#2e2454]/40 mb-4 select-none">
                  <button 
                    className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border-b-2 ${
                      sportsSubTab === 'scores' 
                        ? 'text-[#3fd9c7] border-[#3fd9c7] bg-[#3fd9c7]/5' 
                        : 'text-[#b4aae2] border-transparent hover:text-white'
                    }`}
                    onClick={() => { haptic(5); setSportsSubTab('scores'); }}
                  >
                    🔴 Live & Results
                  </button>
                  <button 
                    className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border-b-2 ${
                      sportsSubTab === 'schedule' 
                        ? 'text-[#cf4fe6] border-[#cf4fe6] bg-[#cf4fe6]/5' 
                        : 'text-[#b4aae2] border-transparent hover:text-white'
                    }`}
                    onClick={() => { haptic(5); setSportsSubTab('schedule'); }}
                  >
                    📅 Upcoming Schedule
                  </button>
                </div>

                {/* Score grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(() => {
                    const filteredGames = sportsGames.filter((event) => {
                      const competition = event.competitions?.[0];
                      const state = competition?.status?.type?.state || event.status?.type?.state || '';
                      if (sportsSubTab === 'schedule') {
                        return state === 'pre';
                      } else {
                        return state !== 'pre';
                      }
                    });

                    if (filteredGames.length === 0) {
                      return (
                        <div className="col-span-full py-12 text-center text-[#b4aae2]/50 text-[11px] italic border border-dashed border-[#44387a]/35 rounded-xl">
                          {sportsSubTab === 'schedule' 
                            ? 'No upcoming games scheduled on this league feed.' 
                            : 'No live or recently completed games on this league feed.'}
                        </div>
                      );
                    }

                    return filteredGames.map((event) => {
                      const competition = event.competitions?.[0];
                      const competitors = (competition?.competitors || [])
                        .slice()
                        .sort((a: any) => (a.homeAway === 'away' ? -1 : 1));

                      const statusType = competition?.status?.type || event.status?.type || {};
                      const state = statusType.state || '';
                      const detail = statusType.detail || formatSportsDate(event.date);

                      const isFavorite = competitors.some(teamMatchesFavorite);

                      return (
                        <article
                          key={event.id}
                          className={`p-3.5 border rounded-xl flex flex-col justify-between gap-3 transition-all duration-200 bg-[#0c0720]/45 ${
                            isFavorite 
                              ? 'border-teal-500/60 bg-teal-500/5 shadow-[0_0_12px_rgba(20,184,166,0.1)]' 
                              : 'border-[#44387a]/40 hover:border-[#cf4fe6]/50'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[9px] text-[#b4aae2]/60 font-mono uppercase tracking-wider">
                            <span className="font-bold text-[#b4aae2]">{SPORTS_LEAGUES[activeSportsLeague].label}</span>
                            <span className={state === 'in' ? 'text-red-400 animate-pulse font-black' : state === 'post' ? 'text-gray-400' : 'text-[#3fd9c7]'}>
                              {detail || 'Scheduled'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            {competitors.map((competitor: any) => {
                              const logoUrl = competitor.team?.logo || competitor.team?.logos?.[0]?.href;

                              return (
                                <div key={competitor.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 max-w-[70%]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        haptic(10);
                                        addToParlaySlip(event, competition, competitor);
                                      }}
                                      className={`w-4 h-4 rounded border flex items-center justify-center text-[8px] font-bold transition-all shrink-0 cursor-pointer ${
                                        isTeamInSlip(competitor.id)
                                          ? 'bg-[#cf4fe6] border-[#cf4fe6] text-white'
                                          : 'bg-black/20 border-[#44387a]/60 text-slate-500 hover:border-[#cf4fe6]/50'
                                      }`}
                                      title={isTeamInSlip(competitor.id) ? "Remove from parlay slip" : "Add to parlay slip"}
                                    >
                                      {isTeamInSlip(competitor.id) ? '✓' : '+'}
                                    </button>
                                    {logoUrl ? (
                                      <img className="w-4 h-4 object-contain shrink-0" src={logoUrl} alt="" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-4 h-4 bg-[#1a1138] rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-teal-400 shrink-0">
                                        {competitor.team?.abbreviation || '--'}
                                      </div>
                                    )}
                                    <span className={`text-[11px] font-semibold truncate ${competitor.winner ? 'text-teal-400 font-bold' : 'text-[#faebd7]'}`}>
                                      {competitor.team?.shortDisplayName || competitor.team?.displayName || 'Team'}
                                    </span>
                                    <span className="text-[8.5px] text-[#b4aae2]/40 font-normal shrink-0">{getRecord(competitor)}</span>
                                  </div>
                                  <span className={`text-[11.5px] font-mono font-black ${state === 'in' ? 'text-teal-400' : 'text-[#faebd7]'}`}>
                                    {competitor.score || (state === 'pre' ? '-' : '0')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </article>
                      );
                    });
                  })()}
                </div>
              </section>
            </div>

            {/* Pinned tracker sidebar */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              <section className="card p-5 rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 mb-3 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#ff7597]">📌</span>
                    <span className="text-[12px] font-bold text-[#faebd7] uppercase tracking-[0.15em]" style={{ fontFamily: "'Cormorant', serif" }}>Pinned Highlights</span>
                  </div>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/10 uppercase">Tracker</span>
                </div>

                <p className="text-[10px] text-[#b4aae2]/75 mb-3 leading-snug">
                  Add keywords for your favorite teams to pin and highlight their matches in teal instantly!
                </p>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={sportsFavoriteInput}
                    placeholder="e.g. Yankees, Lakers, Arsenal"
                    className="flex-grow bg-[#1a1138]/40 border border-[#3d2766]/50 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans"
                    onChange={(e) => setSportsFavoriteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addSportsFavorite();
                    }}
                  />
                  <button className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-150 shrink-0 cursor-pointer" onClick={addSportsFavorite}>
                    Pin
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {sportsFavorites.length === 0 ? (
                    <div className="text-center py-4 text-[10px] text-[#b4aae2]/50 italic w-full">
                      No pinned teams yet. Add some keywords above!
                    </div>
                  ) : (
                    sportsFavorites.map((team, index) => (
                      <span className="inline-flex items-center gap-1.5 border border-teal-500/30 bg-teal-500/5 text-white rounded-lg px-2 py-1 text-[10.5px] font-mono" key={team}>
                        <span>{team}</span>
                        <button className="text-red-400 hover:text-red-300 ml-1 font-bold cursor-pointer" onClick={() => removeSportsFavorite(index)}>×</button>
                      </span>
                    ))
                  )}
                </div>
              </section>

              {/* PARLAY TRACKER CARD */}
              <section className="card p-5 rounded-2xl border border-purple-500/30 bg-purple-950/5 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.12)]">
                <div className="flex justify-between items-center pb-2.5 border-b border-purple-500/20 mb-3 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-purple-400">🔮</span>
                    <span className="text-[12px] font-bold text-purple-200 uppercase tracking-[0.15em]" style={{ fontFamily: "'Cormorant', serif" }}>Parlay Tracker</span>
                  </div>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase font-bold">Free slip</span>
                </div>

                {/* CURRENT PARLAY SLIP */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Parlay Slip</span>
                    {parlaySlip.length > 0 && (
                      <span className="text-[9px] font-mono bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                        {parlaySlip.length} {parlaySlip.length === 1 ? 'Pick' : 'Picks'}
                      </span>
                    )}
                  </div>

                  {parlaySlip.length === 0 ? (
                    <div className="text-center py-5 px-3 border border-dashed border-purple-500/25 rounded-xl text-[10px] text-purple-300/50 italic bg-purple-950/10">
                      No active picks on the slip. Click the "+" button next to any team on the scoreboard to build your parlay!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {parlaySlip.map((leg) => (
                        <div key={leg.id} className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-left">
                          <div className="flex flex-col gap-0.5 max-w-[85%]">
                            <span className="text-[11px] font-bold text-white flex items-center gap-1">
                              <span className="text-[9px] font-mono text-purple-300 uppercase bg-purple-500/5 px-1 rounded border border-purple-500/10">Pick</span>
                              {leg.teamName}
                            </span>
                            <span className="text-[9px] text-purple-300/60 truncate">
                              vs {leg.opponentName} ({leg.league.toUpperCase()})
                            </span>
                          </div>
                          <button 
                            onClick={() => {
                              haptic(10);
                              setParlaySlip(prev => prev.filter(l => l.id !== leg.id));
                            }}
                            className="text-red-400 hover:text-red-300 font-bold text-xs p-1 cursor-pointer"
                            title="Remove pick"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {/* Slip Action Buttons */}
                      <div className="flex gap-2 pt-2 select-none">
                        <button 
                          onClick={() => {
                            haptic(15);
                            saveParlay();
                          }}
                          className="flex-1 py-2 bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/40 hover:border-purple-300 text-purple-300 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] focus:outline-none"
                        >
                          Save Parlay
                        </button>
                        <button 
                          onClick={() => {
                            haptic(10);
                            clearParlaySlip();
                          }}
                          className="py-2 px-3 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer focus:outline-none"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sports Meta Disclaimer and manual trigger */}
                <div className="p-2.5 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-center justify-between mb-4 gap-2 select-none">
                  <span className="text-[9px] text-purple-300/65 leading-tight">
                    Tracks saved picks from free live scores. No real money or odds are ever stored.
                  </span>
                  <button 
                    onClick={() => {
                      haptic(15);
                      refreshParlays();
                    }}
                    className="text-[9px] text-purple-300 hover:text-white uppercase font-bold font-mono tracking-wider shrink-0 transition-all cursor-pointer whitespace-nowrap bg-purple-500/15 px-2 py-1 rounded-lg border border-purple-500/30 hover:border-purple-400"
                  >
                    🔄 refresh
                  </button>
                </div>

                {/* SAVED PARLAYS LIST */}
                <div>
                  <h4 className="text-[10px] font-bold text-[#b4aae2] uppercase tracking-wider mb-2 select-none">Saved Parlays</h4>
                  {sportsParlays.length === 0 ? (
                    <div className="text-center py-4 text-[10px] text-[#b4aae2]/40 italic">
                      No saved parlays yet. Build a slip above and tap Save Parlay!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {sportsParlays.slice().reverse().map((parlay) => (
                        <div key={parlay.id} className="p-3 rounded-xl border border-[#44387a]/35 bg-[#120a2c]/50 flex flex-col gap-2">
                          {/* Card Header details */}
                          <div className="flex justify-between items-center select-none">
                            <div className="flex flex-col text-left">
                              <span className="text-[9px] font-mono text-[#b4aae2]/60">
                                {new Date(parlay.savedAt).toLocaleDateString()} {new Date(parlay.savedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <span className="text-[10px] font-bold text-white mt-0.5">
                                {parlay.legs.length} {parlay.legs.length === 1 ? 'Leg' : 'Legs'} Parlay
                              </span>
                            </div>

                            {/* State status badge pill */}
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                parlay.status === 'won'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : parlay.status === 'lost'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : parlay.status === 'live'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                                      : 'bg-indigo-500/10 text-[#ae95eb] border-[#ae95eb]/20'
                              }`}>
                                {parlay.status === 'won' ? 'WON 🏆' : parlay.status === 'lost' ? 'LOST ❌' : parlay.status === 'live' ? 'LIVE 🎮' : 'PENDING ⏳'}
                              </span>
                              
                              <button 
                                onClick={() => {
                                  haptic(10);
                                  deleteParlay(parlay.id);
                                }}
                                className="text-[#b4aae2]/40 hover:text-red-400 font-bold text-[11px] p-1 cursor-pointer transition-colors"
                                title="Delete parlay"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Legs inside parlay collapse */}
                          <div className="space-y-1.5 pl-1.5 border-l border-[#cf4fe6]/20">
                            {parlay.legs.map((leg) => {
                              // evaluate won, lost, live, pending per leg status
                              const legStatus = leg.status || 'pending';
                              return (
                                <div key={leg.id} className="flex items-center justify-between text-[10px]">
                                  <div className="flex flex-col text-left max-w-[75%]">
                                    <span className="font-bold text-[#faebd7] truncate leading-tight">
                                      {leg.teamName}
                                    </span>
                                    <span className="text-[8.5px] text-[#b4aae2]/50 truncate mt-0.5">
                                      vs {leg.opponentName} ({leg.league.toUpperCase()})
                                    </span>
                                  </div>
                                  <span className={`text-[8px] font-bold shrink-0 ${
                                    legStatus === 'won'
                                      ? 'text-emerald-400'
                                      : legStatus === 'lost'
                                        ? 'text-red-400'
                                        : legStatus === 'live'
                                          ? 'text-amber-400 animate-pulse'
                                          : 'text-[#ae95eb]'
                                  }`}>
                                    {legStatus.toUpperCase()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* STATS INFO CARD */}
              <section className="card p-4 rounded-2xl border border-[#44387a]/45 bg-[#0f0a28]/60 select-none">
                <h4 className="text-[10.5px] font-bold text-[#faebd7] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>💡</span> Why is it 100% Free?
                </h4>
                <ul className="space-y-1.5 text-[9.5px] text-[#b4aae2]/80 leading-normal">
                  <li className="flex items-start gap-1">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span><strong>Direct Fetch:</strong> No proxy server or token-based gateways. Directly queries public APIs.</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span><strong>Zero Limits:</strong> View unlimited game results and standings at zero-cost.</span>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>

        {/* CALENDAR PANEL */}
        <div className="panel" id="panel-calendar">
          <div className="sub-navigation flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between border-b border-[#2e2454]/45 pb-3 mb-4 select-none">
            {/* ORGANIZER GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#ff7597] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Organizer</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="notes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('notes'); }}>📝 Notes</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calendar" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calendar'); }}>📅 Calendar</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="tasks" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('tasks'); }}>✅ Tasks</button>
              </div>
            </div>
            {/* TOOLS GROUP */}
            <div className="flex items-center bg-[#150f2e]/60 rounded-xl border border-[#44387a]/45 p-0.5 w-full md:w-auto">
              <span className="text-[9px] font-extrabold text-[#3fd9c7] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Tools</span>
              <div className="flex items-center gap-0.5 flex-1 md:flex-initial">
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="calc" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calc'); }}>🧮 Calc</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="clock" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('clock'); }}>⏳ Timer</button>
                <button className="sub-nav-btn flex-grow md:flex-initial py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-150 cursor-pointer" data-sub-panel="sports" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sports'); }}>🏆 Sports</button>
              </div>
            </div>
          </div>
          <section className="card">
            <div className="cal-header">
              <button id="calPrevBtn" className="btn-icon">
                <svg className="icon" viewBox="0 0 22 22" style={{ width: '16px', height: '16px' }}>
                  <path d="M13.5 4 7 11l6.5 7" />
                </svg>
              </button>
              <p className="section-label" id="calMonthLabel" style={{ margin: 0, border: 'none' }}></p>
              <button id="calNextBtn" className="btn-icon">
                <svg className="icon" viewBox="0 0 22 22" style={{ width: '16px', height: '16px' }}>
                  <path d="M8.5 4 15 11l-6.5 7" />
                </svg>
              </button>
            </div>
            <div className="cal-grid" id="calGrid"></div>
          </section>
          <section className="card" id="calEventsCard">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 mb-3 select-none">
              <p className="section-label m-0" id="calSelectedLabel" style={{ border: 'none', padding: 0 }}>
                Events
              </p>
              <button 
                className="px-2.5 py-1 rounded-lg border border-[#3fd9c7]/40 bg-[#3fd9c7]/10 hover:bg-[#3fd9c7]/20 text-[#3fd9c7] hover:text-white font-bold text-[9.5px] uppercase tracking-wider flex items-center gap-1.5 transition duration-200 cursor-pointer"
                onClick={() => { haptic(10); if ((window as any).openRiftVision) (window as any).openRiftVision('calendar'); }}
              >
                <Camera size={11} /> Scan Agenda
              </button>
            </div>
            <div id="calEventList"></div>
            <div className="task-input-row">
              <input type="text" id="calEventInput" placeholder="add an event for this day..." />
              <button id="calEventAddBtn" className="btn-icon">
                +
              </button>
            </div>
          </section>
        </div>

        {/* GAME PANEL */}
        <div className="panel" id="panel-game">
          <div className="sub-navigation">
            <button className="sub-nav-btn" data-sub-panel="roll" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('roll'); }}>🎮 Co-op Games</button>
            <button className="sub-nav-btn" data-sub-panel="sheet" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sheet'); }}>📜 Sheet</button>
            <button className="sub-nav-btn" data-sub-panel="recipes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('recipes'); }}>🍳 Cook</button>
            <button className="sub-nav-btn" data-sub-panel="game" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('game'); }}>🎯 Mini-Games</button>
          </div>
          <section className="card animate-fade-in">
            <div className="calc-tabs flex border-b border-[#2e2454]/60 pb-2 mb-4">
              <div className="calc-tab active cursor-pointer text-xs uppercase font-extrabold tracking-wider mr-4" data-game-tab="hilow" id="tab-game-hilow">
                Hi-Lo
              </div>
              <div className="calc-tab cursor-pointer text-xs uppercase font-extrabold tracking-wider mr-4" data-game-tab="score" id="tab-game-score">
                Scorepad
              </div>
              <div className="calc-tab cursor-pointer text-xs uppercase font-extrabold tracking-wider" data-game-tab="spin" id="tab-game-spin">
                Astrolabe
              </div>
            </div>

            {/* SUB-GAME 1: HIGHER OR LOWER */}
            <div className="game-sub-view flex flex-col" id="game-view-hilow">
              <p className="section-label">Higher or Lower Dice Game</p>
              <div className="game-stage py-3">
                <div className="game-current mono text-4xl font-extrabold text-amber-400 text-center" id="gameCurrent">
                  --
                </div>
                <div className="game-sub text-[#b4aae2]/70 text-[10.5px] mt-1 text-center" id="gameSub">
                  guess if the next roll is higher or lower
                </div>
              </div>
              <div className="game-buttons flex gap-3 mt-2">
                <button className="game-btn lower flex-grow py-2 bg-red-600/20 hover:bg-red-600/35 border border-red-500/30 rounded-xl text-xs font-bold uppercase cursor-pointer" id="gameLowerBtn">
                  ▼ Lower
                </button>
                <button className="game-btn higher flex-grow py-2 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase cursor-pointer" id="gameHigherBtn">
                  ▲ Higher
                </button>
              </div>
              <div className="game-stats flex justify-around mt-4 pt-3 border-t border-[#2e2454]/40">
                <div className="tip-result-box text-center">
                  <div className="val mono text-lg font-black text-slate-100" id="gameStreak">
                    0
                  </div>
                  <div className="lbl text-[9px] uppercase tracking-wider text-slate-400">streak</div>
                </div>
                <div className="tip-result-box text-center">
                  <div className="val mono text-lg font-black text-slate-100" id="gameBest">
                    0
                  </div>
                  <div className="lbl text-[9px] uppercase tracking-wider text-slate-400">best</div>
                </div>
              </div>
            </div>

            {/* SUB-GAME 2: MULTI-PLAYER BOARD GAME SCORE KEEPER */}
            <div className="game-sub-view flex-col hidden" id="game-view-score">
              <div className="flex justify-between items-center pb-2 border-b border-purple-500/20 mb-3 select-none">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Board Game Scorekeeper</span>
                <button id="scoreClearBtn" className="text-[10px] text-[#ae95eb]/70 hover:text-white uppercase font-bold bg-transparent border-none cursor-pointer">Reset All</button>
              </div>
              <p className="text-[10px] text-[#b4aae2]/70 mb-3">
                Keep points for up to 4 players during board game nights. Adjust scores instantly!
              </p>
              <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1" id="scorekeeperRows">
                {/* Dynamically created players */}
              </div>
              <div className="flex gap-2 mt-4">
                <input type="text" id="scoreNewPlayerName" placeholder="Player name..." className="flex-grow bg-[#1a1138]/40 border border-[#3d2766]/50 rounded-lg px-2 text-xs text-white focus:outline-none" />
                <button id="scoreAddPlayerBtn" className="px-4 py-1.5 bg-purple-600/80 hover:bg-purple-600 font-bold text-xs text-white rounded-lg uppercase tracking-wide cursor-pointer">+</button>
              </div>
            </div>

            {/* SUB-GAME 3: ASTROLABE GROUP SPINNER */}
            <div className="game-sub-view flex-col hidden" id="game-view-spin">
              <p className="section-label">Astrolabe Decisive Spinner</p>
              <p className="text-[10.5px] text-[#b4aae2]/70 mb-3 leading-snug">
                Enter choices (eg: restaurants, names, next movie) and revolve the celestial tracker to choose one!
              </p>
              <div className="flex flex-col gap-3">
                <textarea 
                  id="spinOptionsInput" 
                  rows={2} 
                  defaultValue="Pizza, Burgers, Sushi, Tacos, Salad" 
                  className="w-full bg-[#1a1138]/60 border border-[#44387a]/40 rounded-xl p-2.5 text-xs text-[#b4aae2] placeholder-slate-600 focus:outline-none focus:border-[#cf4fe6] font-sans"
                />
                
                {/* Rotating Astrolabe Core */}
                <div className="flex flex-col items-center justify-center py-2 select-none">
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg id="astrolabeSpinRing" className="absolute w-full h-full text-purple-500/40" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#cf4fe6" strokeWidth="1" />
                      <circle cx="50" cy="50" r="34" fill="none" stroke="#3fd9c7" strokeWidth="0.8" strokeDasharray="2 4" />
                      <polygon points="50,8 46,15 54,15" fill="#13efb0" />
                    </svg>
                    
                    <div className="text-center z-10 max-w-[65px] select-none pointer-events-none">
                      <p id="astrolabeSelectedWord" className="text-xs font-black text-amber-300 uppercase tracking-tight break-words leading-none">READY</p>
                    </div>
                  </div>
                </div>

                <button id="astrolabeSpinBtn" className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 active:scale-95 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer">
                  💫 REVOLVE ASTROLABE
                </button>
              </div>
            </div>

          </section>
        </div>

        {/* RECIPES & COOKING PORTAL PANEL */}
        <div className="panel" id="panel-recipes">
          <div className="sub-navigation">
            <button className="sub-nav-btn" data-sub-panel="roll" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('roll'); }}>🎮 Co-op Games</button>
            <button className="sub-nav-btn" data-sub-panel="sheet" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sheet'); }}>📜 Sheet</button>
            <button className="sub-nav-btn" data-sub-panel="recipes" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('recipes'); }}>🍳 Cook</button>
            <button className="sub-nav-btn" data-sub-panel="game" onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('game'); }}>🎯 Mini-Games</button>
          </div>
          
          {/* Header section with theme colors */}
          <section className="card p-4 relative overflow-hidden mb-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-center pb-2 border-b border-[#2e2454]/60 mb-3 select-none">
              <div className="flex items-center gap-2">
                <span className="text-[#ff7597] text-sm animate-pulse">🧪</span>
                <span className="text-[12.5px] font-bold text-[#faebd7] uppercase tracking-[0.2em]" style={{ fontFamily: "'Cormorant', serif" }}>Alchemist Cook's Crucible</span>
              </div>
              <span className="text-[9px] text-[#ff7597] font-bold border border-[#ff7597]/30 px-2.5 py-0.5 rounded-full bg-[#ff7597]/10 uppercase tracking-widest font-mono">No Token Cost</span>
            </div>
            
            <p className="text-[11px] text-[#b4aae2]/85 leading-relaxed">
              Decompile links from YouTube, TikTok, Instagram, or Facebook into accurate cooking instructions. Fuse dynamic recipes or synthesize custom potions using ingredients on your storage shelves.
            </p>

            {/* Custom Tab Segmented Selector */}
            <div className="segmented mt-4 w-full" id="recipeTabSwitcher">
              <button data-tab="codex" className="active text-xs">Saved Codex (3)</button>
              <button data-tab="fusion" className="text-xs">Fusion Bench</button>
              <button data-tab="pantry" className="text-xs">Pantry Alchemist</button>
            </div>
          </section>

          {/* TAB 1: SAVED CODEX */}
          <div className="recipe-tab-content active-tab" id="recipeTab-codex">
            
            {/* Decryptor link input & Manual Recipe Form */}
            <section className="card p-4">
              <div className="flex gap-4 border-b border-[#2e2454]/60 pb-2 mb-3.5 select-none text-[10px] font-bold tracking-[0.15em] uppercase">
                <button 
                  id="modeTranscribeBtn" 
                  className="text-[#ff7597] border-b-2 border-[#ff7597] pb-1 cursor-pointer focus:outline-none hover:text-white transition-colors duration-200"
                >
                  Transcribe Social Link
                </button>
                <button 
                  id="modeCreateManualBtn" 
                  className="text-[#b4aae2] pb-1 cursor-pointer focus:outline-none hover:text-white transition-colors duration-200"
                >
                  ➕ Write or Paste Recipe
                </button>
              </div>

              {/* MODE 1: TRANSCRIPTION SOURCE */}
              <div id="transcriptionForm" className="flex flex-col gap-2.5">
                <span className="text-[8px] font-bold text-[#b4aae2] tracking-[0.18em] uppercase block mb-1 select-none">Enter Facebook, Instagram, YouTube or TikTok Link</span>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input 
                    type="url" 
                    id="extractRecipeInput"
                    placeholder="https://www.tiktok.com/@creator/video/..." 
                    className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/40 rounded-xl px-3 py-2.5 flex-grow text-xs focus:outline-none focus:border-[#ff7597]/80 font-sans"
                    style={{ minWidth: '0' }}
                  />
                  <button 
                    id="extractRecipeBtn"
                    className="px-4 py-2.5 bg-gradient-to-r from-[#ff7597] to-[#e11d48] hover:from-[#ff9fbe] hover:to-[#f43f5e] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] shrink-0 active:scale-95 focus:outline-none cursor-pointer"
                  >
                    DECODE LINK ⚗️
                  </button>
                </div>

                {/* Extraction progress tracker logs - initially hidden */}
                <div id="extractionLogsContainer" className="hidden mt-3.5 p-3 rounded-xl border border-[#ff7597]/25 bg-[#120716]/65 font-mono text-[10px] leading-relaxed text-[#ffd6ea]">
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#ff7597]/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff7597] animate-ping"></div>
                    <span className="font-bold tracking-wider uppercase text-[9px] text-white">DECODING STREAM CAPTIONS...</span>
                  </div>
                  <div id="extractionLogsList" className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                    {/* Instantiated via JS */}
                  </div>
                </div>
              </div>

              {/* MODE 2: MANUAL WRITE OR PASTE */}
              <div id="manualRecipeForm" className="hidden flex flex-col gap-3">
                <span className="text-[8px] font-bold text-[#b4aae2] tracking-[0.18em] uppercase block select-none">Handcraft Your Custom Recipe Potion</span>
                
                {/* AI / Gemini / Blog Textbox Smart Fast Paste */}
                <div className="bg-[#1b1236]/80 p-3 rounded-xl border border-[#44387a]/60 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[8px] font-bold text-[#ff7597] tracking-[0.18em] uppercase block select-none">✨ Magic Clipboard Paste (AI / Gemini / Blogs)</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">No API/Tokens</span>
                  </div>
                  <p className="text-[9.5px] text-[#b4aae2]/60 leading-snug">
                    Paste any recipe copied from Gemini, ChatGPT, or websites here, and click "Auto-Parse". We'll sort out the name, cooking times, ingredients, and steps instantly!
                  </p>
                  <textarea 
                    id="magicPasteInput" 
                    placeholder="Paste your raw text or Gemini output here... e.g.&#10;**Sweet & Sour Pork**&#10;Prep Time: 15 mins | Cook: 15 mins&#10;Ingredients:&#10;- 1 lb pork shoulder&#10;- 1 bell pepper&#10;Directions:&#10;1. Cut the pork..." 
                    className="w-full bg-[#120a24]/90 border border-[#44387a]/40 text-white placeholder-[#b4aae2]/25 text-xs rounded-xl p-2.5 h-20 focus:outline-none focus:border-[#ff7597]/75 font-sans leading-relaxed resize-y"
                  ></textarea>
                  <button 
                    id="magicPasteParseBtn"
                    type="button"
                    className="w-full py-1.5 bg-[#44387a]/60 hover:bg-[#ff7597]/25 text-[#faebd7] hover:text-[#ff7597] border border-[#44387a]/80 hover:border-[#ff7597]/40 rounded-lg text-[10.5px] font-mono uppercase tracking-wider transition-all duration-300 active:scale-95 cursor-pointer focus:outline-none flex items-center justify-center gap-1.5"
                  >
                    Auto-Parse & Sort Recipe ⚡
                  </button>
                </div>
                
                <div>
                  <label htmlFor="manualRecipeTitle" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Recipe Name (Custom Name)</label>
                  <input 
                    type="text" 
                    id="manualRecipeTitle" 
                    placeholder="e.g. Grandma's Secret Beef Stew" 
                    className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/40 rounded-xl px-3 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="manualRecipePlatform" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Source / Tag</label>
                    <select 
                      id="manualRecipePlatform" 
                      className="bg-[#120a24]/95 border border-[#44387a]/60 text-white rounded-xl px-2.5 py-2.5 w-full text-xs focus:outline-none focus:border-[#ff7597]/80 select-none cursor-pointer"
                    >
                      <option value="custom">Handcrafted</option>
                      <option value="pantry">Pantry Alchemist</option>
                      <option value="tiktok">TikTok Style</option>
                      <option value="youtube">YouTube Channel</option>
                      <option value="instagram">Instagram</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="manualRecipeDifficulty" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Difficulty</label>
                    <select 
                      id="manualRecipeDifficulty" 
                      className="bg-[#120a24]/95 border border-[#44387a]/60 text-white rounded-xl px-2.5 py-2.5 w-full text-xs focus:outline-none select-none cursor-pointer"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="manualRecipePrep" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Prep Time</label>
                    <input 
                      type="text" 
                      id="manualRecipePrep" 
                      placeholder="10 mins" 
                      className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/30 rounded-xl px-2.5 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                    />
                  </div>
                  <div>
                    <label htmlFor="manualRecipeCook" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Cook Time</label>
                    <input 
                      type="text" 
                      id="manualRecipeCook" 
                      placeholder="15 mins" 
                      className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/30 rounded-xl px-2.5 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                    />
                  </div>
                  <div>
                    <label htmlFor="manualRecipeServings" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Servings</label>
                    <input 
                      type="text" 
                      id="manualRecipeServings" 
                      placeholder="4 servings" 
                      className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/30 rounded-xl px-2.5 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="manualRecipeIngredients" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Ingredients (Paste / Type, one per line)</label>
                  <textarea 
                    id="manualRecipeIngredients" 
                    placeholder="e.g.&#10;3 cups Chicken Broth&#10;2 cloves Garlic, minced&#10;1 pinch Black Pepper" 
                    className="w-full bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/35 text-xs rounded-xl p-3 h-24 focus:outline-none focus:border-[#ff7597]/80 font-sans leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="manualRecipeDirections" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Cooking steps (Paste / Type, one per line)</label>
                  <textarea 
                    id="manualRecipeDirections" 
                    placeholder="e.g.&#10;Bring broth to dynamic boil&#10;Gently whisk garlic and spice in kettle&#10;Serve piping hot with fresh toast" 
                    className="w-full bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/35 text-xs rounded-xl p-3 h-24 focus:outline-none focus:border-[#ff7597]/80 font-sans leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="manualRecipeSecretTip" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Secret Chef Tip (Optional)</label>
                  <input 
                    type="text" 
                    id="manualRecipeSecretTip" 
                    placeholder="e.g. Garnish with high-contrast sliced lemon zest" 
                    className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/40 rounded-xl px-3 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                  />
                </div>

                <button 
                  id="saveManualRecipeBtn"
                  className="w-full py-2.5 mt-1 bg-gradient-to-r from-emerald-500 to-[#10b981] hover:from-emerald-400 hover:to-[#059669] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] shrink-0 active:scale-95 focus:outline-none cursor-pointer"
                >
                  SAVE RECIPE TO CODEX ⚙️
                </button>
              </div>
            </section>

            {/* Global Search and Filter */}
            <div className="flex items-center gap-2.5 mb-3 select-none">
              <input 
                type="text" 
                id="searchRecipesInput"
                placeholder="Search codex by titles or ingredients..." 
                className="bg-[#120a24]/60 border border-[#2e2454]/60 text-white placeholder-[#b4aae2]/30 rounded-xl px-3.5 py-2 w-full text-[11.5px] focus:outline-none focus:border-[#ff7597]/50"
              />
            </div>

            {/* Tag Filters */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4 select-none">
              <button
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                  recipeFilter === 'all'
                    ? 'bg-gradient-to-r from-[#ff7597] to-[#cf4fe6] text-white shadow-[0_0_8px_rgba(255,117,151,0.35)]'
                    : 'bg-[#150f2e]/60 text-[#b4aae2]/70 border border-[#44387a]/40 hover:bg-[#1f1642]/60 hover:text-white'
                }`}
                onClick={() => handleRecipeFilterChange('all')}
              >
                🌌 All
              </button>
              <button
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                  recipeFilter === 'potion'
                    ? 'bg-gradient-to-r from-[#ff7597] to-[#cf4fe6] text-white shadow-[0_0_8px_rgba(255,117,151,0.35)]'
                    : 'bg-[#150f2e]/60 text-[#b4aae2]/70 border border-[#44387a]/40 hover:bg-[#1f1642]/60 hover:text-white'
                }`}
                onClick={() => handleRecipeFilterChange('potion')}
              >
                🧪 Potions
              </button>
              <button
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                  recipeFilter === 'food'
                    ? 'bg-gradient-to-r from-[#ff7597] to-[#cf4fe6] text-white shadow-[0_0_8px_rgba(255,117,151,0.35)]'
                    : 'bg-[#150f2e]/60 text-[#b4aae2]/70 border border-[#44387a]/40 hover:bg-[#1f1642]/60 hover:text-white'
                }`}
                onClick={() => handleRecipeFilterChange('food')}
              >
                🍞 Food
              </button>
              <button
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                  recipeFilter === 'social'
                    ? 'bg-gradient-to-r from-[#ff7597] to-[#cf4fe6] text-white shadow-[0_0_8px_rgba(255,117,151,0.35)]'
                    : 'bg-[#150f2e]/60 text-[#b4aae2]/70 border border-[#44387a]/40 hover:bg-[#1f1642]/60 hover:text-white'
                }`}
                onClick={() => handleRecipeFilterChange('social')}
              >
                🎬 Videos
              </button>
            </div>

            {/* Recipe Grid list */}
            <div className="grid grid-cols-1 gap-4" id="recipeGrid">
              {/* Loaded dynamically by JS */}
            </div>
            
          </div>

          {/* TAB 2: FUSION BENCH */}
          <div className="recipe-tab-content hidden" id="recipeTab-fusion">
            <section className="card p-4 text-center">
              <div className="text-3xl mb-1.5">⚗️</div>
              <p className="text-[13px] font-bold text-[#faebd7] tracking-wider uppercase mb-1" style={{ fontFamily: "'Cormorant', serif" }}>Alchemical Fusion Chambers</p>
              <p className="text-[10px] text-[#b4aae2]/70 leading-relaxed mb-4 max-w-sm mx-auto">
                Select some recipes in the <b>Saved Codex</b> using their fusion checkboxes, then fire up the crucible furnace below to blend them into an exotic hybrid potion recipe!
              </p>

              {/* Bench status displays */}
              <div className="p-3.5 rounded-2xl border border-[#44387a]/40 bg-[#16102b]/40 mb-4 max-w-md mx-auto text-left">
                <span className="text-[9px] font-mono text-[#ff7597] font-bold block uppercase tracking-wider mb-2">TARGETS MARKED FOR MERGE</span>
                <div id="fusionSelectionList" className="space-y-1.5 text-xs text-[#faebd7]">
                  <div className="italic text-[#b4aae2]/50 text-[10.5px]">No recipes selected. Return to Saved Codex tab to check fusion boxes!</div>
                </div>
              </div>

              {/* Giant merge mechanism visual */}
              <div className="relative w-full py-6 flex flex-col items-center justify-center select-none">
                
                {/* Ambient glowing circles */}
                <div id="fusionGlowBackdrop" className="absolute w-36 h-36 bg-[#ff7597]/15 rounded-full blur-2xl opacity-40 transition-all duration-300"></div>
                
                {/* Interactive alchemical kettle cauldron SVG */}
                <svg className="w-24 h-24 text-[#b4aae2] relative z-10 transition-transform duration-300" id="fusionCauldron" viewBox="0 0 100 100">
                  <path d="M25 40 Q50 30 75 40 L80 65 Q80 85 50 85 Q20 85 20 65 Z" fill="#1b1231" stroke="#ff7597" strokeWidth="2.5" />
                  <path d="M22 47 Q50 38 78 47" fill="none" stroke="#ff7597" strokeWidth="1" opacity="0.4" />
                  <ellipse cx="50" cy="40" rx="25" ry="6" fill="#421b38" stroke="#ff7597" strokeWidth="1.5" />
                  
                  {/* Cauldron bubbles */}
                  <circle cx="42" cy="38" r="1.5" fill="#ffd6ea" className="animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <circle cx="50" cy="37" r="2.5" fill="#ffd6ea" className="animate-bounce" style={{ animationDelay: '0.5s' }} />
                  <circle cx="58" cy="39" r="1.8" fill="#ffd6ea" className="animate-bounce" style={{ animationDelay: '0.3s' }} />
                  
                  {/* Fire rack */}
                  <path d="M15 85 L85 85 M30 85 L35 93 M70 85 L65 93" stroke="#44387a" strokeWidth="3" />
                  {/* Flames */}
                  <path id="fusionFlames" d="M40 92 Q50 78 50 82 Q50 78 60 92" fill="#ff7597" opacity="0.8" />
                </svg>

                {/* Live fusing status text */}
                <div id="fusionStatusLabel" className="text-[10px] uppercase font-mono font-bold mt-3 text-[#b4aae2]">STANDING BY FOR HEARTH IGNITION</div>
              </div>

              <button 
                id="fuseRecipesBtn"
                disabled
                className="w-full max-w-xs py-3 md:py-3.5 bg-gradient-to-r from-amber-500 via-[#ff7597] to-purple-600 hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(255,117,151,0.2)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
              >
                AUTOCLAVE RECIPES ⚗️
              </button>
            </section>
          </div>

          {/* TAB 3: PANTRY ALCHEMIST */}
          <div className="recipe-tab-content hidden" id="recipeTab-pantry">
            
            {/* Custom Pantry list addition form */}
            <section className="card p-4 mb-4">
              <span className="text-[9px] font-bold text-amber-400 tracking-[0.18em] uppercase block mb-2 select-none">ADD STAPLES TO STORAGE</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="addPantryInput"
                  placeholder="e.g. Sriracha Sauce, White Onion, Garlic..."
                  className="bg-[#120a24]/90 border border-[#2e2454]/60 text-white placeholder-[#b4aae2]/40 rounded-xl px-3 py-2 flex-grow text-xs focus:outline-none focus:border-amber-400 font-sans"
                />
                <button 
                  id="addPantryBtn"
                  className="px-4 bg-[#2e1d16] hover:bg-[#3d271f] text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs uppercase transition-all duration-200 cursor-pointer focus:outline-none shrink-0"
                >
                  + ADD ITEM
                </button>
              </div>
            </section>

            {/* Staples shelf checklist */}
            <section className="card p-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#2e2454]/60 mb-3 select-none">
                <span className="text-[9px] font-bold text-amber-400 tracking-[0.18em] uppercase block">INGREDIENTS IN MY KITCHEN</span>
                <button id="clearPantryBtn" className="text-[8px] text-[#ff2e5b] uppercase font-mono font-bold hover:underline bg-transparent border-none p-0 cursor-pointer focus:outline-none">RESET SHELVES</button>
              </div>

              <div id="pantryShelvesGrid" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                {/* Dynamically populated checklists */}
              </div>

              <button 
                id="synthesizePantryBtn"
                className="w-full py-3.5 mt-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_4px_14px_rgba(245,158,11,0.25)] cursor-pointer focus:outline-none text-center block select-none"
              >
                CREATE FROM PANTRY 🍳
              </button>
            </section>
          </div>

        </div>

        {/* DETAILS OVERLAY MODAL - VIEWING INGREDIENTS & STEPS */}
        <div id="recipeDetailModal" className="hidden fixed inset-0 z-[100] bg-[#0c081e]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#160f2e] border border-[#cf4fe6]/40 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-panel-in-left">
            
            {/* Modal sticky top header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#2d244c] bg-[#110b24]">
              <div className="flex flex-col select-none">
                <span id="modalPlatformBadge" className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#ff2e5b]/10 text-[#ff2e5b] inline-block w-fit uppercase mb-1">YOUTUBE</span>
                <span id="modalTitle" className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: "'Cormorant', serif" }}>Recipe Title</span>
              </div>
              <button 
                id="closeRecipeModalBtn"
                className="w-8 h-8 rounded-full border border-[#44387a] bg-[#120a24]/80 text-[#b4aae2] hover:text-white flex items-center justify-center font-bold text-xs transition-colors duration-200 cursor-pointer focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Scrollable details wrapper */}
            <div className="flex-grow overflow-y-auto p-5 space-y-5">
              
              {/* Stat specs */}
              <div className="grid grid-cols-4 gap-2 text-center select-none">
                <div className="bg-[#1f163f]/50 border border-[#2d244c] p-2 rounded-xl">
                  <div className="text-[8px] uppercase tracking-wider text-[#b4aae2]/60 font-semibold mb-0.5">Difficulty</div>
                  <div id="modalDifficulty" className="text-[11px] font-bold text-[#ffd6ea]">Easy</div>
                </div>
                <div className="bg-[#1f163f]/50 border border-[#2d244c] p-2 rounded-xl">
                  <div className="text-[8px] uppercase tracking-wider text-[#b4aae2]/60 font-semibold mb-0.5">Prep Time</div>
                  <div id="modalPrepTime" className="text-[11px] font-mono font-bold text-[#faebd7]">10 mins</div>
                </div>
                <div className="bg-[#1f163f]/50 border border-[#2d244c] p-2 rounded-xl">
                  <div className="text-[8px] uppercase tracking-wider text-[#b4aae2]/60 font-semibold mb-0.5">Cook Time</div>
                  <div id="modalCookTime" className="text-[11px] font-mono font-bold text-[#faebd7]">15 mins</div>
                </div>
                <div className="bg-[#1f163f]/50 border border-[#2d244c] p-2 rounded-xl">
                  <div className="text-[8px] uppercase tracking-wider text-[#b4aae2]/60 font-semibold mb-0.5">Servings</div>
                  <div id="modalServings" className="text-[11px] font-bold text-[#ffd3b6]">2 cups</div>
                </div>
              </div>

              {/* Source social video link widget */}
              <div className="bg-gradient-to-r from-[#1a0f30] to-[#0d071c] p-3 rounded-2xl border border-[#2d244c]/60 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📹</span>
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-[#b4aae2]/60 font-semibold uppercase">Source Culinary Video</span>
                    <span className="text-[11px] text-[#ffd6ea] font-medium mt-0.5 truncate max-w-[190px] sm:max-w-xs" id="modalVideoSubtitle">original stream link</span>
                  </div>
                </div>
                <a 
                  id="modalVideoLink"
                  href="#" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-[#44387a]/40 hover:bg-[#cf4fe6]/20 text-[#ffe9b8] hover:text-white border border-[#44387a] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
                >
                  PLAY VIDEO ↗
                </a>
              </div>

              {/* Interactive ingredients listing */}
              <div>
                <span className="text-[10px] font-bold text-[#ff7597] tracking-[0.16em] uppercase block mb-2.5 select-none font-sans">INGREDIENTS CHECKLIST (TAP TO COUNT)</span>
                <div id="modalIngredientsList" className="space-y-1.5 bg-[#120a24]/40 p-3 rounded-2xl border border-[#2d244c]/60">
                  {/* Loaded via JS */}
                </div>
              </div>

              {/* Cooking directions steps */}
              <div>
                <span className="text-[10px] font-bold text-[#ff7597] tracking-[0.16em] uppercase block mb-2.5 select-none font-sans">PREPARATION INSTRUCTION WORKFLOW</span>
                <div id="modalDirectionsList" className="space-y-3">
                  {/* Loaded via JS */}
                </div>
              </div>

              {/* Kitchen Assistant Timer System */}
              <div className="bg-[#120a24]/90 border border-amber-500/30 p-4 rounded-3xl relative overflow-hidden">
                <p className="text-[9px] font-bold text-amber-400 tracking-[0.2em] uppercase mb-2 select-none">BUILT-IN ALCHEMICAL COOKING TIMER</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2 border border-amber-500/20 rounded-full text-amber-400 text-lg animate-pulse">⏰</div>
                    <div className="text-2xl font-mono text-amber-300 font-extrabold tracking-widest select-all" id="cookingTimerDisplay">00:00</div>
                  </div>
                  
                  {/* Pre-fill minutes options */}
                  <div className="flex gap-1 select-none">
                    <button data-mins="3" className="px-2 py-1 bg-[#2e1d16] border border-amber-500/30 text-[10px] rounded-lg text-amber-300 cursor-pointer focus:outline-none">3m</button>
                    <button data-mins="5" className="px-2 py-1 bg-[#2e1d16] border border-amber-500/30 text-[10px] rounded-lg text-amber-300 cursor-pointer focus:outline-none">5m</button>
                    <button data-mins="10" className="px-2 py-1 bg-[#2e1d16] border border-amber-500/30 text-[10px] rounded-lg text-amber-300 cursor-pointer focus:outline-none">10m</button>
                  </div>

                  <button 
                    id="cookingTimerBtn"
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-white rounded-xl font-bold text-[10px] uppercase cursor-pointer focus:outline-none shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  >
                    START TIMER
                  </button>
                </div>
              </div>

              {/* Editable chef lab notebook section */}
              <div>
                <div className="flex justify-between items-center mb-1.5 select-none">
                  <span className="text-[10px] font-bold text-[#ff7597] tracking-[0.16em] uppercase block font-sans">MY PERSONAL KITCHEN LAB NOTES</span>
                  <span className="text-[9px] text-[#b4aae2]/50 font-bold uppercase font-mono tracking-wider">AUTO-SAVED IN DEVICE</span>
                </div>
                <textarea 
                  id="modalChefNotesInput"
                  placeholder="Insert custom substitutions, ratios, spices, seasoning quantities or feedback on the recipe here..."
                  className="w-full bg-[#120a24]/80 border border-[#2e2454]/60 text-white placeholder-[#b4aae2]/30 text-xs rounded-2xl p-3.5 leading-relaxed h-20 focus:outline-none focus:border-[#cf4fe6]"
                ></textarea>
              </div>

              {/* Special chef tip box info section */}
              <div className="p-3.5 rounded-2xl border border-[#ff7597]/20 bg-[#ff7597]/5 select-all leading-relaxed">
                <span className="text-[9px] font-mono text-[#ff7597] font-extrabold uppercase tracking-widest block mb-1.5">ALCHEMIST SECRET TIPS & TRICKS</span>
                <p id="modalSecretTip" className="text-[11px] italic text-[#ffd6ea]">Adding cold butter gives the sauces an incredible reflective luster!</p>
              </div>

            </div>
          </div>
        </div>
        {/* LOCAL OFFLINE COMPANION BOT PANEL */}
        <div className="panel animate-fade-in" id="panel-companion">
          <section className="magic-card-frame p-4.5 relative overflow-hidden mb-4 flex flex-col h-[74vh] sm:h-[78vh]">
            
            {/* Corner spinning gears */}
            <div className="absolute top-2 left-2 w-8 h-8 pointer-events-none opacity-30 select-none z-10">
              <svg className="w-full h-full gear-cw text-[#cf4fe6]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
              </svg>
            </div>
            <div className="absolute bottom-2 right-2 w-10 h-10 pointer-events-none opacity-35 select-none z-10">
              <svg className="w-full h-full gear-ccw text-[#3fd9c7]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
              </svg>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Header section with status indicator */}
            <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 mb-3 select-none z-10">
              <div className="flex items-center gap-2.5">
                <svg className="w-5.5 h-5.5 rounded-full bg-[#0d071c] border border-[#cf4fe6]/40 p-0.5 shadow-[0_0_6px_rgba(207,79,230,0.5)] filter-holo-glow wizard-flame" viewBox="0 0 100 100">
                  <g opacity="0.8">
                    <path d="M 20,80 Q 5,50 15,25 Q 30,55 45,75 Z" fill="#7c3aed" />
                    <path d="M 80,80 Q 95,50 85,25 Q 70,55 55,75 Z" fill="#7c3aed" />
                  </g>
                  <path d="M 12,38 C 5,28 10,22 28,32 Z" fill="#8a614d" />
                  <path d="M 88,38 C 95,28 90,22 72,32 Z" fill="#8a614d" />
                  <path d="M 20,78 Q 50,10 80,78 Q 50,55 20,78 Z" fill="#1e113a" stroke="#5b21b6" strokeWidth="1.5" />
                  <path d="M 32,45 C 32,40 68,40 68,45 C 68,68 32,68 32,45 Z" fill="#040209" />
                  <path d="M 34,48 Q 50,54 66,48 L 60,68 Q 50,75 40,68 Z" fill="#311042" />
                  <ellipse cx="42" cy="43" rx="4.5" ry="1.5" fill="#e0f7fa" />
                  <ellipse cx="58" cy="43" rx="4.5" ry="1.5" fill="#e0f7fa" />
                  <line x1="32" y1="43" x2="52" y2="43" stroke="#06b6d4" strokeWidth="1.2" />
                  <line x1="48" y1="43" x2="68" y2="43" stroke="#06b6d4" strokeWidth="1.2" />
                </svg>
                <span className="text-[12.5px] font-bold text-[#faebd7] uppercase tracking-[0.2em]" style={{ fontFamily: "'Cormorant', serif" }}>Offline Rift Companion</span>
              </div>
              <span className="text-[8.5px] text-[#cf4fe6] font-bold border border-[#cf4fe6]/30 px-2.5 py-0.5 rounded-full bg-[#cf4fe6]/10 uppercase tracking-widest font-mono">● LOCAL ONLY</span>
            </div>
            
            {/* Chat Messages area */}
            <div 
              id="companionChatWindow" 
              className="flex-grow overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin text-xs py-2 flex flex-col"
              style={{ minHeight: '0' }}
            >
              {/* Loaded dynamically or initial greet */}
            </div>

            {/* Active Attachments Tag bar */}
            <div 
              id="companionActiveAttachmentsBar" 
              className="hidden flex flex-wrap gap-1.5 p-2 bg-[#140b24]/60 border border-[#44387a]/30 rounded-xl mt-2 max-h-[70px] overflow-y-auto"
            >
              {/* Selected notes, recipes, or tasks displayed here */}
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#2e2454]/60 relative">
              
              {/* Attachments Drawer Trigger */}
              <button 
                id="companionAttachBtn"
                title="Attach Local App Data"
                className="w-10 h-10 rounded-xl bg-[#2e1c47]/50 hover:bg-[#cf4fe6]/15 border border-[#44387a]/60 text-[#cf4fe6] hover:text-white flex items-center justify-center font-bold text-base transition-colors duration-200 cursor-pointer focus:outline-none"
              >
                📎
              </button>

              {/* Chat Text Input field */}
              <input 
                type="text" 
                id="companionChatInput" 
                placeholder="Ask OFFLINE_BOT or attach sources..." 
                className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/30 rounded-xl px-3.5 py-2.5 flex-grow text-xs focus:outline-none focus:border-[#cf4fe6]/85 font-sans"
              />

              {/* Chat Send button */}
              <button 
                id="companionSendBtn"
                className="px-4 py-2.5 bg-gradient-to-r from-[#cf4fe6] to-[#7c3aed] hover:from-[#e15ffd] hover:to-[#904bf5] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_12px_rgba(207,79,230,0.3)] shrink-0 active:scale-95 focus:outline-none cursor-pointer"
              >
                SEND ⚡
              </button>

              {/* Slide-Up Attachment Drawer Pop-up */}
              <div 
                id="companionAttachDrawer" 
                className="hidden absolute bottom-full left-0 right-0 bg-[#160f2e] border border-[#cf4fe6]/40 rounded-2xl p-3.5 shadow-2xl z-30 mb-2 max-h-[220px] overflow-y-auto flex flex-col gap-3 animate-fade-in"
              >
                <div className="flex justify-between items-center border-b border-[#2e2454]/60 pb-1.5 select-none">
                  <span className="text-[9px] font-extrabold text-[#cf4fe6] uppercase tracking-wider">BIND LOCAL ELEMENTS TO CHAT</span>
                  <button id="closeAttachDrawerBtn" className="text-[9px] text-[#b4aae2]/50 hover:text-white uppercase font-mono font-bold bg-transparent border-none cursor-pointer">Done</button>
                </div>
                
                <div className="grid grid-cols-3 gap-2.5 text-left h-[130px] overflow-y-auto pr-1">
                  {/* Notes Column */}
                  <div className="flex flex-col">
                    <span className="text-[8.5px] font-extrabold text-amber-400 border-b border-amber-500/10 pb-0.5 mb-1 uppercase tracking-wide">📝 Notes</span>
                    <div id="attachDrawerNotesList" className="space-y-1 overflow-y-auto max-h-[110px]">
                      {/* Note checkboxes populated dynamically */}
                    </div>
                  </div>

                  {/* Recipes Column */}
                  <div className="flex flex-col">
                    <span className="text-[8.5px] font-extrabold text-pink-400 border-b border-pink-500/10 pb-0.5 mb-1 uppercase tracking-wide">🍳 Recipes</span>
                    <div id="attachDrawerRecipesList" className="space-y-1 overflow-y-auto max-h-[110px]">
                      {/* Recipe checkboxes populated dynamically */}
                    </div>
                  </div>

                  {/* Reminders / Tasks Column */}
                  <div className="flex flex-col">
                    <span className="text-[8.5px] font-extrabold text-emerald-400 border-b border-emerald-500/10 pb-0.5 mb-1 uppercase tracking-wide">📌 Quests</span>
                    <div id="attachDrawerTasksList" className="space-y-1 overflow-y-auto max-h-[110px]">
                      {/* Tasks checkboxes populated dynamically */}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        </div>

        <div className="panel" id="panel-settings">
          {/* PORTAL SESSION CARD */}
          <section className="card">
            <p className="section-label text-[#cf4fe6]">🔮 Portal Traveler Rift</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#faebd7]">Active Traveler ID</span>
                  <p className="text-[10px] text-[#b4aae2] font-mono tracking-wider uppercase mt-0.5">
                    {currentUser === 'trxy6' ? '👑 Creator (trxy6)' : `👤 Traveler (${currentUser})`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptic(15);
                    localStorage.removeItem('portal_current_user');
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer"
                >
                  🔒 Lock & Logout
                </button>
              </div>
            </div>
          </section>

          {/* SHARE PORTAL & TEST SITE CARD */}
          <section className="card border border-[#3fd9c7]/30 shadow-[0_0_15px_rgba(63,217,199,0.15)] bg-gradient-to-br from-[#120826] to-[#0e061c]">
            <p className="section-label text-[#3fd9c7] flex items-center gap-2">
              ✨ Share Portal & Test Site
            </p>
            <p className="settings-note mb-3">
              Scan this QR code with another device (phone, tablet) to instantly join the same battle chamber or share this web app companion with your players!
            </p>

            {/* QR Selector */}
            <div className="segmented mb-4 w-full flex">
              <button 
                onClick={() => { haptic(10); setQrType('live'); }} 
                className={`flex-1 py-1 text-[10px] font-bold tracking-widest uppercase transition-all ${qrType === 'live' ? 'active' : ''}`}
              >
                📱 This Live Portal
              </button>
              <button 
                onClick={() => { haptic(10); setQrType('github'); }} 
                className={`flex-1 py-1 text-[10px] font-bold tracking-widest uppercase transition-all ${qrType === 'github' ? 'active' : ''}`}
              >
                🐙 GitHub Test Site
              </button>
            </div>

            {/* Selected Share Info and QR Image */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center bg-[#170e30]/80 p-3.5 border border-[#cf4fe6]/15 rounded-xl">
              
              {/* QR Image */}
              <div className="bg-white p-2.5 rounded-xl border-2 border-[#cf4fe6]/30 flex items-center justify-center shrink-0 shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    qrType === 'live' ? window.location.href : githubUrl
                  )}`} 
                  alt="Portal QR Code" 
                  className="w-[120px] h-[120px]"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Share actions */}
              <div className="flex-1 space-y-2.5 w-full text-center sm:text-left">
                {qrType === 'live' ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#3fd9c7] block">This Live Room URL</span>
                    <span className="text-[9px] text-[#b4aae2]/70 font-mono block break-all mb-1.5">{window.location.href}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast("📋 Live link copied to clipboard!", "success");
                        haptic(15);
                      }}
                      className="px-3 py-1.5 bg-[#3fd9c7]/10 hover:bg-[#3fd9c7]/20 text-[#3fd9c7] border border-[#3fd9c7]/20 hover:border-[#3fd9c7]/40 rounded-lg text-[9px] font-bold tracking-widest uppercase cursor-pointer"
                    >
                      📋 Copy Live Link
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#cf4fe6] block">My GitHub Pages Site</span>
                    <input 
                      type="url"
                      value={githubUrl}
                      onChange={(e) => {
                        const url = e.target.value;
                        setGithubUrl(url);
                        localStorage.setItem('portal_github_site_url', url);
                      }}
                      placeholder="e.g. https://yourname.github.io/dnd-portal"
                      className="w-full bg-[#1c1136] border border-[#cf4fe6]/20 rounded-lg px-2.5 py-1.5 text-xs text-[#faebd7] placeholder-[#b4aae2]/20 focus:outline-none focus:border-[#cf4fe6]"
                    />
                    <div className="flex gap-2 justify-center sm:justify-start">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(githubUrl);
                          toast("📋 GitHub link copied!", "success");
                          haptic(15);
                        }}
                        className="px-3 py-1 bg-[#cf4fe6]/10 hover:bg-[#cf4fe6]/20 text-[#cf4fe6] border border-[#cf4fe6]/20 hover:border-[#cf4fe6]/40 rounded-lg text-[8px] font-bold tracking-widest uppercase cursor-pointer"
                      >
                        📋 Copy Link
                      </button>
                      <a 
                        href={githubUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1 bg-[#3fd9c7]/10 hover:bg-[#3fd9c7]/20 text-[#3fd9c7] border border-[#3fd9c7]/20 hover:border-[#3fd9c7]/40 rounded-lg text-[8px] font-bold tracking-widest uppercase"
                      >
                        🌐 Visit Test Site
                      </a>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* CREATOR FEEDBACK VIEW (FOR trxy6 ONLY) */}
          {currentUser === 'trxy6' && (
            <section className="card border border-[#cf4fe6]/30">
              <div className="flex justify-between items-center pb-2 border-b border-[#cf4fe6]/15 mb-3">
                <p className="section-label text-[#cf4fe6] m-0">📬 FEEDBACK IDEAS FROM TRAVELERS</p>
                <button
                  onClick={() => {
                    haptic(30);
                    if (confirm("Archive all feature ideas from the rift?")) {
                      localStorage.setItem('global_feedback_ideas', JSON.stringify([]));
                      setFeedbackList([]);
                      toast("📬 Ideas archived successfully!", "success");
                    }
                  }}
                  className="text-[9px] text-rose-400 hover:text-rose-300 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <p className="settings-note mb-4">
                Greetings, Creator trxy6! Below are the feature ideas and suggestions submitted by other travelers to your portal.
              </p>
              {feedbackList.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#cf4fe6]/15 rounded-xl bg-[#140a24]/30">
                  <p className="text-xs text-[#b4aae2]/50 italic">The rift is silent. No feedback ideas have been enscribed yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {feedbackList.map((item: any) => (
                    <div key={item.id} className="p-3 bg-[#170e30]/80 border border-[#cf4fe6]/15 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-[#3fd9c7] font-bold">From: {item.sender}</span>
                        <span className="text-[#b4aae2]/50">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#faebd7] leading-relaxed whitespace-pre-wrap">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TRAVELER FEEDBACK SUBMISSION (FOR EVERYONE EXCEPT trxy6) */}
          {currentUser !== 'trxy6' && (
            <section className="card border border-[#3fd9c7]/30">
              <p className="section-label text-[#3fd9c7]">🌌 Channel Feature Idea to Creator</p>
              <p className="settings-note mb-3">
                Have a vision for a new spell, feature, or tool? Enscribe your idea here to beam it directly to the Creator (<span className="text-[#3fd9c7] font-bold">trxy6</span>)'s settings panel!
              </p>
              <div className="space-y-3">
                <textarea
                  id="travelerFeedbackText"
                  placeholder="Describe your requested feature, visual enhancement, or idea here..."
                  className="w-full h-20 bg-[#140a24] border border-[#cf4fe6]/20 rounded-xl p-3 text-xs text-[#faebd7] placeholder-[#b4aae2]/30 focus:outline-none focus:border-[#3fd9c7] resize-none font-sans"
                />
                <button
                  onClick={() => {
                    haptic(20);
                    const el = document.getElementById('travelerFeedbackText') as HTMLTextAreaElement | null;
                    if (!el || !el.value.trim()) {
                      toast("Please enscribe some text first!", "warn");
                      return;
                    }
                    const text = el.value.trim();
                    const newFeedback = {
                      id: 'fb_' + Date.now(),
                      sender: currentUser || 'anonymous',
                      text: text,
                      timestamp: new Date().toLocaleString()
                    };
                    try {
                      const curRaw = localStorage.getItem('global_feedback_ideas');
                      const curList = curRaw ? JSON.parse(curRaw) : [];
                      curList.unshift(newFeedback); // Newest feedback on top
                      localStorage.setItem('global_feedback_ideas', JSON.stringify(curList));
                      setFeedbackList(curList); // Update state reactively
                      el.value = '';
                      toast("✨ Idea channeled directly to trxy6! Thank you!", "success");
                    } catch (err) {
                      toast("⚠️ Rift signal disrupted. Try again.", "error");
                    }
                  }}
                  className="w-full py-2 bg-gradient-to-r from-[#3fd9c7]/80 to-[#cf4fe6]/80 hover:brightness-110 active:scale-[0.98] text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_12px_rgba(63,217,199,0.2)] cursor-pointer"
                >
                  🌌 Channel Idea to trxy6
                </button>
              </div>
            </section>
          )}

          <>
              <section className="card">
                <p className="section-label">Appearance</p>
                <div className="setting-row">
                  <div className="setting-label">
                    <span>Theme</span>
                    <span className="setting-sub">how the portal looks</span>
                  </div>
                  <div className="segmented" id="themeSegmented">
                    <button data-theme="dark" className="active">
                      Dark
                    </button>
                    <button data-theme="contrast">High contrast</button>
                    <button data-theme="light">Light</button>
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <span>Motion</span>
                    <span className="setting-sub">animations and ambient drift</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" id="motionToggle" defaultChecked />
                    <span className="switch-track"></span>
                  </label>
                </div>
              </section>

              <section className="card">
                <p className="section-label">Background Portal</p>
                <p className="settings-note mb-4">
                  Bind a custom high-fantasy ambient video or motion loop as the portal background. Drag & drop any video anywhere on the screen, or select one below!
                </p>
                
                <div className="setting-row flex-col items-stretch gap-2.5 mb-4">
                  <div className="flex justify-between items-center w-full">
                    <div className="setting-label">
                      <span>Custom Video</span>
                      <span className="setting-sub">upload a looping video (.mp4, .webm)</span>
                    </div>
                    <button id="clearBgVideoBtn" className="text-[10px] text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/25 transition-all hidden">
                      🗑️ Revert to Nebula
                    </button>
                  </div>
                  
                  <div id="bgVideoDropzone" className="border-2 border-dashed border-[#cf4fe6]/25 hover:border-[#cf4fe6]/60 bg-[#140a24]/50 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none">
                    <span className="text-xl">✨</span>
                    <span className="text-xs font-semibold text-[#b4aae2]">Drag & Drop Video or Tap to Select</span>
                    <span className="text-[9px] text-[#b4aae2]/50 font-mono">MP4, WEBM (Saved to local database)</span>
                    <input type="file" id="bgVideoInput" accept="video/*" className="hidden" />
                  </div>
                </div>

                <div id="bgVideoControls" className="space-y-3.5 hidden">
                  <div className="setting-row flex items-center justify-between gap-3">
                    <div className="setting-label">
                      <span>Opacity</span>
                      <span className="setting-sub" id="bgOpacityLabel">45%</span>
                    </div>
                    <input type="range" id="bgVideoOpacitySlider" min="5" max="100" defaultValue="45" className="w-40 accent-[#cf4fe6]" />
                  </div>

                  <div className="setting-row flex items-center justify-between gap-3">
                    <div className="setting-label">
                      <span>Blur Essence</span>
                      <span className="setting-sub" id="bgBlurLabel">0px</span>
                    </div>
                    <input type="range" id="bgVideoBlurSlider" min="0" max="25" defaultValue="0" className="w-40 accent-[#cf4fe6]" />
                  </div>

                  <div className="setting-row flex items-center justify-between gap-3">
                    <div className="setting-label">
                      <span>Brightness</span>
                      <span className="setting-sub" id="bgBrightnessLabel">70%</span>
                    </div>
                    <input type="range" id="bgVideoBrightnessSlider" min="10" max="150" defaultValue="70" className="w-40 accent-[#cf4fe6]" />
                  </div>

                  <div className="setting-row flex items-center justify-between gap-3">
                    <div className="setting-label">
                      <span>Color Alchemy</span>
                      <span className="setting-sub" id="bgHueLabel">Hue: 0°</span>
                    </div>
                    <input type="range" id="bgVideoHueSlider" min="0" max="360" defaultValue="0" className="w-40 accent-[#cf4fe6]" />
                  </div>
                </div>
              </section>

              <section className="card">
                <p className="section-label">Feedback</p>
                <div className="setting-row">
                  <div className="setting-label">
                    <span>Haptics</span>
                    <span className="setting-sub">vibration on rolls and taps (Android)</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" id="hapticsToggle" defaultChecked />
                    <span className="switch-track"></span>
                  </label>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <span>Sound</span>
                    <span className="setting-sub">a soft tone on roll landing</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" id="soundToggle" />
                    <span className="switch-track"></span>
                  </label>
                </div>
              </section>

              <section className="card">
                <p className="section-label">Ambient Soundscapes</p>
                <p className="settings-note mb-4">
                  Synthesize warm, immersive, background atmosphere loops in real-time completely on your local machine.
                </p>
                <div className="setting-row flex items-center justify-between gap-3 mb-3">
                  <div className="setting-label">
                    <span className="text-xs font-bold text-slate-200">Select Mood</span>
                  </div>
                  <select id="soundscapeSelect" className="bg-[#1a1138] border border-[#44387a]/40 rounded-lg px-2.5 py-1.5 text-xs text-[#b4aae2] focus:outline-none focus:border-[#cf4fe6] w-40">
                    <option value="space">🌌 Deep Space Hum</option>
                    <option value="campfire">🔥 Cozy Campfire</option>
                    <option value="chimes">🎐 Astral Chimes</option>
                  </select>
                </div>
                <div className="setting-row flex items-center justify-between gap-3 mb-4">
                  <div className="setting-label">
                    <span className="text-xs font-bold text-slate-200">Volume</span>
                  </div>
                  <input type="range" id="soundscapeVol" min="0" max="0.1" step="0.01" defaultValue="0.04" className="w-40" />
                </div>
                <button id="playSoundscapeBtn" className="w-full py-2.5 bg-gradient-to-r from-teal-500/80 to-purple-600/80 hover:brightness-110 active:scale-[0.98] text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer">
                  🔇 PLAY AMBIENT
                </button>
              </section>

              <section className="card">
                <p className="section-label">Dice</p>
                <div className="setting-row">
                  <div className="setting-label">
                    <span>Default die</span>
                    <span className="setting-sub">selected when you open Roll</span>
                  </div>
                  <select id="defaultDieSelect" className="settings-select" defaultValue="20">
                    <option value="2">Coin</option>
                    <option value="4">d4</option>
                    <option value="6">d6</option>
                    <option value="8">d8</option>
                    <option value="10">d10</option>
                    <option value="12">d12</option>
                    <option value="20">d20</option>
                    <option value="100">d100</option>
                  </select>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <span>Greeting flip</span>
                    <span className="setting-sub">auto coin flip when the app opens</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" id="greetingToggle" defaultChecked />
                    <span className="switch-track"></span>
                  </label>
                </div>
              </section>

              <section className="card">
                <p className="section-label">Your data</p>
                <p className="settings-note">
                  Everything you enter — notes, sheet, tasks, roll history — stays only
                  on this device. Nothing is sent anywhere. Export to take your data to other devices!
                </p>
                <div className="backup-row flex flex-wrap gap-2.5 mt-2">
                  <button id="exportAllData" className="btn-glass flex-1 min-w-[120px]">
                    📥 Export Backup
                  </button>
                  <button id="importAllData" className="btn-glass flex-1 min-w-[120px]">
                    📤 Import Backup
                  </button>
                  <button id="clearAllData" className="btn-glass danger flex-1 min-w-[120px]">
                    🗑️ Clear Data
                  </button>
                  <input type="file" id="importFileInput" accept=".json" className="hidden" />
                </div>
              </section>

              <section className="card">
                <p className="section-label">About</p>
                <p className="settings-note">
                  The Portal — a companion for the table and beyond. Roll fair dice,
                  keep notes, track your character, calculate anything, and never lose the
                  thread.
                </p>
              </section>
          </>
        </div>
      </main>

      <div id="toastHost"></div>

      <nav>
        <button data-panel="adventure">
          <svg className="ic animate-fade-in" viewBox="0 0 44 44" style={{ filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.75))', width: '20px', height: '20px' }}>
            <polygon points="22,5 10,13 10,31 22,39 34,31 34,13" fill="#6d1e9c" stroke="#cf4fe6" strokeWidth="1.5" />
            <polygon points="22,5 10,13 22,17" fill="#4d1473" stroke="#cf4fe6" strokeWidth="0.8" opacity="0.8"/>
            <polygon points="34,13 22,5 22,17" fill="#8828bd" stroke="#cf4fe6" strokeWidth="0.8" opacity="0.8"/>
            <polygon points="10,13 10,31 22,23" fill="#3c0f59" stroke="#cf4fe6" strokeWidth="0.8" opacity="0.8"/>
            <polygon points="34,13 34,31 22,23" fill="#581682" stroke="#cf4fe6" strokeWidth="0.8" opacity="0.8"/>
            <polygon points="22,17 10,31 34,31" fill="#a23ad4" stroke="#e15ffd" strokeWidth="1.2" />
            <text x="22" y="27" fontFamily="'Cormorant', serif" fontWeight="900" fontSize="11" fill="#faebd7" textAnchor="middle" style={{ letterSpacing: '-0.5px' }}>20</text>
            <path d="M 5,20 Q 12,23 8,28" stroke="#3fd9c7" strokeWidth="1" fill="none" class="electric-glow" />
            <path d="M 39,24 Q 32,21 35,17" stroke="#3fd9c7" strokeWidth="1" fill="none" class="electric-glow" />
          </svg>
          Adventure
        </button>
        <button data-panel="utilities">
          <svg className="ic animate-fade-in" viewBox="0 0 44 44" style={{ filter: 'drop-shadow(0 0 5px rgba(232, 121, 249, 0.65))', width: '20px', height: '20px' }}>
            <rect x="6" y="14" width="32" height="24" rx="4" fill="#1b0e2f" stroke="#e879f9" strokeWidth="1.8" />
            <path d="M 16,14 L 16,8 A 3,3 0 0 1 28,8 L 28,14" fill="none" stroke="#e879f9" strokeWidth="1.8" />
            <line x1="6" y1="22" x2="38" y2="22" stroke="#e879f9" strokeWidth="1.2" strokeDasharray="2,2" opacity="0.6" />
            <circle cx="22" cy="22" r="3.5" fill="#3fd9c7" class="electric-glow" />
            <path d="M 14,29 L 20,29" stroke="#faebd7" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 24,29 L 30,29" stroke="#faebd7" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 14,33 L 30,33" stroke="#faebd7" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Utilities
        </button>
        <button className="active" data-panel="home">
          <svg className="ic animate-fade-in" viewBox="0 0 44 44" style={{ filter: 'drop-shadow(0 0 5px rgba(19, 239, 176, 0.65))', width: '20px', height: '20px' }}>
            <circle cx="22" cy="22" r="16" fill="#120624" stroke="#d4af37" strokeWidth="1.8" />
            <g opacity="0.6" class="electric-glow">
              <path d="M 12,22 A 10,10 0 0 1 32,22" stroke="#4f7fe6" strokeWidth="0.5" fill="none" strokeDasharray="2,2" />
              <circle cx="22" cy="22" r="12" stroke="#4f7fe6" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />
            </g>
            <g class="gear-cw" stroke="#b38f1d" strokeWidth="0.7" fill="none" opacity="0.4">
              <path d="M 22,22 L 22,12" />
              <path d="M 22,22 L 14,26" />
              <path d="M 22,22 L 30,26" />
              <circle cx="22" cy="22" r="4" />
            </g>
            <g stroke="#d4af37" strokeWidth="1.2" opacity="0.8">
              <line x1="22" y1="7" x2="22" y2="9" />
              <line x1="22" y1="35" x2="22" y2="37" />
              <line x1="7" y1="22" x2="9" y2="22" />
              <line x1="35" y1="22" x2="37" y2="22" />
            </g>
            <g class="gear-cw-fast" stroke="#3fd9c7" strokeWidth="1.5" strokeLinecap="round">
              <line x1="22" y1="22" x2="22" y2="13" />
            </g>
            <g class="gear-ccw" stroke="#13efb0" strokeWidth="1" strokeLinecap="round">
              <line x1="22" y1="22" x2="14" y2="22" />
            </g>
            <circle cx="22" cy="22" r="2.5" fill="#ffd700" stroke="#120624" strokeWidth="0.8" />
          </svg>
          Home
        </button>
        <button data-panel="companion">
          <svg className="ic animate-fade-in rounded-full" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 4px rgba(207,79,230,0.85))', width: '20px', height: '20px', background: '#0a0518', border: '1px solid rgba(207,79,230,0.3)' }}>
            <g opacity="0.8">
              <path d="M 20,80 Q 5,50 15,25 Q 30,55 45,75 Z" fill="#7c3aed" />
              <path d="M 80,80 Q 95,50 85,25 Q 70,55 55,75 Z" fill="#7c3aed" />
            </g>
            <path d="M 12,38 C 5,28 10,22 28,32 Z" fill="#8a614d" />
            <path d="M 88,38 C 95,28 90,22 72,32 Z" fill="#8a614d" />
            <path d="M 20,78 Q 50,10 80,78 Q 50,55 20,78 Z" fill="#1e113a" stroke="#5b21b6" strokeWidth="1.5" />
            <path d="M 32,45 C 32,40 68,40 68,45 C 68,68 32,68 32,45 Z" fill="#040209" />
            <path d="M 34,48 Q 50,54 66,48 L 60,68 Q 50,75 40,68 Z" fill="#311042" />
            <ellipse cx="42" cy="43" rx="4.5" ry="1.5" fill="#e0f7fa" />
            <ellipse cx="58" cy="43" rx="4.5" ry="1.5" fill="#e0f7fa" />
            <line x1="32" y1="43" x2="52" y2="43" stroke="#06b6d4" strokeWidth="1.2" />
            <line x1="48" y1="43" x2="68" y2="43" stroke="#06b6d4" strokeWidth="1.2" />
          </svg>
          Companion
        </button>
        <button data-panel="settings">
          <svg className="ic animate-fade-in" viewBox="0 0 22 22" style={{ filter: 'drop-shadow(0 0 5px rgba(207, 79, 230, 0.65))', width: '20px', height: '20px' }}>
            <circle cx="11" cy="11" r="3" fill="#1e113a" stroke="#cf4fe6" strokeWidth="1.5" />
            <path d="M11 2.5v2.2M11 17.3v2.2M19.5 11-2.2M4.7 11H2.5M17 5l-1.6 1.6M6.6 15.4 5 17M17 17l-1.6-1.6M6.6 6.6 5 5" fill="none" stroke="#cf4fe6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Settings
        </button>
      {showRiftVision && (
        <div className="fixed inset-0 bg-[#070411]/95 backdrop-blur-lg z-[99999] flex items-center justify-center p-3 select-none overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#140a24]/90 border-2 border-[#3fd9c7]/50 rounded-2xl p-5 shadow-[0_0_35px_rgba(63,217,199,0.3)] flex flex-col gap-4 animate-fade-in my-auto">
            {/* Holographic Glowing Header */}
            <div className="flex justify-between items-center border-b border-[#2e2454]/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#3fd9c7] animate-ping" />
                <span className="text-xs font-mono text-[#3fd9c7] tracking-widest uppercase">RIFT VISION MULTI-SCANNER</span>
              </div>
              <button 
                className="w-8 h-8 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white flex items-center justify-center transition duration-200 cursor-pointer"
                onClick={() => { haptic(5); stopRiftCamera(); setShowRiftVision(false); }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode selection segmented bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#120826]/80 p-1 rounded-xl border border-white/5">
              {(['notes', 'betslip', 'character', 'dice', 'calendar', 'ask'] as const).map((mode) => (
                <button
                  key={mode}
                  className={`py-1.5 px-1 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center transition-all cursor-pointer ${
                    riftVisionMode === mode 
                      ? 'bg-[#3fd9c7]/20 text-[#3fd9c7] border border-[#3fd9c7]/30' 
                      : 'text-[#b4aae2]/60 hover:text-white'
                  }`}
                  onClick={() => { haptic(5); setRiftVisionMode(mode); setRiftVisionResult(null); }}
                >
                  {mode === 'notes' ? '📝 Notes' : mode === 'betslip' ? '🎫 Slip' : mode === 'character' ? '📜 Sheet' : mode === 'dice' ? '🎲 Dice' : mode === 'calendar' ? '📅 Agenda' : '💬 Ask'}
                </button>
              ))}
            </div>

            {/* Main Area: Camera Video vs Image Preview vs Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Visual Capture Target */}
              <div className="relative aspect-video md:aspect-square bg-black/40 rounded-xl border border-[#44387a]/45 overflow-hidden flex flex-col items-center justify-center">
                {riftVisionImage ? (
                  /* Captured Image Mode */
                  <div className="absolute inset-0 flex items-center justify-center bg-[#070411]">
                    <img src={riftVisionImage} className="w-full h-full object-contain" alt="Scan Target" />
                    <button 
                      className="absolute bottom-3 left-3 bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition duration-150 cursor-pointer"
                      onClick={() => { haptic(10); setRiftVisionImage(null); startRiftCamera(); }}
                    >
                      <Trash size={12} /> Clear Image
                    </button>
                  </div>
                ) : (
                  /* Camera Video Feed / File Drop Box */
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {cameraStream && (
                      <>
                        <video 
                          ref={riftVideoRef} 
                          className="w-full h-full object-cover" 
                          playsInline 
                          muted 
                        />
                        {/* Floating Crosshair HUD */}
                        <div className="absolute inset-10 border border-dashed border-[#3fd9c7]/30 pointer-events-none rounded-lg flex items-center justify-center">
                          <div className="w-4 h-4 border-t-2 border-l-2 border-[#3fd9c7] absolute top-0 left-0" />
                          <div className="w-4 h-4 border-t-2 border-r-2 border-[#3fd9c7] absolute top-0 right-0" />
                          <div className="w-4 h-4 border-b-2 border-l-2 border-[#3fd9c7] absolute bottom-0 left-0" />
                          <div className="w-4 h-4 border-b-2 border-r-2 border-[#3fd9c7] absolute bottom-0 right-0" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3fd9c7] opacity-60 animate-ping" />
                        </div>
                      </>
                    )}

                    {/* Snapshot Button Overlay */}
                    {cameraStream && (
                      <button 
                        className="absolute bottom-3 bg-[#3fd9c7] hover:bg-[#2bc3b1] text-[#070411] rounded-full p-2.5 flex items-center justify-center transition duration-200 cursor-pointer shadow-[0_0_12px_#3fd9c7]"
                        onClick={captureRiftSnapshot}
                        title="Capture Snap"
                      >
                        <Camera size={18} />
                      </button>
                    )}

                    {/* No camera prompt & upload fallback */}
                    {!cameraStream && (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 pointer-events-auto">
                        <Upload size={24} className="text-[#3fd9c7] animate-pulse" />
                        <span className="text-[10px] text-[#b4aae2] font-semibold">Drop or Upload Scan Target</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          id="riftFileInput"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = (event) => {
                                setRiftVisionImage(event.target?.result as string);
                                stopRiftCamera();
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                        <button 
                          className="px-3 py-1.5 rounded-lg border border-[#3fd9c7]/30 bg-[#3fd9c7]/10 text-[#3fd9c7] hover:bg-[#3fd9c7]/20 font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                          onClick={() => document.getElementById('riftFileInput')?.click()}
                        >
                          Select Image File
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Hidden canvas for snapshotting */}
                <canvas ref={riftCanvasRef} className="hidden" />
              </div>

              {/* Right Column: Scan Actions & AI Response display */}
              <div className="bg-black/30 rounded-xl border border-[#44387a]/45 p-4 flex flex-col justify-between gap-4 h-[250px] md:h-full overflow-y-auto">
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[11px] font-bold text-[#faebd7] uppercase tracking-wider flex items-center gap-1.5">
                      {riftVisionMode === 'notes' ? <FileText size={12} className="text-[#3fd9c7]" /> :
                       riftVisionMode === 'betslip' ? <Trophy size={12} className="text-[#cf4fe6]" /> :
                       riftVisionMode === 'character' ? <FileText size={12} className="text-[#ff7597]" /> :
                       riftVisionMode === 'dice' ? <Dices size={12} className="text-[#3fd9c7]" /> :
                       riftVisionMode === 'calendar' ? <CalendarRange size={12} className="text-[#efc562]" /> :
                       <Bot size={12} className="text-[#3fd9c7]" />}
                      Scan Mode: {riftVisionMode.toUpperCase()}
                    </h3>

                    {/* Custom Question field for 'ask' mode */}
                    {riftVisionMode === 'ask' && (
                      <div className="mt-2 space-y-1">
                        <label className="text-[8.5px] uppercase font-mono text-[#b4aae2]/60">Consult the Portal with a specific question:</label>
                        <input 
                          type="text" 
                          placeholder="What is this item / dice roll / code snippet?"
                          className="w-full text-xs bg-black/45 border border-[#44387a]/60 text-white rounded-lg p-2 focus:border-[#3fd9c7] placeholder-slate-500"
                          value={riftCustomQuestion}
                          onChange={(e) => setRiftCustomQuestion(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Mode Description prompt */}
                    <p className="text-[9.5px] text-[#b4aae2]/70 leading-relaxed mt-1">
                      {riftVisionMode === 'notes' ? 'Snap handwritten stats, tables, or session ideas. AI transcribes and inserts them directly into your notes archive.' :
                       riftVisionMode === 'betslip' ? 'Scan printed ticket parlays, screenshots, or receipts. AI parses match details and logs them as legs.' :
                       riftVisionMode === 'character' ? 'Scan physical paper d&d character sheets, item stats, or cards. AI extracts values to populate your sheet!' :
                       riftVisionMode === 'dice' ? 'Point the vision scanner at physical dice rolled on your table. AI reads total rolls and logs results.' :
                       riftVisionMode === 'calendar' ? 'Scan posters, lists, or meeting schedules. AI auto-formats events and saves them to your Calendar.' :
                       'Ask anything about the visual capture. Portal AI interprets and delivers multidimensional visual answers.'}
                    </p>
                  </div>

                  {/* Scan Status / Results Viewer */}
                  <div className="flex-1 bg-black/40 rounded-lg p-3 border border-[#44387a]/25 overflow-y-auto text-left min-h-[100px] flex items-center justify-center relative">
                    {riftVisionScanning ? (
                      <div className="flex flex-col items-center gap-2 animate-pulse">
                        <RefreshCw className="text-[#3fd9c7] animate-spin" size={20} />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#3fd9c7]">ANALYZING COSMIC ENERGIES...</span>
                      </div>
                    ) : riftVisionResult ? (
                      <div className="text-[10px] leading-relaxed text-slate-200 overflow-y-auto max-h-[180px] w-full select-text whitespace-pre-wrap font-mono">
                        {riftVisionResult}
                      </div>
                    ) : (
                      <div className="text-[10.5px] text-center italic text-[#b4aae2]/45">
                        {riftVisionImage ? 'Visual data bound. Click "ENGAGE SCANNER" to process.' : 'Awaiting snapshot capture or image file upload...'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Engaging Scan Actions */}
                <div className="flex gap-2">
                  <button 
                    disabled={!riftVisionImage || riftVisionScanning}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-center transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#3fd9c7] to-[#cf4fe6] text-white shadow-[0_0_12px_rgba(63,217,199,0.3)] hover:brightness-110 active:scale-[0.98]"
                    onClick={() => { haptic([10, 50, 10]); if (riftVisionImage) scanImageWithGemini(riftVisionImage, riftVisionMode, riftCustomQuestion); }}
                  >
                    🚀 ENGAGE SCANNER
                  </button>
                  {!riftVisionImage && !cameraStream && (
                    <button 
                      className="px-3.5 rounded-xl border border-[#3fd9c7]/30 bg-[#3fd9c7]/5 text-[#3fd9c7] hover:bg-[#3fd9c7]/10 flex items-center justify-center cursor-pointer"
                      onClick={() => { haptic(5); startRiftCamera(); }}
                      title="Activate Camera Stream"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </nav>
    </>
  );
}
