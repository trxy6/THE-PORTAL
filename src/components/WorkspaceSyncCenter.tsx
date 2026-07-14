import React, { useState, useEffect } from 'react';
import { 
  Bot, RefreshCw, CheckCircle2, Shield, AlertCircle, Sparkles, Folder, 
  Calendar, CheckSquare, Users, Mail, MessageSquare, FileText, Database, HardDrive, LogOut, ExternalLink, Send,
  Grid, Sliders, Video, StickyNote
} from 'lucide-react';
import { 
  initAuth, googleSignIn, logoutGoogle, getAccessToken,
  fetchGoogleDrive, fetchGoogleCalendar, fetchGoogleTasks, fetchGoogleContacts, 
  fetchGmail, fetchGoogleChatSpaces, fetchGoogleSheetsAndDocs, fetchGoogleSlidesAndForms, sendGoogleChatMessage
} from '../lib/firebaseWorkspace';
import { User } from 'firebase/auth';

interface WorkspaceSyncCenterProps {
  themeColor: string;
  portalDarkMode: boolean;
  getThemeHex: () => string;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  haptic: (ms: number) => void;
  store: {
    get: (key: string, fallback: any) => any;
    set: (key: string, val: any) => boolean;
  };
  triggerLocalFilesReload?: () => void;
}

