import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, MessageSquare, Gamepad2, Folder, Image, Globe, Sparkles, 
  Wrench, Code2, FileText, Calendar, AlarmClock, Settings, 
  Search, Bell, ChevronDown, Plus, Check, Play, Pause, Trash2, 
  Download, Sparkle, Server, Shield, Brain, Cpu, Database, 
  Battery, AlertCircle, RefreshCw, Send, CheckCircle2, X, Fingerprint,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen
} from 'lucide-react';
import { AudioPlayer, TRACKS } from './components/AudioPlayer';
import { NeonDriftGame } from './components/NeonDriftGame';

// Navigation list
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'browser', label: 'Browser', icon: Globe },
  { id: 'utilities', label: 'Utilities', icon: Sparkles },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'alarms', label: 'Alarms', icon: AlarmClock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Quick Access Items from reference image
const QUICK_ACCESS = [
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, color: 'purple', desc: 'Interact with NextGen 7B model' },
  { id: 'games', label: 'Games', icon: Gamepad2, color: 'blue', desc: 'Arcade and virtual reality sims' },
  { id: 'files', label: 'Files', icon: Folder, color: 'cyan', desc: 'Secure decentralized storage' },
  { id: 'images', label: 'Images', icon: Image, color: 'emerald', desc: 'AI media canvas & renders' },
  { id: 'browser', label: 'Browser', icon: Globe, color: 'cyan', desc: 'Encrypted sandboxed network' },
  { id: 'utilities', label: 'Utilities', icon: Sparkles, color: 'purple', desc: 'System optimization tools' },
  { id: 'code', label: 'Code', icon: Code2, color: 'blue', desc: 'Embedded sandbox compiler' },
  { id: 'notes', label: 'Notes', icon: FileText, color: 'amber', desc: 'Dynamic markdown compiler' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'pink', desc: 'Quantum timeline schedule' },
  { id: 'alarms', label: 'Alarms', icon: AlarmClock, color: 'pink', desc: 'Core temporal triggers' },
  { id: 'downloads', label: 'Downloads', icon: Download, color: 'cyan', desc: 'Remote payload manager' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'purple', desc: 'Core UI & trim calibrator' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [themeColor, setThemeColor] = useState('purple'); // breathing trim theme: silver, purple, cyan, pink, emerald, amber
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchPalette, setShowSearchPalette] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Sidebar toggles for the user to override responsive hidden states
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [homeSubTab, setHomeSubTab] = useState<'launch' | 'activity' | 'diagnostics'>('launch');

  // Responsive sidebar dynamic adjustment
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      } else if (window.innerWidth < 1200) {
        setShowLeftSidebar(true);
        setShowRightSidebar(false);
      } else {
        setShowLeftSidebar(true);
        setShowRightSidebar(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hold-to-scan Portal Home Button States
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const [isScanning, setIsScanning] = useState(false);
  const [showDecoyAi, setShowDecoyAi] = useState(false);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);

  // Decoy AI chat states
  const [decoyInput, setDecoyInput] = useState('');
  const [decoyHistory, setDecoyHistory] = useState<Array<{role: string, content: string}>>([
    { role: 'system', content: '>>> LOCAL SYNAPTIC BLOCK ENGAGED. DIRECTORY PATH: /sys/core/ai\n>>> USER IDENTIFIED: TREY\n>>> CLASSIFICATION: CLASS-A OPERATOR\n>>> LOCAL DECOY MODEL STATUS: ONLINE & DEPLOYED' },
    { role: 'ai', content: 'Operator Trey, fingerprint authorization accepted. I am your on-device decoy mainframe assistant. Direct connection to local neural nodes is established. What matrix operations shall we coordinate today?' }
  ]);
  const [isDecoyTyping, setIsDecoyTyping] = useState(false);
  const decoyBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll decoy AI chat
  useEffect(() => {
    decoyBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [decoyHistory, showDecoyAi]);

  const handleScanStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanProgress(0);
    holdStartTimeRef.current = Date.now();

    const duration = 1000; // 1 second
    const intervalTime = 30; // update every 30ms
    const step = (100 / (duration / intervalTime));

    progressIntervalRef.current = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    scanTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setScanProgress(100);
      setIsScanning(false);
      setShowDecoyAi(true);
      // Clean vibration support
      if (navigator.vibrate) {
        try { navigator.vibrate(200); } catch (_) {}
      }
    }, duration);
  };

  const handleScanEnd = () => {
    if (!isScanning) return;

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const holdDuration = Date.now() - holdStartTimeRef.current;
    setIsScanning(false);
    setScanProgress(0);

    // Short tap/click acts as HOME button
    if (holdDuration < 1000) {
      setActiveTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSendDecoyMessage = (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msg = customMsg || decoyInput;
    if (!msg.trim()) return;

    setDecoyHistory(prev => [...prev, { role: 'user', content: msg }]);
    if (!customMsg) setDecoyInput('');
    setIsDecoyTyping(true);

    setTimeout(() => {
      const msgLower = msg.toLowerCase();
      let reply = '';
      if (msgLower.includes('biometric') || msgLower.includes('diagnostics') || msgLower.includes('fingerprint')) {
        reply = "SCANNER DATA:\n- Ridge pattern: Whorl / Portal Concentric\n- Blood pressure: 120/80 (Optimal)\n- Adrenaline: Elevated (Excitement levels high)\n- Diagnosis: Operator Trey is fully calibrated for hyperdrive.";
      } else if (msgLower.includes('temp') || msgLower.includes('temperature') || msgLower.includes('core')) {
        reply = "CORE METRICS REPORT:\n- CPU Temp: 42°C\n- Memory Temp: 38°C\n- Aux Coolant Level: 92.4%\n- System Integrity: 100% Optimal. No thermal throttling detected.";
      } else if (msgLower.includes('firewall') || msgLower.includes('security') || msgLower.includes('bypass')) {
        reply = "⚠️ SECURITY OVERRIDE TRIGGERED...\n[Bypassing Aux firewall block... Done]\n[Decrypting kernel layer... Done]\n[Generating mainframe credentials... Rejected]\n\nNice try, Operator Trey! The decoy firewall has locked you out. System remains perfectly secure.";
      } else if (msgLower.includes('integrity') || msgLower.includes('mainframe') || msgLower.includes('analyse') || msgLower.includes('analyze')) {
        reply = "DIAGNOSTIC READOUT:\n- Subspace portals: ENGAGED\n- Audio synthesis engine: TUNED\n- Neon Drift simulator: STEADY\n- Local sandbox memory storage: ACTIVE\n- Mainframe is rock solid!";
      } else if (msgLower.includes('hello') || msgLower.includes('hi')) {
        reply = "Greetings, Operator Trey! My synaptic networks are buzzing. Let's calibrate some portals.";
      } else {
        const fallbackAnswers = [
          "Local cognitive mainframe processing complete. Understood: '" + msg + "'. This is a highly responsive simulated decoy response. Systems remain fully optimal.",
          "Auxiliary decoy engine parsed your payload. Command logged. No fatal core conflicts found, Trey.",
          "Failsafe mode active. Understood request. Biometric signature matching indicates high priority action, but simulated decoy protocols are strictly for entertainment. Let's drift some neon cars instead!",
          "Processing your neural inputs... Decoy node replies: Trey, your request has been logged in the local decentralized cache. Ready for the next command."
        ];
        reply = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
      }

      setDecoyHistory(prev => [...prev, { role: 'ai', content: reply }]);
      setIsDecoyTyping(false);
    }, 900);
  };

  // AI assistant states
  const [aiInput, setAiInput] = useState('');
  const [aiHistory, setAiHistory] = useState<Array<{role: string, content: string}>>([
    { role: 'model', content: 'Greeting Operator Trey. Systems calibrated. How may I optimize your workflow today?' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Alarms status state
  const [alarms, setAlarms] = useState([
    { id: 1, time: '7:00 AM', label: 'Morning Alarm', active: true },
    { id: 2, time: '12:30 PM', label: 'Lunch Break', active: true },
    { id: 3, time: '9:00 PM', label: 'Study Time', active: false },
  ]);

  // Today's Plan Checklist
  const [tasks, setTasks] = useState([
    { id: 1, label: 'Math homework', time: '10:00 AM', completed: false },
    { id: 2, label: 'Gym', time: '12:00 PM', completed: true },
    { id: 3, label: 'Study for test', time: '7:00 PM', completed: false },
    { id: 4, label: 'Read chapter 5', time: '9:30 PM', completed: false },
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('12:00 PM');

  // Downloads manager state
  const [downloads, setDownloads] = useState([
    { id: 1, name: 'NextGenPortal_Setup.exe', size: '1.2 GB', progress: 100 },
    { id: 2, name: 'Game_Update_v2.3.zip', size: '850 MB', progress: 80 },
    { id: 3, name: 'AI_Model_7B.gguf', size: '4.2 GB', progress: 100 },
  ]);

  // Recent Activity state
  const [activities, setActivities] = useState([
    { id: '1', type: 'chat', label: 'Physics Homework Help', subtitle: 'AI Chat', time: '2m ago' },
    { id: '2', type: 'games', label: 'Neon Drift Multiplayer', subtitle: 'Game Session', time: '29m ago' },
    { id: '3', type: 'notes', label: 'Workout Plan', subtitle: 'Note', time: '1h ago' },
    { id: '4', type: 'images', label: 'Island Concept Art.png', subtitle: 'Image', time: '2h ago' },
    { id: '5', type: 'files', label: 'Project Portal v2', subtitle: 'Folder', time: '3h ago' },
  ]);

  // Command palette keyboard listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchPalette(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearchPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll chat window down when AI replies
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiHistory]);

  // Dynamic Theme hex colors for badges & custom borders
  const getThemeHex = () => {
    switch (themeColor) {
      case 'silver': return '#64748b'; // elegant slate-silver
      case 'purple': return '#8b5cf6'; // vivid violet-purple matching screenshot
      case 'cyan': return '#3b82f6'; // vivid royal blue matching screenshot
      case 'pink': return '#ec4899';
      case 'emerald': return '#10b981';
      case 'amber': return '#f59e0b';
      default: return '#8b5cf6'; // purple default
    }
  };

  const getThemeBreatheClass = () => {
    switch (themeColor) {
      case 'silver': return 'glow-silver';
      case 'cyan': return 'glow-blue';
      case 'pink': return 'glow-pink';
      case 'emerald': return 'glow-blue'; // reusable soft green
      case 'amber': return 'glow-blue'; // reusable soft amber
      default: return 'glow-purple';
    }
  };

  const getAccentBg = () => {
    switch (themeColor) {
      case 'silver': return 'bg-slate-100 border-slate-200 text-slate-700';
      case 'cyan': return 'bg-blue-50 border-blue-100 text-blue-700';
      case 'pink': return 'bg-pink-50 border-pink-100 text-pink-700';
      case 'emerald': return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      case 'amber': return 'bg-amber-50 border-amber-100 text-amber-700';
      default: return 'bg-purple-50 border-purple-100 text-purple-700';
    }
  };

  // Chat message submission
  const handleSendChatMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msgToSend = customMsg || aiInput;
    if (!msgToSend.trim()) return;

    const userMsg = { role: 'user', content: msgToSend };
    setAiHistory(prev => [...prev, userMsg]);
    if (!customMsg) setAiInput('');
    setIsAiLoading(true);

    try {
      // Real API proxy
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgToSend,
          history: aiHistory
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setAiHistory(prev => [...prev, { role: 'model', content: data.text }]);
      } else {
        // High fidelity mock fallback if Gemini isn't configured
        setTimeout(() => {
          setAiHistory(prev => [...prev, { 
            role: 'model', 
            content: `[Fallback Mode] NextGen AI simulated response for: "${msgToSend}". Let's optimize this parameter set. To run live requests, please configure your GEMINI_API_KEY in the Secrets panel.` 
          }]);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setAiHistory(prev => [...prev, { 
        role: 'model', 
        content: `Connection offline. Fallback processing initialized. Understood: "${msgToSend}". Systems remain optimal.` 
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle tasks
  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks(prev => [
      ...prev,
      { id: Date.now(), label: newTaskText, time: newTaskTime, completed: false }
    ]);
    setNewTaskText('');
  };

  // Filter components for workspace testing
  const filteredQuickAccess = QUICK_ACCESS.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#edf0f8] text-slate-800 font-sans flex flex-col relative overflow-hidden selection:bg-indigo-500/20 selection:text-indigo-950">
      
      {/* Absolute background nebula visual details - soft and vibrant light blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/35 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px] pointer-events-none" />

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid opacity-60 pointer-events-none" />

      {/* TOP HEADER */}
      <header id="main-header" className="sticky top-0 z-40 bg-white/50 backdrop-blur-md border-b border-slate-200/45 px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* Left: Brand logo, name, & Left Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className="p-1.5 rounded-lg hover:bg-slate-200/50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer mr-0.5"
            title="Toggle Left Panel"
          >
            {showLeftSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" style={{ color: getThemeHex() }} />}
          </button>

          <div 
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-1000 relative hidden xs:flex"
            style={{ 
              borderColor: getThemeHex(),
              boxShadow: `0 0 10px ${getThemeHex()}30`
            }}
          >
            {/* Spinning core node */}
            <div className="w-4 h-4 rounded-full border border-dashed animate-[spin_6s_linear_infinite] flex items-center justify-center" style={{ borderColor: getThemeHex() }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getThemeHex() }} />
            </div>
            {/* Outer pulsating wave */}
            <div className="absolute -inset-1 rounded-full border opacity-10 animate-ping" style={{ borderColor: getThemeHex() }} />
          </div>
          <span className="font-extrabold text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-950 select-none">
            THE PORTAL
          </span>
        </div>

        {/* Center: Search Bar (fully interactive with Command Palette overlay) - always visible, beautifully responsive */}
        <div className="relative flex-1 max-w-xs sm:max-w-md md:max-w-lg mx-2 sm:mx-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              id="header-search-input"
              type="text"
              placeholder="Search or ask anything in The Portal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchPalette(true)}
              className="w-full pl-9 pr-12 py-1.5 bg-[#ebedfa]/50 border border-slate-200/40 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400/60 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
            <div className="absolute right-3.5 top-2 px-1.5 py-0.5 rounded border border-slate-200/80 bg-slate-100/80 text-[8px] text-slate-400 font-mono tracking-wider select-none hidden sm:block">
              ⌘ K
            </div>
          </div>

          {/* Inline search dropdown results preview */}
          {searchQuery && (
            <div className="absolute left-0 right-0 mt-2 p-2 bg-white/95 backdrop-blur-md border border-slate-200/65 rounded-lg shadow-2xl z-50">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 px-3 py-1 font-bold">
                Filtered Workspace Panels
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredQuickAccess.length === 0 ? (
                  <div className="text-xs text-slate-400 p-3 text-center">No matching panels found</div>
                ) : (
                  filteredQuickAccess.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-50 text-left transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-700">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side: Notifications, Right Sidebar Toggle, & User profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Accent Color Trim Quick Config buttons */}
          <div className="flex items-center gap-1 bg-[#ebedfa]/45 border border-slate-200/30 p-1 rounded-full">
            {(['silver', 'purple', 'cyan', 'pink', 'emerald', 'amber'] as const).map(color => (
              <button 
                key={color}
                title={`Accent: ${color}`}
                onClick={() => setThemeColor(color)}
                className={`w-2.5 h-2.5 rounded-full transition-all hover:scale-125 ${
                  color === 'silver' ? 'bg-slate-500' :
                  color === 'purple' ? 'bg-purple-500' :
                  color === 'cyan' ? 'bg-blue-500' :
                  color === 'pink' ? 'bg-pink-500' :
                  color === 'emerald' ? 'bg-emerald-500' :
                  'bg-amber-500'
                } ${themeColor === color ? 'ring-2 ring-slate-400 scale-110 shadow-lg' : 'opacity-40'}`}
              />
            ))}
          </div>

          {/* Notification bell badge */}
          <button 
            id="bell-notification-btn"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors relative"
            onClick={() => alert("All portal subsystems optimal. 0 outstanding warning alerts.")}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          </button>

          {/* Right Sidebar Toggle */}
          <button 
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            title="Toggle Right Panel"
          >
            {showRightSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" style={{ color: getThemeHex() }} />}
          </button>

          {/* User profile capsule */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=128&auto=format&fit=crop" 
                alt="Trey User Avatar" 
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-200 object-cover"
              />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden lg:inline">Trey</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden lg:block" />
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE GRID */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION COLUMN (LEFT) */}
        <aside id="sidebar-nav" className={`fixed lg:static top-14 bottom-0 left-0 z-40 border-r border-slate-200/40 bg-white/75 lg:bg-white/55 backdrop-blur-xl flex flex-col justify-between overflow-y-auto transition-all duration-300 shadow-2xl lg:shadow-none lg:relative ${
          showLeftSidebar 
            ? 'w-64 p-4 translate-x-0 opacity-100 pointer-events-auto' 
            : 'w-0 lg:w-0 p-0 opacity-0 -translate-x-full lg:translate-x-0 lg:border-r-0 pointer-events-none'
        }`}>
          
          {/* Top navigation container */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400 px-3 pb-2 font-bold select-none">
              Portal Core
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-tab-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    // scroll to top of viewport
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-300 ${
                    isActive 
                      ? 'text-indigo-600 bg-indigo-50/80 font-bold shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                  } relative overflow-hidden group`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? '' : 'text-slate-400 group-hover:text-slate-600'}`} style={{ color: isActive ? getThemeHex() : undefined }} />
                    <span>{item.label}</span>
                  </div>

                  {/* High contrast violet active border pill */}
                  {isActive && (
                    <div className="absolute inset-y-0 left-0 w-[3px] rounded-r-sm" style={{ backgroundColor: getThemeHex() }} />
                  )}
                  {isActive && (
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-500/30 to-transparent" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Lower Sidebar status card matching the exact spec from the image */}
          <div className="mt-8">
            <div 
              className={`glass-panel p-4 rounded-xl border border-slate-200/50 relative overflow-hidden transition-all duration-1000 ${getThemeBreatheClass()}`}
              style={{ borderColor: getThemeHex() + '30' }}
            >
              {/* Scanline grid details inside card */}
              <div className="absolute inset-0 cyber-grid-dense opacity-10 pointer-events-none" />

              <div className="flex items-center justify-between mb-3.5">
                <div className="flex flex-col">
                  <span className="text-[10px] tracking-widest text-slate-400 uppercase font-bold">NextGenPortal</span>
                  <span className="text-[9px] text-purple-600 font-mono font-bold tracking-wider">OFFLINE AI</span>
                </div>
                
                {/* Floating floating floating brain icon exactly like image */}
                <div className="float-animated p-1.5 rounded-lg bg-purple-50 border border-purple-200 shadow-sm">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
              </div>

              {/* Specs & Info Rows */}
              <div className="space-y-2 mb-4 border-t border-slate-200/40 pt-3 text-[10px] font-mono text-slate-500">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getThemeHex() }} />
                    Status
                  </span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ready
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Model</span>
                  <span className="text-slate-600">NextGen 7B</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Storage</span>
                  <span className="text-slate-600">512 GB Free</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Memory</span>
                  <span className="text-slate-600">8.0 GB</span>
                </div>
              </div>

              {/* Action button */}
              <button 
                id="sidebar-ai-settings-btn"
                onClick={() => {
                  setActiveTab('settings');
                  alert("Opening AI Matrix System configuration...");
                }}
                className="w-full py-1.5 bg-white border border-slate-200 shadow-sm rounded-md text-[9px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-colors tracking-widest cursor-pointer"
              >
                AI SETTINGS
              </button>
            </div>
          </div>
        </aside>

        {/* MIDDLE MAIN WORKSPACE */}
        <main className="flex-1 p-6 overflow-y-auto relative">
          
          {/* Quick tab switch notifications */}
          {activeTab !== 'home' && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 bg-slate-950/40 p-2 rounded border border-white/[0.02] max-w-max">
              <span>Workspace Portal</span>
              <span>/</span>
              <span className="text-slate-300 font-bold uppercase tracking-wider">{activeTab} View</span>
              <button onClick={() => setActiveTab('home')} className="text-purple-400 hover:underline pl-2 ml-2 border-l border-white/10">
                Return Home
              </button>
            </div>
          )}

          {/* MAIN HOME VIEW MODULE */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              
              {/* Premium Segmented Control Navigation to completely eliminate vertical scrolling */}
              <div className="border border-slate-200/40 p-1 bg-white/75 backdrop-blur-md rounded-2xl flex items-center justify-between shadow-sm max-w-xl mx-auto w-full">
                <button 
                  onClick={() => setHomeSubTab('launch')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    homeSubTab === 'launch' 
                      ? 'bg-[#8b5cf6] text-white shadow-sm font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🚀 Launchpad
                </button>
                <button 
                  onClick={() => setHomeSubTab('activity')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    homeSubTab === 'activity' 
                      ? 'bg-[#8b5cf6] text-white shadow-sm font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📋 Activity & Plans
                </button>
                <button 
                  onClick={() => setHomeSubTab('diagnostics')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    homeSubTab === 'diagnostics' 
                      ? 'bg-[#8b5cf6] text-white shadow-sm font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚡ Telemetry
                </button>
              </div>

              {homeSubTab === 'launch' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* Top Welcome Banner with Space/Cosmic Nebula background */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/85 shadow-xl p-6 sm:p-8 bg-gradient-to-r from-[#eef2ff] via-[#f5f3ff] to-[#fdf3f8] min-h-[130px] sm:min-h-[200px] flex flex-col justify-between silver-shimmer">
                    
                    {/* Cosmos Nebula graphic design using pure CSS gradients & glowing shapes */}
                    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 overflow-hidden pointer-events-none">
                      {/* Glowing background */}
                      <div className="absolute right-[-10%] top-[-20%] w-[120%] h-[140%] rounded-full bg-gradient-to-br from-indigo-200/30 via-purple-200/20 to-transparent blur-[80px]" />
                      
                      {/* Holographic Spinning Interactive Globe SVG */}
                      <div className="absolute right-[-30px] sm:right-[10%] top-1/2 -translate-y-1/2 w-32 h-32 sm:w-56 sm:h-56 opacity-25 sm:opacity-85">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-400/80 drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                          {/* Outer orbital rings */}
                          <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="currentColor" strokeWidth="0.25" strokeDasharray="3 3" className="animate-[spin_16s_linear_infinite]" />
                          <ellipse cx="50" cy="50" rx="40" ry="16" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="0.15" className="animate-[spin_24s_linear_infinite_reverse]" />
                          <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="0.2" />
                          
                          {/* Spinning grid lines inside planet */}
                          <circle cx="50" cy="50" r="28" fill="white" stroke="currentColor" strokeWidth="0.5" className="opacity-90" />
                          <path d="M50 22 A28 28 0 0 0 50 78 Z" fill="none" stroke="currentColor" strokeWidth="0.2" className="animate-[pulse_4s_ease-in-out_infinite]" />
                          <path d="M50 22 A28 20 0 0 0 50 78 Z" fill="none" stroke="currentColor" strokeWidth="0.15" />
                          <path d="M50 22 A28 10 0 0 0 50 78 Z" fill="none" stroke="currentColor" strokeWidth="0.1" />
                          <line x1="22" y1="50" x2="78" y2="50" stroke="currentColor" strokeWidth="0.2" />
                          <line x1="26" y1="36" x2="74" y2="36" stroke="rgba(99,102,241,0.3)" strokeWidth="0.15" />
                          <line x1="26" y1="64" x2="74" y2="64" stroke="rgba(99,102,241,0.3)" strokeWidth="0.15" />
                          
                          {/* Glowing satellite nodes */}
                          <circle cx="26" cy="36" r="1.5" fill="#4f46e5" className="animate-pulse" />
                          <circle cx="74" cy="64" r="1.5" fill="#4f46e5" className="animate-pulse" />
                          <circle cx="50" cy="22" r="1.5" fill="#4f46e5" />
                          <circle cx="50" cy="78" r="1.5" fill="#6366f1" />
                        </svg>
                      </div>
                      
                      {/* Floating particles */}
                      <div className="absolute top-[20%] right-[50%] w-1.5 h-1.5 bg-indigo-300 rounded-full opacity-50 animate-ping" />
                      <div className="absolute top-[75%] right-[20%] w-1.5 h-1.5 bg-purple-300 rounded-full opacity-60" />
                    </div>

                    <div className="relative z-10 space-y-1.5 text-left">
                      <div className="text-xs font-bold text-amber-600 tracking-wider flex items-center gap-2">
                        Good morning, Trey 👋
                      </div>
                      <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-none mt-1">
                        Everything you need,<br />all in <span className="text-[#8b5cf6]">one</span> place.
                      </h1>
                    </div>

                    {/* Pill Action Options directly from reference image */}
                    <div className="relative z-10 flex flex-wrap gap-2 mt-4 sm:mt-6">
                      <button 
                        id="pill-chat-ai"
                        onClick={() => setActiveTab('chat')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ebedfa]/80 border border-slate-200/50 text-[10px] font-bold text-slate-700 hover:text-slate-900 hover:bg-white hover:border-purple-300 transition-all shadow-sm group cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
                        Chat with AI
                      </button>
                      <button 
                        id="pill-play-game"
                        onClick={() => setActiveTab('games')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ebedfa]/80 border border-slate-200/50 text-[10px] font-bold text-slate-700 hover:text-slate-900 hover:bg-white hover:border-blue-300 transition-all shadow-sm group cursor-pointer"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                        Play a Game
                      </button>
                      <button 
                        id="pill-open-file"
                        onClick={() => setActiveTab('files')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ebedfa]/80 border border-slate-200/50 text-[10px] font-bold text-slate-700 hover:text-slate-900 hover:bg-white hover:border-cyan-300 transition-all shadow-sm group cursor-pointer"
                      >
                        <Folder className="w-3.5 h-3.5 text-cyan-600 group-hover:scale-110 transition-transform" />
                        Open a File
                      </button>
                      <button 
                        id="pill-set-alarm"
                        onClick={() => setActiveTab('alarms')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ebedfa]/80 border border-slate-200/50 text-[10px] font-bold text-slate-700 hover:text-slate-900 hover:bg-white hover:border-pink-300 transition-all shadow-sm group cursor-pointer"
                      >
                        <AlarmClock className="w-3.5 h-3.5 text-pink-600 group-hover:scale-110 transition-transform" />
                        Set an Alarm
                      </button>
                    </div>
                  </div>

                  {/* Quick Access Section (Exact Grid layout matching image) */}
                  <div className="space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quick Access</h2>
                      <button 
                        onClick={() => alert("Arrange panel configuration grid...")} 
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Customize ⚙
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
                      {filteredQuickAccess.map((item) => {
                        const Icon = item.icon;
                        
                        // Choose theme core or static custom item background color based on spec
                        const getIconColor = () => {
                          switch (item.color) {
                            case 'blue': return 'text-white bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 shadow-md shadow-blue-500/15';
                            case 'cyan': return 'text-white bg-gradient-to-br from-sky-400 to-blue-500 border-sky-400 shadow-md shadow-sky-400/15';
                            case 'emerald': return 'text-white bg-gradient-to-br from-teal-400 to-emerald-500 border-teal-400 shadow-md shadow-emerald-400/15';
                            case 'amber': return 'text-white bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400 shadow-md shadow-amber-400/15';
                            case 'pink': return 'text-white bg-gradient-to-br from-pink-400 to-rose-500 border-pink-400 shadow-md shadow-pink-400/15';
                            default: return 'text-white bg-gradient-to-br from-purple-500 to-indigo-500 border-purple-400 shadow-md shadow-purple-400/15';
                          }
                        };

                        return (
                          <button
                            id={`quick-access-${item.id}`}
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="glass-panel p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/50 hover:bg-white/95 flex flex-col items-center justify-center text-center group transition-all duration-300 hover:scale-102 hover:shadow-xl cursor-pointer"
                          >
                            {/* Rounded glowing square icon exactly like reference */}
                            <div className={`p-2.5 sm:p-4 rounded-lg sm:rounded-xl border mb-2 sm:mb-3 transition-all group-hover:scale-110 ${getIconColor()}`}>
                              <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 tracking-wide group-hover:text-indigo-600 transition-colors">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity Panel matching exact columns & layout from image */}
              {homeSubTab === 'activity' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Activity</h2>
                  <button 
                    onClick={() => alert("Review historic workspace session analytics logs...")}
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="glass-panel rounded-2xl border border-slate-200/40 overflow-hidden divide-y divide-slate-100">
                  {activities.map((act) => {
                    // Match icons
                    const getIcon = () => {
                      switch (act.type) {
                        case 'chat': return <MessageSquare className="w-4 h-4 text-purple-600" />;
                        case 'games': return <Gamepad2 className="w-4 h-4 text-blue-600" />;
                        case 'notes': return <FileText className="w-4 h-4 text-amber-600" />;
                        case 'images': return <Image className="w-4 h-4 text-emerald-600" />;
                        default: return <Folder className="w-4 h-4 text-cyan-600" />;
                      }
                    };

                    return (
                      <div 
                        key={act.id} 
                        className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => {
                          setActiveTab(act.type);
                        }}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/30 flex items-center justify-center shadow-sm">
                            {getIcon()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{act.label}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{act.subtitle}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{act.time}</span>
                          <span className="text-slate-300 select-none">❯</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

                  {/* Bottom Row grid (Today's Plan and Downloads list) exactly like reference image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* TODAY'S PLAN */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Today's Plan</h3>
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">
                        {tasks.filter(t=>t.completed).length}/{tasks.length} Completed
                      </span>
                    </div>

                    {/* Task checklist container */}
                    <div className="space-y-3.5">
                      {tasks.map(task => (
                        <div 
                          key={task.id} 
                          onClick={() => toggleTask(task.id)}
                          className="flex items-center justify-between group cursor-pointer py-1 select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              task.completed 
                                ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white' 
                                : 'border-slate-300 group-hover:border-[#8b5cf6]'
                            }`}>
                              {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs font-medium transition-all ${
                              task.completed ? 'text-slate-400 line-through font-normal' : 'text-slate-700'
                            }`}>
                              {task.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{task.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add interactive task form in widget bottom */}
                  <form onSubmit={handleAddTask} className="mt-6 pt-4 border-t border-slate-200/50 flex gap-2">
                    <input 
                      type="text"
                      placeholder="Add homework, test study, workout..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      className="flex-1 bg-slate-100/50 border border-slate-200/50 rounded-md px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 transition-all"
                    />
                    <input 
                      type="text"
                      placeholder="9:30 PM"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="w-16 bg-slate-100/50 border border-slate-200/50 rounded-md px-2 py-1.5 text-[10px] text-center font-mono text-slate-600 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 transition-all"
                    />
                    <button 
                      type="submit" 
                      className="p-1.5 rounded-md bg-[#8b5cf6] hover:bg-indigo-600 text-white shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* DOWNLOADS MANAGER */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-200/40">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Downloads</h3>
                    <button 
                      onClick={() => {
                        setDownloads(prev => prev.map(d => ({ ...d, progress: 100 })));
                        alert("Synchronized and initialized offline cache.");
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {downloads.map(file => (
                      <div key={file.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700 truncate max-w-[180px]">{file.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{file.size}</span>
                        </div>

                        {/* Progress slider bar matching reference */}
                        <div className="relative">
                          <div className="h-1 bg-slate-100 border border-slate-200/20 rounded-full overflow-hidden">
                            <div 
                              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-blue-400 to-[#8b5cf6]"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 mt-1">
                            <span>Status: {file.progress === 100 ? 'Completed' : 'Syncing payload'}</span>
                            <span>{file.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
                </div>
              )}

              {/* Telemetry and Graphic Panels Grid (Bento style) */}
              {homeSubTab === 'diagnostics' && (
                <div className="space-y-3 text-left pt-2 animate-[fadeIn_0.3s_ease-out]">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    Systems Diagnostics & Telemetry
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Card 1: Corporate Mainframe Rack Layout */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mainframe Core Nodes</span>
                        <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100">ONLINE</span>
                      </div>
                      
                      {/* Visual Server Racks SVG */}
                      <div className="bg-slate-100/55 border border-slate-200/50 rounded-xl p-3.5 space-y-2.5 font-mono text-[9px] text-slate-400">
                        {[1, 2, 3].map((rackId) => (
                          <div key={rackId} className="flex items-center justify-between p-1.5 bg-white/85 border border-slate-200/30 rounded shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-slate-600 font-semibold">NODE_{rackId}0_U</span>
                            </div>
                            {/* Simulated led indicators */}
                            <div className="flex items-center gap-1">
                              <span className="w-1 h-2 rounded-sm" style={{ backgroundColor: rackId === 1 ? '#10b981' : '#e2e8f0' }} />
                              <span className="w-1 h-2 rounded-sm" style={{ backgroundColor: rackId === 2 ? '#10b981' : '#e2e8f0' }} />
                              <span className="w-1 h-2 rounded-sm animate-pulse" style={{ backgroundColor: '#06b6d4' }} />
                              <span className="w-1 h-2 rounded-sm" style={{ backgroundColor: rackId === 3 ? '#3b82f6' : '#e2e8f0' }} />
                            </div>
                          </div>
                        ))}
                        <div className="text-[8px] text-slate-400 flex justify-between pt-1 select-none font-bold">
                          <span>PORTAL_UNIT_422</span>
                          <span>TEMP: 38.2°C</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Quantum Telemetry Oscilloscope */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantum Core Frequency</span>
                        <span className="text-[9px] font-mono text-cyan-600 bg-cyan-50 border border-cyan-100 px-1.5 rounded font-bold">4.82 GHz</span>
                      </div>

                      {/* Oscilloscope live curves path */}
                      <div className="bg-slate-100/55 border border-slate-200/50 rounded-xl p-2.5 h-28 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 cyber-grid-dense opacity-10" />
                        <svg viewBox="0 0 100 40" className="w-full h-full text-[#8b5cf6] pointer-events-none">
                          {/* Animated wave path */}
                          <path 
                            d="M0 20 Q15 5, 30 20 T60 20 T90 20 T100 20" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="0.75"
                            className="opacity-80"
                          />
                          <path 
                            d="M0 20 Q10 35, 25 20 T50 20 T75 20 T100 20" 
                            fill="none" 
                            stroke="rgba(0, 0, 0, 0.15)" 
                            strokeWidth="0.5"
                            strokeDasharray="4 4"
                          />
                        </svg>
                        {/* Floating overlay text */}
                        <div className="absolute bottom-2 left-3 text-[8px] font-mono text-slate-400">
                          FREQ_SWEEP: ACTIVE
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Calibration Gauges */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subspace Calibrators</span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">100% OK</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1">
                        {[
                          { label: 'CPU', value: '68%', color: 'border-purple-400 text-[#8b5cf6]' },
                          { label: 'COOLANT', value: '92%', color: 'border-blue-400 text-blue-600' },
                          { label: 'NEURAL', value: '99%', color: 'border-teal-400 text-teal-600' }
                        ].map((gauge, index) => (
                          <div key={index} className="flex flex-col items-center justify-center p-2 bg-white/80 border border-slate-200/30 rounded-xl text-center shadow-sm">
                            <div className={`w-10 h-10 rounded-full border-2 ${gauge.color} flex items-center justify-center text-[10px] font-bold font-mono shadow-sm`}>
                              {gauge.value}
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-2">{gauge.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* AI CHAT FULL-SCREEN SUITE */}
          {activeTab === 'chat' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-5 h-[calc(100vh-140px)] flex flex-col justify-between text-left">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    NextGen Chat Sandbox
                  </h2>
                  <p className="text-[10px] text-slate-500">Live Workspace proxy to Gemini 3.5-flash LLM model</p>
                </div>
                <button 
                  onClick={() => setAiHistory([{ role: 'model', content: 'Sandbox conversation memory wiped. Ready to optimize.' }])}
                  className="px-2.5 py-1 rounded bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50 text-[10px] transition-colors"
                >
                  Clear History
                </button>
              </div>

              {/* Chat timeline message frame */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {aiHistory.map((h, i) => (
                  <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs ${
                      h.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-slate-950 border border-white/5 text-slate-200 rounded-bl-none'
                    }`}>
                      <div className="font-bold text-[9px] text-slate-400 uppercase tracking-widest mb-1 select-none">
                        {h.role === 'user' ? 'Operator Trey' : 'NextGen AI Core'}
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">{h.content}</p>
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-xl px-4 py-3 bg-slate-950 border border-white/5 text-slate-400 text-xs flex items-center gap-3">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>NextGen AI matrix synthesizing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Suggestions quick clicks */}
              <div className="flex flex-wrap gap-2 py-3 border-t border-white/[0.04] mt-4">
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Explain quantum physics")}
                  className="px-2.5 py-1 rounded bg-slate-950/80 border border-white/5 text-[9px] text-slate-400 hover:text-white hover:border-purple-500/40 cursor-pointer"
                >
                  Explain quantum physics
                </button>
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Write Python code")}
                  className="px-2.5 py-1 rounded bg-slate-950/80 border border-white/5 text-[9px] text-slate-400 hover:text-white hover:border-purple-500/40 cursor-pointer"
                >
                  Write Python code
                </button>
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Summarize this document")}
                  className="px-2.5 py-1 rounded bg-slate-950/80 border border-white/5 text-[9px] text-slate-400 hover:text-white hover:border-purple-500/40 cursor-pointer"
                >
                  Summarize document
                </button>
              </div>

              {/* Chat Input form */}
              <form onSubmit={(e) => handleSendChatMessage(e)} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Ask me anything..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                />
                <button 
                  type="submit"
                  disabled={isAiLoading || !aiInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* GAMES INTERACTIVE VIEW */}
          {activeTab === 'games' && (
            <div className="space-y-6 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-blue-400" />
                    Neon Drift Arena
                  </h2>
                  <p className="text-xs text-slate-500">Live responsive retro simulation canvas play</p>
                </div>
                <button 
                  onClick={() => setActiveTab('home')}
                  className="px-2.5 py-1 bg-slate-950 border border-white/5 text-[10px] text-slate-400 hover:text-white transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>

              {/* Launched Neon Drift instance */}
              <div className="max-w-4xl mx-auto">
                <NeonDriftGame themeColor={themeColor} />
              </div>
            </div>
          )}

          {/* DECENTRALIZED FILES MANAGER */}
          {activeTab === 'files' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  <Folder className="w-4 h-4 text-cyan-400" />
                  Secure Distributed Payload Storage
                </h2>
                <p className="text-[10px] text-slate-500">Decentralized backup nodes on standard local cache</p>
              </div>

              {/* Drag drop mockup area */}
              <div 
                onClick={() => alert("Secure browser local upload window trigger.")}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/[0.01] hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-full max-w-max mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs font-bold text-slate-200">Drag payloads here to upload, or browse local volumes</span>
                <p className="text-[10px] text-slate-500 mt-1">Recommended format limits: 50MB per single payload bundle.</p>
              </div>

              {/* File list */}
              <div className="space-y-2 pt-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Active Workspace Directory</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Island Concept Art.png', size: '2.4 MB', type: 'image' },
                    { name: 'Physics Homework Help', size: '15 KB', type: 'text' },
                    { name: 'Workout Plan', size: '4 KB', type: 'text' },
                    { name: 'NextGenPortal_Setup.exe', size: '1.2 GB', type: 'binary' }
                  ].map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 border border-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Folder className="w-4 h-4 text-cyan-400" />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-200">{file.name}</span>
                          <span className="text-[9px] text-slate-500">{file.size}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert(`Retrieving payload node download stream for: ${file.name}`)}
                        className="p-1 text-slate-500 hover:text-slate-100 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* IMAGES MEDIA SUITE */}
          {activeTab === 'images' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  <Image className="w-4 h-4 text-emerald-400" />
                  Media Engine Canvas
                </h2>
                <p className="text-[10px] text-slate-500">Live image processing and generator sandbox</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Generation form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Describe generation prompt</label>
                    <textarea 
                      placeholder="e.g., Highly detailed futuristic workspace portal inside cosmic orbital station, cyberpunk, cinematic..."
                      className="w-full bg-slate-950 border border-white/5 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 h-28"
                    />
                  </div>
                  <button 
                    onClick={() => alert("Image prompt pipeline starting. Live Generation sandbox expects configured API Key.")}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Synthesize Media Render
                  </button>
                </div>

                {/* Simulated gallery thumbnails matching reference items */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Generated Renders</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Island Concept Art', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256' },
                      { name: 'Orbit Station V1', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=256' },
                    ].map((img, idx) => (
                      <div key={idx} className="group relative rounded-lg overflow-hidden border border-white/5 aspect-video bg-slate-950">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <span className="text-[10px] font-bold text-white bg-slate-950/80 px-2.5 py-1 rounded border border-white/10">{img.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTES Rich Suite */}
          {activeTab === 'notes' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left space-y-4 animate-[fadeIn_0.4s_ease-out]">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Notes Sandbox Suite
                </h2>
                <p className="text-[10px] text-slate-500">Embedded Markdown Editor sandbox</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Note list column */}
                <div className="col-span-1 border-r border-white/5 pr-4 space-y-2">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Catalog</span>
                  {[
                    { title: 'Workout Plan', time: '1h ago' },
                    { title: 'Weekly Core Standup notes', time: '1d ago' },
                    { title: 'Hardware requirements', time: '4d ago' }
                  ].map((note, idx) => (
                    <button key={idx} className="w-full text-left p-2.5 rounded-lg bg-slate-950 border border-white/5 hover:border-amber-500/40 transition-all">
                      <div className="text-xs font-bold text-slate-200 truncate">{note.title}</div>
                      <div className="text-[8px] text-slate-500 mt-0.5">{note.time}</div>
                    </button>
                  ))}
                </div>

                {/* Working Area */}
                <div className="col-span-2 space-y-4">
                  <input 
                    type="text" 
                    defaultValue="Workout Plan"
                    className="w-full bg-transparent text-slate-100 font-bold text-sm focus:outline-none border-b border-white/5 pb-2"
                  />
                  <textarea 
                    defaultValue={`# Workout Plan\n- 15m warm-up stretch\n- Core routine cycle\n- Weighted dynamic squats (3 sets x 12 reps)\n- Treadmill sprint (Intervals: 20 mins)`}
                    className="w-full bg-slate-950/40 border border-white/5 rounded-lg p-3 text-xs text-slate-200 h-48 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => alert("Payload compiled and stored to local matrix storage.")}
                      className="px-3 py-1.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/35 transition-colors"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  Systems Customizer Matrix
                </h2>
                <p className="text-[10px] text-slate-500">Calibrate the visual workspace parameters</p>
              </div>

              {/* Theme Settings block */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-950 border border-white/5">
                <span className="text-xs font-bold text-slate-300">Futuristic Animated Trim settings</span>
                <p className="text-[10px] text-slate-500">Pick the core energy hue to breathe across system modules.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {[
                    { id: 'purple', label: 'Amethyst Core', class: 'bg-purple-600 hover:bg-purple-500' },
                    { id: 'cyan', label: 'Quantum Surge', class: 'bg-cyan-500 hover:bg-cyan-400' },
                    { id: 'pink', label: 'Hyperdrive Rose', class: 'bg-pink-600 hover:bg-pink-500' },
                    { id: 'emerald', label: 'Bio-Cyber Green', class: 'bg-emerald-500 hover:bg-emerald-400' },
                    { id: 'amber', label: 'Solar Flare Corona', class: 'bg-amber-500 hover:bg-amber-400' }
                  ].map((clr) => (
                    <button
                      key={clr.id}
                      onClick={() => {
                        setThemeColor(clr.id);
                      }}
                      className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        themeColor === clr.id 
                          ? 'border-white bg-white/[0.04] scale-102' 
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${clr.class}`} />
                      <span className="text-[9px] font-bold text-slate-300">{clr.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Network Configuration display */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Workspace Ports & Environment</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[10px] text-slate-400">
                  <div className="p-3 bg-slate-950 border border-white/5 rounded-lg flex justify-between">
                    <span>PORT ACCESS:</span>
                    <span className="text-emerald-400">3000 (Proxy Active)</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-white/5 rounded-lg flex justify-between">
                    <span>HMR STATUS:</span>
                    <span className="text-slate-500">Disabled</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-white/5 rounded-lg flex justify-between">
                    <span>CONTAINER HOST:</span>
                    <span className="text-purple-400">Cloud Run Cluster</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* AI CHAT ASSISTANT PANEL (RIGHT SIDEBAR COLUMN) EXACTLY MATCHING THE IMAGE SPEC */}
        <aside id="right-panels" className={`fixed xl:static top-14 bottom-0 right-0 z-40 border-l border-slate-200/40 bg-white/75 xl:bg-white/55 backdrop-blur-xl flex flex-col gap-5 overflow-y-auto transition-all duration-300 shadow-2xl xl:shadow-none xl:relative ${
          showRightSidebar 
            ? 'w-72 p-4 translate-x-0 opacity-100 pointer-events-auto' 
            : 'w-0 xl:w-0 p-0 opacity-0 translate-x-full xl:translate-x-0 xl:border-l-0 pointer-events-none'
        }`}>
          
          {/* Section: AI Assistant Widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">AI Assistant</span>
              <button 
                onClick={() => alert("Access AI Assistant system config...")} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                •••
              </button>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-200/40 space-y-4">
              
              {/* Profile Capsule */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full bg-slate-50 border flex items-center justify-center relative overflow-hidden"
                  style={{ borderColor: getThemeHex() + '40' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-50 to-indigo-100" />
                  <div className="w-5 h-5 rounded-full border border-dashed animate-[spin_6s_linear_infinite]" style={{ borderColor: getThemeHex() }} />
                  {/* Status Indicator */}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-white pulse-circle" />
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800">NextGenPortal</span>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono mt-0.5">
                    <span className="text-slate-400">offline</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-cyan-600 font-bold">unlimited</span>
                  </div>
                </div>
              </div>

              {/* Mini conversation frame or Quick prompt input */}
              <form onSubmit={(e) => handleSendChatMessage(e)} className="relative">
                <input 
                  type="text"
                  placeholder="Ask me anything..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="w-full bg-slate-100/50 border border-slate-200/50 rounded-md px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </form>

              {/* Suggestions clicks directly from reference image */}
              <div className="space-y-1.5">
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Explain quantum physics")}
                  className="w-full py-1.5 px-3 rounded bg-slate-50/50 border border-slate-200/30 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left truncate block cursor-pointer"
                >
                  Explain quantum physics
                </button>
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Write Python code")}
                  className="w-full py-1.5 px-3 rounded bg-slate-50/50 border border-slate-200/30 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left truncate block cursor-pointer"
                >
                  Write Python code
                </button>
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Summarize this document")}
                  className="w-full py-1.5 px-3 rounded bg-slate-50/50 border border-slate-200/30 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left truncate block cursor-pointer"
                >
                  Summarize this document
                </button>
              </div>

              {/* Start new chat button */}
              <button 
                id="right-new-chat-btn"
                onClick={() => {
                  setAiHistory([{ role: 'model', content: 'New optimal thread initialized.' }]);
                  setActiveTab('chat');
                }}
                className="w-full py-2 bg-[#8b5cf6] hover:bg-indigo-600 text-white rounded-md text-[10px] font-bold transition-all tracking-wider shadow-sm cursor-pointer"
              >
                Start New Chat
              </button>
            </div>
          </div>

          {/* Section: Upcoming Alarms exactly from reference image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Upcoming Alarms</span>
              <button 
                onClick={() => setActiveTab('alarms')} 
                className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-200/40 space-y-3">
              {alarms.map(alarm => (
                <div key={alarm.id} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5">
                    <AlarmClock className="w-4 h-4 text-slate-400" />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-700">{alarm.time}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{alarm.label}</span>
                    </div>
                  </div>

                  {/* Toggle button */}
                  <button 
                    id={`toggle-alarm-${alarm.id}`}
                    onClick={() => {
                      setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: !a.active } : a));
                    }}
                    className={`w-8 h-4 rounded-full relative p-0.5 transition-colors cursor-pointer ${alarm.active ? 'bg-[#8b5cf6]' : 'bg-slate-100 border border-slate-200'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-all ${alarm.active ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Games You Play exactly from reference image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Games You Play</span>
              <button 
                onClick={() => setActiveTab('games')} 
                className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="glass-panel p-3.5 rounded-xl border border-slate-200/40 space-y-3">
              {[
                { name: 'Neon Drift', category: 'Racing', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=128' },
                { name: 'Void Raiders', category: 'Action', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=128' },
                { name: 'Mystic Realms', category: 'RPG', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=128' },
                { name: 'Puzzle Mind', category: 'Puzzle', img: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=128' }
              ].map((game, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setActiveTab('games');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <img src={game.img} alt={game.name} className="w-10 h-7 rounded object-cover border border-slate-200/30 transition-all" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{game.name}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{game.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: System Status with Glowing Cyan Radial Gauge */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">System Status</span>

            <div className="glass-panel p-4 rounded-xl border border-slate-200/40 space-y-4">
              
              {/* Radial Circle Optimal ring */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  {/* Gray background track */}
                  <circle 
                    cx="48" cy="48" r="38" 
                    className="stroke-slate-100 fill-none stroke-[6]"
                  />
                  {/* Glowing active cyan ring path */}
                  <circle 
                    cx="48" cy="48" r="38" 
                    className="stroke-[#06b6d4] fill-none stroke-[6]"
                    strokeDasharray="238"
                    strokeDashoffset="0"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.15))' }}
                  />
                </svg>

                {/* Core ring status text exactly like image */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-base font-black font-mono text-slate-800 leading-none">100%</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide mt-1">All Systems</span>
                  <span className="text-[8px] text-[#06b6d4] font-mono">Optimal</span>
                </div>
              </div>

              {/* Status List with dots exactly matching reference color tags */}
              <div className="space-y-2 border-t border-slate-200/50 pt-3 text-[10px] font-mono text-slate-400 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Storage</span>
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    512 GB Free
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Memory</span>
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    8.0 GB
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Battery</span>
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    100%
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Offline AI</span>
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    Ready
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
              </div>

            </div>
          </div>

        </aside>

      </div>

      {/* FOOTER RADIO / MEDIA RAIL AT THE ABSOLUTE BOTTOM */}
      <footer id="bottom-status-rail" className="bg-[#02020a] border-t border-white/[0.04] p-4 relative z-40">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
          
          {/* Left Audio controller suite with real synthesized loop */}
          <div className="flex-1 w-full xl:max-w-2xl">
            <AudioPlayer themeColor={themeColor} />
          </div>

          {/* Right statuses info and system time indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono text-slate-400">
            
            {/* Status Item: Offline AI */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950 border border-white/5">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Offline AI:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                Ready
              </span>
            </div>

            {/* Status Item: No Internet */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950 border border-white/5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>No Internet:</span>
              <span className="text-emerald-400 font-bold">All Systems Go</span>
            </div>

            {/* Simulated Live Clock matching design exactly */}
            <div className="flex flex-col text-right pl-3 border-l border-white/10">
              <span className="text-white font-bold leading-none text-xs">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

          </div>

        </div>
      </footer>

      {/* FULL COMMAND PALETTE POP-UP (CTRL+K OVERLAY) */}
      {showSearchPalette && (
        <div className="fixed inset-0 bg-[#000000b0] backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-xl bg-[#060613] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <Search className="w-5 h-5 text-purple-400" />
              <input 
                type="text"
                placeholder="Search portal panels, features, or system commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 font-medium"
                autoFocus
              />
              <button 
                onClick={() => setShowSearchPalette(false)}
                className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-[320px] overflow-y-auto">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 px-3 py-2 font-bold select-none">
                Available Portal Systems
              </div>
              <div className="space-y-0.5">
                {QUICK_ACCESS.filter(item => 
                  item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.desc.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setShowSearchPalette(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-purple-500/15 border border-purple-500/20">
                          <Icon className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{item.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono">/open</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-white/10 bg-slate-950/80 text-[10px] text-slate-500 font-mono flex justify-between items-center select-none">
              <span>Press <kbd className="text-slate-400">ESC</kbd> to close</span>
              <span>Use arrows to navigate</span>
            </div>
          </div>
        </div>
      )}

      {/* INJECT ANIMATION STYLES */}
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-110%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110%); opacity: 0; }
        }
        @keyframes custom-pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) scale(1.05); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-2px, -1px) scale(1.05); }
          20%, 40%, 60%, 80% { transform: translate(2px, 1px) scale(1.05); }
        }
        .animate-scanline {
          animation: scanline 2.5s linear infinite;
        }
        .animate-custom-pulse {
          animation: custom-pulse 1.8s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.3s linear infinite;
        }
      `}</style>

      {/* FLOATING CLASSIC HARDWARE HOME BUTTON - 1S HOLD TO ENGAGE LOCAL AI */}
      <div className={`fixed bottom-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none transition-all duration-300 ${
        isScanning ? 'opacity-100' : 'opacity-10 hover:opacity-100 focus-within:opacity-100'
      }`}>
        
        <button
          id="portal-fingerprint-button"
          onMouseDown={handleScanStart}
          onMouseUp={handleScanEnd}
          onMouseLeave={handleScanEnd}
          onTouchStart={handleScanStart}
          onTouchEnd={handleScanEnd}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer bg-white/70 border border-slate-300/40 shadow-lg backdrop-blur-md hover:border-slate-400 hover:bg-white active:scale-95"
          title="Hold 1 second for AI, Click for Home"
        >
          {/* Inner classic home button circle */}
          <div className="w-8.5 h-8.5 rounded-full border border-slate-200/50 flex items-center justify-center bg-slate-50/50 shadow-inner">
            <Home 
              className={`w-4.5 h-4.5 transition-colors duration-300 ${
                isScanning ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            />
          </div>
        </button>
      </div>

      {/* CONDITIONALLY RENDERED COGNITIVE DECOY AI MAINFRAME CHATBOT OVERLAY */}
      {showDecoyAi && (
        <div className="fixed inset-0 bg-[#000000bd] backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-lg bg-[#03030c] border border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col h-[520px] max-h-full animate-[fadeIn_0.3s_ease-out] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Holographic scan overlay details */}
            <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

            {/* Modal Header */}
            <div className="p-4 bg-[#050512] border-b border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400 font-mono">
                    [COGNITIVE DECOY UNIT ENGAGED]
                  </span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">
                    offline on-device hardware sandbox
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowDecoyAi(false)}
                className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                title="Close Offline AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal Main Chat Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px] text-left scrollbar-thin">
              {decoyHistory.map((msg, idx) => (
                <div key={idx} className="space-y-1">
                  {msg.role === 'system' && (
                    <div className="text-slate-500 whitespace-pre-wrap py-1.5 border-b border-white/[0.02]">
                      {msg.content}
                    </div>
                  )}
                  {msg.role === 'ai' && (
                    <div className="bg-cyan-950/10 border border-cyan-500/10 rounded-xl p-3 text-cyan-300 whitespace-pre-wrap leading-relaxed shadow-sm">
                      <div className="text-[9px] text-cyan-500/70 uppercase tracking-widest font-bold mb-1">
                        &gt; DECOY_AI_CORE
                      </div>
                      {msg.content}
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="bg-purple-950/20 border border-purple-500/10 rounded-xl p-3 text-purple-200 whitespace-pre-wrap leading-relaxed ml-6 shadow-sm">
                      <div className="text-[9px] text-purple-400/70 uppercase tracking-widest font-bold mb-1">
                        &gt; OPERATOR_TREY
                      </div>
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
              {isDecoyTyping && (
                <div className="text-cyan-400 animate-pulse flex items-center gap-1">
                  <span>&gt; DECOY_AI is calculating response matrix</span>
                  <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse" />
                </div>
              )}
              <div ref={decoyBottomRef} />
            </div>

            {/* Quick Micro Diagnostic Triggers */}
            <div className="px-4 py-2 border-t border-white/[0.04] bg-slate-950/50 flex flex-wrap gap-1.5 z-10 select-none">
              <button 
                type="button"
                onClick={() => handleSendDecoyMessage(undefined, "Run biometric diagnostics")}
                className="px-2 py-1 rounded bg-[#07131a] border border-cyan-500/20 text-cyan-400 hover:text-white hover:border-cyan-400/40 text-[9px] font-mono cursor-pointer transition-colors"
              >
                [DIAGNOSTICS]
              </button>
              <button 
                type="button"
                onClick={() => handleSendDecoyMessage(undefined, "Query core temperature")}
                className="px-2 py-1 rounded bg-[#07131a] border border-cyan-500/20 text-cyan-400 hover:text-white hover:border-cyan-400/40 text-[9px] font-mono cursor-pointer transition-colors"
              >
                [TEMPERATURE]
              </button>
              <button 
                type="button"
                onClick={() => handleSendDecoyMessage(undefined, "Bypass security firewall")}
                className="px-2 py-1 rounded bg-[#07131a] border border-cyan-500/20 text-cyan-400 hover:text-white hover:border-cyan-400/40 text-[9px] font-mono cursor-pointer transition-colors"
              >
                [FIREWALL BYPASS]
              </button>
              <button 
                type="button"
                onClick={() => handleSendDecoyMessage(undefined, "Analyze mainframe integrity")}
                className="px-2 py-1 rounded bg-[#07131a] border border-cyan-500/20 text-cyan-400 hover:text-white hover:border-cyan-400/40 text-[9px] font-mono cursor-pointer transition-colors"
              >
                [MAINFRAME COGNITION]
              </button>
            </div>

            {/* Terminal Input block */}
            <form onSubmit={(e) => handleSendDecoyMessage(e)} className="p-3 bg-slate-950 border-t border-white/5 flex gap-2 z-10">
              <input 
                type="text"
                placeholder="Submit query payload command..."
                value={decoyInput}
                onChange={(e) => setDecoyInput(e.target.value)}
                disabled={isDecoyTyping}
                className="flex-1 bg-slate-900 border border-cyan-500/20 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs font-mono text-cyan-100 placeholder-slate-600 focus:outline-none"
              />
              <button 
                type="submit"
                disabled={isDecoyTyping || !decoyInput.trim()}
                className="px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-black font-mono rounded-lg text-xs tracking-wider transition-all"
              >
                EXEC
              </button>
            </form>

            {/* Bottom micro status */}
            <div className="p-2 bg-slate-950/80 border-t border-white/[0.04] text-[8px] text-slate-600 font-mono flex justify-between select-none">
              <span>LOCAL_CACHE_CONNECTED // OK</span>
              <span>HOST: PORTAL_COGNITIVE_AUX</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
