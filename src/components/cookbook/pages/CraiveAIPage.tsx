
import React, { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { GoogleGenAI, type Chat, type LiveSession, type LiveServerMessage, Modality, type Blob } from '@google/genai';
import { SendIcon, MicIcon, StopIcon } from '../components/Icons';
import { generatePersonalizedWelcome, generateSpeech } from '../services/geminiService';
import type { Suggestion, User } from '../types';
import { CategoryBubble } from '../components/CategoryBubble';
import { SuggestionCard } from '../components/SuggestionCard';
import { CraiveScopeCard } from '../components/CraiveScopeCard';
import { SearchIcon, SushiIcon, TacosIcon, DessertIcon, SurpriseIcon } from '../components/Icons';

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

interface Message {
    role: 'user' | 'model';
    content: string;
    groundingChunks?: any[];
}

const categories = [
    { name: 'Sushi', icon: <SushiIcon />, prompt: 'Creative sushi roll ideas' },
    { name: 'Tacos', icon: <TacosIcon />, prompt: 'Unique taco fillings' },
    { name: 'Dessert', icon: <DessertIcon />, prompt: 'Decadent dessert recipes' },
    { name: 'Surprise Me', icon: <SurpriseIcon />, prompt: 'A surprising and delicious meal' },
];

interface CraiveAIPageProps {
    user: User | null;
    setActiveTab: (tab: string) => void;
    isFirstLogin: boolean;
    onWelcomeMessageShown: () => void;
    isMilaVoiceEnabled: boolean;
}

export const CraiveAIPage: React.FC<CraiveAIPageProps> = ({ user, setActiveTab, isFirstLogin, onWelcomeMessageShown, isMilaVoiceEnabled }) => {
    const [view, setView] = useState<'discovery' | 'chat'>('discovery');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // --- Chat State ---
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Live Session State ---
    const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputAudioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextAudioStartTime = useRef(0);
    
    // --- TTS Audio State ---
    const ttsAudioContextRef = useRef<AudioContext | null>(null);
    const ttsAudioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextTtsAudioStartTime = useRef(0);


    // --- Discovery State (Legacy - kept for initial view) ---
    const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [discoveryError, setDiscoveryError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [greeting, setGreeting] = useState("Hi there! I'm Mila. What are you hungry for?");
    const [lastQuery, setLastQuery] = useState('');

    useEffect(() => {
        const getGeoLocation = async () => {
            navigator.geolocation.getCurrentPosition(
                (position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
                async (error) => {
                    console.log("Browser geolocation failed or blocked, fetching free IP-based location fallback...");
                    try {
                        const res = await fetch('https://ip-api.com/json');
                        if (res.ok) {
                            const data = await res.json();
                            if (data && typeof data.lat === 'number' && typeof data.lon === 'number') {
                                setLocation({ latitude: data.lat, longitude: data.lon });
                                console.log(`Free IP geolocation succeeded: ${data.city || 'Unknown City'}`);
                                return;
                            }
                        }
                    } catch (e) {
                        console.error("Free IP geolocation API also failed:", e);
                    }
                    // Final default fallback
                    setLocation({ latitude: 37.7749, longitude: -122.4194 });
                },
                { timeout: 5000 }
            );
        };
        getGeoLocation();
    }, []);
    
    const stopAllTts = useCallback(() => {
        if (ttsAudioContextRef.current) {
            ttsAudioSources.current.forEach(source => {
                try {
                    source.stop();
                } catch (e) {
                    // Source may have already stopped.
                }
            });
            ttsAudioSources.current.clear();
            nextTtsAudioStartTime.current = ttsAudioContextRef.current.currentTime;
        }
    }, []);

    useEffect(() => {
        if (!isMilaVoiceEnabled) {
            stopAllTts();
        }
    }, [isMilaVoiceEnabled, stopAllTts]);

    // Initialize TTS Audio Context
    useEffect(() => {
        // FIX: Cast window to any for webkitAudioContext compatibility.
        ttsAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        return () => {
            ttsAudioContextRef.current?.close();
            ttsAudioSources.current.forEach(source => source.stop());
            ttsAudioSources.current.clear();
        }
    }, []);

    const playTextAsSpeech = useCallback(async (text: string) => {
        if (!text || !ttsAudioContextRef.current) return;
        
        stopAllTts();

        try {
            const base64Audio = await generateSpeech(text);
            if (base64Audio) {
                const ttsCtx = ttsAudioContextRef.current;
                nextTtsAudioStartTime.current = Math.max(nextTtsAudioStartTime.current, ttsCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ttsCtx, 24000, 1);
                const source = ttsCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ttsCtx.destination);
                source.addEventListener('ended', () => ttsAudioSources.current.delete(source));
                source.start(nextTtsAudioStartTime.current);
                nextTtsAudioStartTime.current += audioBuffer.duration;
                ttsAudioSources.current.add(source);
            }
        } catch (error) {
            console.error("Failed to play text as speech:", error);
        }
    }, [stopAllTts]);


    useEffect(() => {
        try {
            if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const config: any = { 
                systemInstruction: 'You are Mila, a friendly, warm, and creative AI flavor guide. Your personality is encouraging and knowledgeable about all things food. If a user asks for restaurants, places to eat, or anything location-based, use your tools to find real places and provide links. Keep your responses concise, conversational, and focused on food cravings and suggestions.',
            };
            if (location) {
                config.tools = [{ googleMaps: {} }];
                config.toolConfig = { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } };
            }
            const newChat = ai.chats.create({ model: 'gemini-2.5-flash', config });
            setChat(newChat);
        } catch (e) {
            console.error(e);
            setChatError("I'm having a little trouble connecting right now.");
        }
    }, [location]);
    
    useEffect(() => {
        const initializeChat = async () => {
            if (isFirstLogin && user) {
                setView('chat');
                setIsChatLoading(true);
                setChatError(null);
                try {
                    const welcomeMessageContent = await generatePersonalizedWelcome(user);
                    setMessages([{ role: 'model', content: welcomeMessageContent }]);
                    if (isMilaVoiceEnabled) playTextAsSpeech(welcomeMessageContent);
                } catch (err) {
                    console.error("Failed to generate personalized welcome:", err);
                    const fallbackMessage = `Hey ${user.name || 'there'}! Welcome to Craive. ✨\n\nI've got all your preferences saved and I'm ready to help. So, what's on your mind?`;
                    setMessages([{ role: 'model', content: fallbackMessage }]);
                    if (isMilaVoiceEnabled) playTextAsSpeech(fallbackMessage);
                } finally {
                    setIsChatLoading(false);
                    onWelcomeMessageShown();
                }
            } else if (messages.length === 0) {
                 setMessages([{ role: 'model', content: "Hello! What food are you dreaming of today? Let's find something delicious together!" }]);
            }
        };
        if (chat) initializeChat();
    }, [isFirstLogin, user, onWelcomeMessageShown, chat, playTextAsSpeech, isMilaVoiceEnabled]);

    useEffect(() => {
        if (view === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatLoading, isLiveSessionActive, view]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isChatLoading || !chat) return;

        const userMessage: Message = { role: 'user', content: userInput };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = userInput;
        setUserInput('');
        setIsChatLoading(true);
        setChatError(null);

        try {
            const response = await chat.sendMessage({ message: currentInput });
            const modelMessage: Message = { 
                role: 'model', 
                content: response.text,
                groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
            };
            setMessages(prev => [...prev, modelMessage]);
            if (isMilaVoiceEnabled) playTextAsSpeech(response.text);
        } catch (err) {
            console.error(err);
            const errorMessage = "Oops, I got a bit tongue-tied. Could you try asking that again?";
            setChatError(errorMessage);
            if (isMilaVoiceEnabled) playTextAsSpeech(errorMessage);
        } finally {
            setIsChatLoading(false);
        }
    };
    
    // --- Live Session Logic ---
    const stopLiveSession = useCallback(() => {
        console.log("Stopping live session...");
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
    
        audioStreamRef.current?.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
    
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;

        inputAudioContextRef.current?.close();
        inputAudioContextRef.current = null;
    
        outputAudioContextRef.current?.close();
        outputAudioContextRef.current = null;

        outputAudioSources.current.forEach(source => source.stop());
        outputAudioSources.current.clear();
        nextAudioStartTime.current = 0;

        setIsLiveSessionActive(false);
    }, []);

    const startLiveSession = useCallback(async () => {
        setIsLiveSessionActive(true);
        setChatError(null);
        setMessages(prev => [...prev, {role: 'user', content: ''}]); // Add empty bubble for user transcription

        try {
            if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;

            // FIX: Cast window to any to allow for webkitAudioContext for older browser compatibility.
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            // FIX: Cast window to any to allow for webkitAudioContext for older browser compatibility.
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            const outputCtx = outputAudioContextRef.current!;
                            nextAudioStartTime.current = Math.max(nextAudioStartTime.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            source.addEventListener('ended', () => outputAudioSources.current.delete(source));
                            source.start(nextAudioStartTime.current);
                            nextAudioStartTime.current += audioBuffer.duration;
                            outputAudioSources.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                           outputAudioSources.current.forEach(s => s.stop());
                           outputAudioSources.current.clear();
                           nextAudioStartTime.current = 0;
                        }

                        if (message.serverContent?.inputTranscription || message.serverContent?.outputTranscription) {
                            setMessages(prev => {
                                const newMessages = [...prev];
                                const lastMessage = newMessages[newMessages.length - 1];
                                if (message.serverContent.inputTranscription) {
                                    if (lastMessage?.role === 'user') lastMessage.content += message.serverContent.inputTranscription.text;
                                } else if (message.serverContent.outputTranscription) {
                                    const text = message.serverContent.outputTranscription.text;
                                    if (lastMessage?.role === 'model') lastMessage.content += text;
                                    else newMessages.push({ role: 'model', content: text });
                                }
                                return newMessages;
                            });
                        }
                        if (message.serverContent?.turnComplete) {
                            setMessages(prev => [...prev, {role: 'user', content: ''}]); // New empty bubble for next user turn
                        }
                    },
                    onerror: (e: ErrorEvent) => { 
                        console.error('Live session error:', e);
                        setChatError("There was a connection issue with the voice chat.");
                        stopLiveSession();
                    },
                    onclose: (e: CloseEvent) => { 
                        console.log('Live session closed.');
                        stopLiveSession();
                    },
                },
            });
        } catch (error) {
            console.error('Failed to start live session:', error);
            setChatError("Could not start voice chat. Please ensure microphone permissions are enabled.");
            setIsLiveSessionActive(false);
        }
    }, [stopLiveSession]);
    
    // --- Discovery Logic (Legacy) ---
    const fetchSuggestions = useCallback(async (query: string) => {
        setView('chat'); // Switch to chat view on any search
        setUserInput(query);
        // We can optionally pre-populate the chat with suggestions
    }, []);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); fetchSuggestions(searchTerm); };
    const handleCategoryClick = (prompt: string) => { setSearchTerm(prompt); fetchSuggestions(prompt); };
    const handleFocusSearch = () => { setView('chat'); if (searchTerm) setUserInput(searchTerm); };

    // --- Render Logic ---
    if (view === 'discovery') {
        return (
            <div className="p-6 pb-24 overflow-y-auto h-full">
                <CraiveScopeCard user={user} onNavigate={() => setActiveTab('CraiveMe')} />
                <header className="text-center mb-8 animate-fade-in-up"><h1 className="text-2xl font-bold text-deep-green">{greeting}</h1></header>
                <form onSubmit={handleSearch} className="relative mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={handleFocusSearch} placeholder="Tap here to chat with Mila..." className="w-full pl-12 pr-4 py-3 bg-white/70 border-2 border-gold-light rounded-full text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none transition-shadow duration-300 shadow-sm" />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2"><SearchIcon /></div>
                </form>
                <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">{categories.map((c, i) => (<CategoryBubble key={c.name} label={c.name} icon={c.icon} onClick={() => handleCategoryClick(c.prompt)} style={{ animationDelay: `${0.3 + i * 0.1}s` }} />))}</div></section>
                <section>{isDiscoveryLoading && <div className="text-center py-10"><p className="text-lg font-semibold text-gold animate-pulse">Mila is thinking...</p></div>}{discoveryError && <p className="text-center text-red-500">{discoveryError}</p>}{!isDiscoveryLoading && suggestions.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{suggestions.map((s, i) => (<SuggestionCard key={i} title={s.title} description={s.description} style={{ animationDelay: `${i * 0.1}s` }} />))}</div>)}</section>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto p-6 pb-6 space-y-4">
                {messages.map((msg, index) => {
                    const isEmpty = msg.content.trim() === '';
                    if (msg.role === 'user' && isEmpty && isLiveSessionActive && index === messages.length - 1) {
                         return <div key={index} className={`flex animate-fade-in-up justify-end`}><div className="max-w-xs px-4 py-3 rounded-2xl shadow bg-gold-light rounded-br-none"><div className="h-6 flex items-center"><div className="w-1.5 h-1.5 bg-deep-green/50 rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="w-1.5 h-1.5 bg-deep-green/50 rounded-full animate-pulse [animation-delay:-0.15s] mx-1"></div><div className="w-1.5 h-1.5 bg-deep-green/50 rounded-full animate-pulse"></div></div></div></div>
                    }
                    if (isEmpty && msg.role !== 'user') return null; // Don't render empty model bubbles

                    return (
                        <div key={index} className={`flex animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow ${msg.role === 'user' ? 'bg-gold-light text-deep-green rounded-br-none' : 'bg-white text-deep-green rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                {msg.groundingChunks?.length && (<div className="mt-3 pt-3 border-t border-gold-light/50"><h4 className="text-sm font-bold text-deep-green/80 mb-2">Places I found:</h4><ul className="space-y-1">{msg.groundingChunks.map((chunk, i) => (chunk.maps?.uri && (<li key={i}><a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-gold font-semibold hover:underline flex items-start gap-2"><span>📍</span><span>{chunk.maps.title}</span></a></li>)))}</ul></div>)}
                            </div>
                        </div>
                    );
                })}
                {isChatLoading && (
                     <div className="flex justify-start animate-fade-in-up"><div className="max-w-xs px-4 py-3 rounded-2xl shadow bg-white text-deep-green rounded-bl-none"><div className="flex items-center space-x-2"><span className="h-2 w-2 bg-gold rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="h-2 w-2 bg-gold rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="h-2 w-2 bg-gold rounded-full animate-bounce"></span></div></div></div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="w-full bg-cream border-t border-gold-light/30 shrink-0 mt-auto pb-4">
                {chatError && <p className="text-center text-red-500 px-6 pb-2 text-sm">{chatError}</p>}
                <form onSubmit={handleSendMessage} className="p-4 bg-cream/80 backdrop-blur-sm">
                     <div className="relative max-w-md mx-auto flex items-center gap-2">
                        <div className="relative flex-grow">
                            <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={isLiveSessionActive ? "Listening..." : "Ask Mila about a craving..."} className="w-full pl-4 pr-12 py-3 bg-white border-2 border-gold-light rounded-full text-deep-green placeholder-deep-green/60 focus:ring-2 focus:ring-gold focus:outline-none transition-all duration-300 shadow-sm" disabled={isChatLoading || isLiveSessionActive} autoFocus />
                            <button type="submit" disabled={isChatLoading || !userInput.trim() || isLiveSessionActive} className="absolute right-2 top-1/2 -translate-y-1/2 bg-gold text-white rounded-full p-2.5 disabled:bg-gold/50 disabled:cursor-not-allowed hover:bg-deep-green transition-colors" aria-label="Send message"><SendIcon /></button>
                        </div>
                        <button type="button" onClick={isLiveSessionActive ? stopLiveSession : startLiveSession} className={`p-3 rounded-full text-white transition-colors duration-200 ${isLiveSessionActive ? 'bg-red-500 animate-pulse' : 'bg-gold hover:bg-deep-green'}`} aria-label={isLiveSessionActive ? "Stop voice chat" : "Start voice chat"}>
                           {isLiveSessionActive ? <StopIcon /> : <MicIcon />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