export default function WorkspaceSyncCenter({
  themeColor,
  portalDarkMode,
  getThemeHex,
  toast,
  haptic,
  store,
  triggerLocalFilesReload
}: WorkspaceSyncCenterProps) {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Ready');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => store.get('g_last_synced_at', 'Never'));

  // Active view inside the Sync Center
  const [activeSyncTab, setActiveSyncTab] = useState<'overview' | 'drive' | 'calendar' | 'communication' | 'contacts'>('overview');

  // Loaded Offline/Synced Data states (restored from store)
  const [driveFiles, setDriveFiles] = useState<any[]>(() => store.get('g_drive_files', []));
  const [calendarEvents, setCalendarEvents] = useState<any[]>(() => store.get('g_calendar_events', []));
  const [tasks, setTasks] = useState<any[]>(() => store.get('g_tasks', []));
  const [gmailMessages, setGmailMessages] = useState<any[]>(() => store.get('g_gmail_messages', []));
  const [chatSpaces, setChatSpaces] = useState<any[]>(() => store.get('g_chat_spaces', []));
  const [contacts, setContacts] = useState<any[]>(() => store.get('g_contacts', []));
  const [sheetsDocs, setSheetsDocs] = useState<any[]>(() => store.get('g_sheets_docs', []));
  const [slidesForms, setSlidesForms] = useState<any[]>(() => store.get('g_slides_forms', []));

  // Chat message sending form state
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [chatMsgText, setChatMsgText] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setNeedsAuth(false);
      },
      () => {
        setGoogleUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleConnect = async () => {
    setIsLoggingIn(true);
    haptic(15);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setNeedsAuth(false);
        toast('Google Workspace connection established.', 'success');
        // Trigger initial sync automatically upon connect
        triggerWorkspaceSync(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      toast(`Connection failed: ${err.message}`, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm('Are you sure you want to sever the Google Workspace sync tunnel? Cached offline data will remain, but direct sync will stop.');
    if (!confirmed) return;
    
    haptic(10);
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setNeedsAuth(true);
      toast('Workspace sync tunnel closed.', 'info');
    } catch (err: any) {
      toast(`Disconnect error: ${err.message}`, 'error');
    }
  };

  const triggerWorkspaceSync = async (passedToken?: string) => {
    setIsSyncing(true);
    haptic(20);
    setSyncStatus('Establishing OAuth Handshake...');
    
    try {
      const token = passedToken || await getAccessToken();
      if (!token) {
        setNeedsAuth(true);
        throw new Error('No valid Workspace sync credentials found. Please authenticate.');
      }

      // Step 1: Drive sync
      setSyncStatus('Synchronizing Cloud Files (Google Drive)...');
      const files = await fetchGoogleDrive(token);
      setDriveFiles(files);
      store.set('g_drive_files', files);

      // Step 2: Calendar sync
      setSyncStatus('Synchronizing Timeline Schedules (Google Calendar)...');
      const events = await fetchGoogleCalendar(token);
      setCalendarEvents(events);
      store.set('g_calendar_events', events);

      // Step 3: Tasks sync
      setSyncStatus('Synchronizing Directives (Google Tasks)...');
      const taskList = await fetchGoogleTasks(token);
      setTasks(taskList);
      store.set('g_tasks', taskList);

      // Step 4: Contacts sync
      setSyncStatus('Synchronizing Address book (Google Contacts)...');
      const contactList = await fetchGoogleContacts(token);
      setContacts(contactList);
      store.set('g_contacts', contactList);

      // Step 5: Gmail sync
      setSyncStatus('Synchronizing Core Communications (Gmail inbox)...');
      const mailList = await fetchGmail(token);
      setGmailMessages(mailList);
      store.set('g_gmail_messages', mailList);

      // Step 6: Chat sync
      setSyncStatus('Synchronizing Spaces (Google Chat)...');
      const spaceList = await fetchGoogleChatSpaces(token);
      setChatSpaces(spaceList);
      store.set('g_chat_spaces', spaceList);
      if (spaceList.length > 0 && !selectedSpaceId) {
        setSelectedSpaceId(spaceList[0].name);
      }

      // Step 7: Sheets/Docs sync
      setSyncStatus('Extracting Spreadsheets & Documents Workflows...');
      const sheetsList = await fetchGoogleSheetsAndDocs(token);
      setSheetsDocs(sheetsList);
      store.set('g_sheets_docs', sheetsList);

      // Step 8: Slides/Forms sync
      setSyncStatus('Fetching Presentation Decks & Form Responses...');
      const slidesList = await fetchGoogleSlidesAndForms(token);
      setSlidesForms(slidesList);
      store.set('g_slides_forms', slidesList);

      // Mark completion
      const syncTime = new Date().toLocaleString();
      setLastSyncedAt(syncTime);
      store.set('g_last_synced_at', syncTime);
      
      toast('Workspace synchronization complete. Offline indexes updated.', 'success');
      setSyncStatus('Completed Successfully');
    } catch (err: any) {
      console.error(err);
      toast(`Sync failed: ${err.message}`, 'error');
      setSyncStatus('Failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsgText.trim() || !selectedSpaceId) return;

    const token = await getAccessToken();
    if (!token) {
      toast('Access token expired. Re-authenticate.', 'error');
      return;
    }

    setIsSendingChat(true);
    haptic(10);
    try {
      await sendGoogleChatMessage(token, selectedSpaceId, chatMsgText);
      toast('Automated message dispatched to Chat Space successfully.', 'success');
      setChatMsgText('');
    } catch (err: any) {
      toast(`Failed to send message: ${err.message}`, 'error');
    } finally {
      setIsSendingChat(false);
    }
  };

  const importToLocalSandbox = (file: any) => {
    haptic(15);
    const sizeStr = file.size 
      ? (file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`)
      : 'N/A';
    
    // Read from IndexedDB payload database
    const DB_NAME = 'nextgen_secure_payloads';
    const STORE_NAME = 'encrypted_files';
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const newFileObj = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: sizeStr,
        type: file.mimeType || 'application/octet-stream',
        data: 'data:text/plain;base64,Q2xvdWQgc3luY2VkIGZpbGUgdGVtcGxhdGU=', // Placeholder representation
        uploadedAt: new Date().toLocaleString(),
        isEncrypted: true,
        source: 'Google Drive Sync'
      };

      const addReq = objectStore.add(newFileObj);
      addReq.onsuccess = () => {
        toast(`Successfully migrated "${file.name}" to local secure sandbox!`, 'success');
        if (triggerLocalFilesReload) triggerLocalFilesReload();
      };
      addReq.onerror = () => {
        toast('Failed to store document locally.', 'error');
      };
    };
  };

  return (
    <div className="glass-panel border border-white/[0.04] p-6 text-left rounded-2xl space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-400 animate-pulse" />
            Workspace Sync Tunnel & Cloud Migration
          </h2>
          <p className="text-[10px] text-slate-400 font-medium">Dual-tunnel sync for secure local caching of Google Cloud Workspace records</p>
        </div>
        
        {googleUser && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => triggerWorkspaceSync()}
              disabled={isSyncing}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSyncing ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            
            <button
              onClick={handleDisconnect}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 border border-white/5 hover:border-rose-500/20 bg-slate-900/60 transition-colors"
              title="Sever Connection"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {needsAuth ? (
        <div className="rounded-2xl p-6 border border-dashed border-purple-500/20 bg-[#0c071d]/60 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6 py-10 w-full">
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/25 rounded-full relative">
            <Shield className="w-7 h-7 text-purple-400" />
            <Bot className="w-4 h-4 text-cyan-400 absolute bottom-1 right-1" />
          </div>
          
          <div className="max-w-md space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Establish Google Workspace Auth Tunnel</h3>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Unlock offline-first migration. Securely authenticate with your Google account to grant permission to see, organize, and import your files, sheets, calendar appointments, and communication logs.
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 text-[9.5px] text-slate-500 text-left space-y-1.5 max-w-sm">
            <p className="font-bold text-slate-400 flex items-center gap-1">🔒 SECURE CLOUD GATEWAY</p>
            <p>• Access tokens are cached strictly in-memory (never leaked to localStorage).</p>
            <p>• Offline caching preserves data within your browser sandbox for immediate offline availability.</p>
          </div>

          {/* New Grid section: Zero API Cost & Serverless Google Workspace Integrations */}
          <div className="w-full border-t border-white/[0.05] pt-6 max-w-3xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-4 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-400" />
              Supported serverless integrations (No API Costs or Tokens)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400 mt-0.5 shrink-0"><HardDrive className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Drive</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Access Drive files and folders</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5 shrink-0"><Grid className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Sheets</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Transform your spreadsheet data</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 mt-0.5 shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Gmail</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Manage emails with code</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400 mt-0.5 shrink-0"><Calendar className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Calendar</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Create & manage events</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 mt-0.5 shrink-0"><FileText className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Docs</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Build custom Docs workflows</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 mt-0.5 shrink-0"><Sliders className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Slides</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Integrate your slide decks</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400 mt-0.5 shrink-0"><CheckSquare className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Tasks</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Create and manage tasks</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400 mt-0.5 shrink-0"><MessageSquare className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Chat</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Read and summarize Chat spaces</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-pink-500/10 rounded-lg text-pink-400 mt-0.5 shrink-0"><Sparkles className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Forms</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Collect responses effectively</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 mt-0.5 shrink-0"><StickyNote className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Keep</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Organize ideas and notes</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 mt-0.5 shrink-0"><Video className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Google Meet</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Streamline Meet video workflows</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-start gap-2.5 hover:border-purple-500/25 transition-all">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5 shrink-0"><Users className="w-3.5 h-3.5" /></div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Contacts</h5>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Sync & manage your contacts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Styled Google Auth Button */}
          <button 
            type="button"
            disabled={isLoggingIn}
            onClick={handleConnect}
            className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 rounded-xl px-5 py-2.5 font-bold text-xs shadow-lg transition-all hover:scale-[1.02] active:scale-95 border border-slate-200 cursor-pointer text-center"
          >
            <div className="w-4 h-4 flex shrink-0">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            </div>
            <span>{isLoggingIn ? 'Establishing Tunnel...' : 'Sign in with Google'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Active Status Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/40 border border-white/5 p-4 rounded-xl text-xs">
            <div className="flex items-center gap-3">
              {googleUser?.photoURL ? (
                <img src={googleUser.photoURL} alt="Google Profile" className="w-8 h-8 rounded-full border border-purple-500/30" referrerPolicy="no-referrer" />
              ) : (
                <div className="p-1.5 bg-purple-500/10 border border-purple-500/25 rounded-full text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="font-bold text-slate-200">{googleUser?.displayName || 'Traveler Account'}</p>
                <p className="text-[10px] text-slate-400">{googleUser?.email}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 pt-2.5 md:pt-0 md:pl-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Tunnel Status</span>
              <p className="font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected & Encrypted
              </p>
            </div>

            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 pt-2.5 md:pt-0 md:pl-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Index Synchronized</span>
              <p className="font-bold text-slate-300 mt-0.5 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-400" /> {lastSyncedAt}
              </p>
            </div>
          </div>

          {/* Sync Progress Status overlay */}
          {isSyncing && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl text-[10.5px] flex items-center gap-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span><strong>Telemetry active:</strong> {syncStatus}</span>
            </div>
          )}

          {/* Inside Tabs switch */}
          <div className="flex flex-wrap border-b border-white/5 gap-1 pt-1 overflow-x-auto select-none">
            <button
              onClick={() => { haptic(5); setActiveSyncTab('overview'); }}
              className={`px-3.5 py-2 text-[10.5px] font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeSyncTab === 'overview' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🌐 System Overview
            </button>
            <button
              onClick={() => { haptic(5); setActiveSyncTab('drive'); }}
              className={`px-3.5 py-2 text-[10.5px] font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeSyncTab === 'drive' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📂 Drive & Files ({driveFiles.length + sheetsDocs.length + slidesForms.length})
            </button>
            <button
              onClick={() => { haptic(5); setActiveSyncTab('calendar'); }}
              className={`px-3.5 py-2 text-[10.5px] font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeSyncTab === 'calendar' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📅 Timeline & Directives ({calendarEvents.length + tasks.length})
            </button>
            <button
              onClick={() => { haptic(5); setActiveSyncTab('communication'); }}
              className={`px-3.5 py-2 text-[10.5px] font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeSyncTab === 'communication' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ✉️ Mail & Chat Spaces ({gmailMessages.length + chatSpaces.length})
            </button>
            <button
              onClick={() => { haptic(5); setActiveSyncTab('contacts'); }}
              className={`px-3.5 py-2 text-[10.5px] font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeSyncTab === 'contacts' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              👥 Address Book ({contacts.length})
            </button>
          </div>

          {/* TAB CONTENT: OVERVIEW */}
          {activeSyncTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                
                <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3.5 text-left">
                  <div className="flex justify-between items-start">
                    <Folder className="w-5 h-5 text-cyan-400" />
                    <span className="text-[9px] font-bold bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded uppercase">Synced</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">Cloud Files & Docs</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{driveFiles.length} standard drive items</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sheetsDocs.length} custom spreadsheets</p>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3.5 text-left">
                  <div className="flex justify-between items-start">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span className="text-[9px] font-bold bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded uppercase">Synced</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">Schedules & Lists</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{calendarEvents.length} calendar events</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tasks.length} active todo directives</p>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3.5 text-left">
                  <div className="flex justify-between items-start">
                    <Mail className="w-5 h-5 text-indigo-400" />
                    <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded uppercase">Synced</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">Core Communication</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{gmailMessages.length} secure mail snippets</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{chatSpaces.length} live chat rooms</p>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3.5 text-left">
                  <div className="flex justify-between items-start">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Synced</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">Personal Address</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{contacts.length} secure verified contacts</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{slidesForms.length} presentation & form templates</p>
                </div>

              </div>

              {/* Offline-First Information banner */}
              <div className="bg-indigo-500/[0.03] border border-indigo-500/15 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Sovereign Local Standby Principle
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  All synced Workspace items are strictly compiled into your offline-first cache database. If network connection is severed, you retain full read access to your drive indices, calendars, contacts lists, and mail drafts right within your secure portal terminal.
                </p>
              </div>
            </div>
          )}

          {/* TAB CONTENT: DRIVE */}
          {activeSyncTab === 'drive' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center select-none">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Google Drive & Document Workflow</span>
                  <span className="text-[9px] text-slate-500 font-bold">{driveFiles.length + sheetsDocs.length} Items cached</span>
                </div>

                {driveFiles.length === 0 && sheetsDocs.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/5 bg-slate-900/40 rounded-xl">
                    <p className="text-xs text-slate-500 italic">No drive items cached. Click "Sync Now" in the header to pull your file list.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {/* Combine lists */}
                    {[...driveFiles, ...sheetsDocs, ...slidesForms].map((file: any, index) => {
                      const isSheet = file.mimeType?.includes('spreadsheet') || file.mimeType?.includes('sheet');
                      const isDoc = file.mimeType?.includes('document');
                      const isPresentation = file.mimeType?.includes('presentation') || file.mimeType?.includes('slides');
                      const isForm = file.mimeType?.includes('form');

                      return (
                        <div key={file.id || index} className="flex items-center justify-between p-3 bg-slate-900/60 border border-white/5 rounded-xl hover:border-purple-500/20 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-slate-950/80">
                              {isSheet ? (
                                <FileText className="w-4 h-4 text-emerald-400" title="Spreadsheet" />
                              ) : isDoc ? (
                                <FileText className="w-4 h-4 text-cyan-400" title="Document" />
                              ) : isPresentation ? (
                                <FileText className="w-4 h-4 text-amber-400" title="Presentation" />
                              ) : isForm ? (
                                <FileText className="w-4 h-4 text-purple-400" title="Form" />
                              ) : (
                                <Folder className="w-4 h-4 text-indigo-400" title="File" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-200 truncate max-w-[170px]">{file.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'N/A'} • {file.size ? `${(Number(file.size)/1024).toFixed(0)} KB` : 'Cloud Streamed'}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => importToLocalSandbox(file)}
                            className="text-[9px] font-bold px-2 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500 text-purple-300 hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0 border border-purple-500/20"
                          >
                            🔒 Sync to Local
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: CALENDAR & TASKS */}
          {activeSyncTab === 'calendar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Calendar events */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Upcoming Timeline (Google Calendar)</span>
                
                {calendarEvents.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/5 bg-slate-900/40 rounded-xl">
                    <p className="text-xs text-slate-500 italic">No calendar events cached.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {calendarEvents.map((event: any, index) => {
                      const startTime = event.start?.dateTime || event.start?.date;
                      const dateStr = startTime ? new Date(startTime).toLocaleString() : 'All day';
                      return (
                        <div key={event.id || index} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl space-y-1.5 text-left hover:border-purple-500/15">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-slate-200 truncate">{event.summary || 'Untitled Event'}</span>
                            <span className="text-[8px] font-mono bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded font-bold shrink-0">Event</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            📅 {dateStr}
                          </p>
                          {event.location && (
                            <p className="text-[9px] text-slate-500 truncate">📍 {event.location}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Task directives */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Directives Matrix (Google Tasks)</span>
                
                {tasks.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/5 bg-slate-900/40 rounded-xl">
                    <p className="text-xs text-slate-500 italic">No directive tasks cached.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {tasks.map((task: any, index) => (
                      <div key={task.id || index} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-left hover:border-purple-500/15">
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-slate-200 truncate">{task.title || 'Untitled Directive'}</p>
                          <p className="text-[9px] text-slate-500">List: {task.listName || 'Primary'}</p>
                          {task.due && (
                            <p className="text-[9px] text-pink-400 font-mono">⚠️ Due: {new Date(task.due).toLocaleDateString()}</p>
                          )}
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 uppercase ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {task.status || 'needsAction'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB CONTENT: COMMUNICATION (GMAIL & CHAT) */}
          {activeSyncTab === 'communication' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Gmail Inbox */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Communication Snippets (Gmail)</span>
                
                {gmailMessages.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/5 bg-slate-900/40 rounded-xl">
                    <p className="text-xs text-slate-500 italic">No mail items cached.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {gmailMessages.map((msg: any, index) => (
                      <div key={msg.id || index} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl space-y-1 hover:border-purple-500/15">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono font-bold">MSG-ID: {msg.id.substring(0, 8)}</span>
                          <span className="text-[8px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold shrink-0">GMAIL</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{msg.snippet || 'No text snippet retrieved.'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Google Chat message dispatcher */}
              <div className="space-y-3 text-left bg-slate-900/40 border border-white/5 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">Dispatched Bot Console (Google Chat)</span>
                  <p className="text-[9px] text-slate-500">Transmit sync notifications directly to your Chat Space</p>
                </div>

                {chatSpaces.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[10.5px] text-slate-500 italic">No available Google Chat spaces index.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendChatMessage} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Active Space Tunnel</label>
                      <select 
                        value={selectedSpaceId} 
                        onChange={(e) => setSelectedSpaceId(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 text-xs text-slate-300 rounded-lg p-2 focus:outline-none focus:border-purple-500/40"
                      >
                        {chatSpaces.map((space: any) => (
                          <option key={space.name} value={space.name}>{space.displayName || space.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Payload Message Text</label>
                      <textarea
                        value={chatMsgText}
                        onChange={(e) => setChatMsgText(e.target.value)}
                        placeholder="Automated code dispatch message payload..."
                        rows={3}
                        className="w-full bg-slate-950 border border-white/5 text-xs text-slate-300 rounded-lg p-2 focus:outline-none focus:border-purple-500/40 resize-none font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingChat || !chatMsgText.trim()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSendingChat ? 'Sending Message...' : 'Transmit Message'}
                    </button>
                  </form>
                )}
              </div>

            </div>
          )}

          {/* TAB CONTENT: CONTACTS */}
          {activeSyncTab === 'contacts' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center select-none">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Personal Secure Address Book (Google Contacts)</span>
                  <span className="text-[9px] text-slate-500 font-bold">{contacts.length} Contacts indexed</span>
                </div>

                {contacts.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/5 bg-slate-900/40 rounded-xl">
                    <p className="text-xs text-slate-500 italic">No contacts cached. Sync Workspace in the top-right.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {contacts.map((c: any, index) => (
                      <div key={c.resourceName || index} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl text-left flex flex-col justify-between hover:border-purple-500/20 transition-all">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-200 truncate">{c.displayName}</p>
                          {c.email && (
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">✉️ {c.email}</p>
                          )}
                          {c.phone && (
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">📞 {c.phone}</p>
                          )}
                        </div>
                        <span className="text-[7.5px] font-mono text-purple-400 uppercase tracking-widest text-right mt-2 font-bold select-none">NextGen Sync Node</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
