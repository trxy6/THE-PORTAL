import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Camera, MapPin, Mic, Bell, Sparkles, CheckCircle, Info } from 'lucide-react';

interface AccessMatrixProps {
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
  haptic?: (ms: number) => void;
  onClose?: () => void;
}

interface PermissionState {
  state: 'granted' | 'denied' | 'prompt' | 'checking';
  supported: boolean;
}

export default function AccessMatrix({ toast, haptic = () => {}, onClose }: AccessMatrixProps) {
  const [geoState, setGeoState] = useState<PermissionState>({ state: 'checking', supported: true });
  const [cameraState, setCameraState] = useState<PermissionState>({ state: 'checking', supported: true });
  const [micState, setMicState] = useState<PermissionState>({ state: 'checking', supported: true });
  const [notifState, setNotifState] = useState<PermissionState>({ state: 'checking', supported: true });
  const [isAgreed, setIsAgreed] = useState(false);

  // Check state on mount
  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    // 1. Geolocation
    if ('geolocation' in navigator) {
      if (navigator.permissions) {
        try {
          const res = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setGeoState({ state: res.state, supported: true });
          res.onchange = () => setGeoState({ state: res.state, supported: true });
        } catch (e) {
          setGeoState({ state: 'prompt', supported: true });
        }
      } else {
        setGeoState({ state: 'prompt', supported: true });
      }
    } else {
      setGeoState({ state: 'denied', supported: false });
    }

    // 2. Camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      if (navigator.permissions) {
        try {
          // Some browsers do not support querying camera directly
          const res = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraState({ state: res.state, supported: true });
          res.onchange = () => setCameraState({ state: res.state, supported: true });
        } catch (e) {
          setCameraState({ state: 'prompt', supported: true });
        }
      } else {
        setCameraState({ state: 'prompt', supported: true });
      }
    } else {
      setCameraState({ state: 'denied', supported: false });
    }

    // 3. Microphone
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      if (navigator.permissions) {
        try {
          const res = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicState({ state: res.state, supported: true });
          res.onchange = () => setMicState({ state: res.state, supported: true });
        } catch (e) {
          setMicState({ state: 'prompt', supported: true });
        }
      } else {
        setMicState({ state: 'prompt', supported: true });
      }
    } else {
      setMicState({ state: 'denied', supported: false });
    }

    // 4. Notifications
    if ('Notification' in window) {
      const current = Notification.permission;
      setNotifState({ state: current === 'default' ? 'prompt' : current, supported: true });
    } else {
      setNotifState({ state: 'denied', supported: false });
    }
  };

  const requestGeolocation = () => {
    haptic(5);
    if (!geoState.supported) {
      toast("Geolocation is not supported by your browser/device.", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState({ state: 'granted', supported: true });
        toast("📍 Geolocation permission granted!", "success");
      },
      (err) => {
        setGeoState({ state: 'denied', supported: true });
        toast("📍 Geolocation permission denied or unavailable.", "error");
      },
      { timeout: 5000 }
    );
  };

  const requestCamera = async () => {
    haptic(5);
    if (!cameraState.supported) {
      toast("Camera hardware not detected or supported.", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop stream immediately to release the camera
      stream.getTracks().forEach(track => track.stop());
      setCameraState({ state: 'granted', supported: true });
      toast("📷 Camera permission granted successfully!", "success");
    } catch (e) {
      setCameraState({ state: 'denied', supported: true });
      toast("📷 Camera access denied or blocked.", "error");
    }
  };

  const requestMicrophone = async () => {
    haptic(5);
    if (!micState.supported) {
      toast("Microphone hardware not detected or supported.", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop stream immediately to release the microphone
      stream.getTracks().forEach(track => track.stop());
      setMicState({ state: 'granted', supported: true });
      toast("🎤 Microphone permission granted successfully!", "success");
    } catch (e) {
      setMicState({ state: 'denied', supported: true });
      toast("🎤 Microphone access denied or blocked.", "error");
    }
  };

  const requestNotifications = async () => {
    haptic(5);
    if (!notifState.supported) {
      toast("Desktop Notifications are not supported by your browser.", "error");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifState({ state: permission === 'default' ? 'prompt' : permission, supported: true });
      if (permission === 'granted') {
        toast("🔔 Notifications enabled successfully!", "success");
      } else {
        toast("🔔 Notifications denied or blocked.", "error");
      }
    } catch (e) {
      setNotifState({ state: 'denied', supported: true });
    }
  };

  const handleAgreeAll = async () => {
    haptic(20);
    setIsAgreed(true);
    toast("✨ Permission preferences submitted! I AGREE :)", "success");

    // Proactively request any that are still prompt
    if (geoState.state === 'prompt') requestGeolocation();
    if (cameraState.state === 'prompt') requestCamera();
    if (micState.state === 'prompt') requestMicrophone();
    if (notifState.state === 'prompt') requestNotifications();

    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Visual Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-600 dark:text-purple-400">
          <Shield className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
            Quantum Access Matrix
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </h2>
          <p className="text-[10px] text-slate-500">Enable spatial device telemetry and sensor streams</p>
        </div>
      </div>

      {/* Styled Permission Card (The Purple Gradient Masterpiece) */}
      <motion.div
        whileHover={{ scale: 1.015, boxShadow: '0 15px 40px rgba(162, 155, 254, 0.45)' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="permission-card relative overflow-hidden rounded-3xl p-6 border text-white space-y-6 select-none"
        style={{
          background: 'linear-gradient(135deg, #2b1055, #7597de)',
          borderColor: '#a29bfe',
          boxShadow: '0 10px 30px rgba(162, 155, 254, 0.3)',
        }}
      >
        {/* Futuristic Grid Overlay decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-400/25 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header inside */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-purple-200 tracking-widest block">System Integration Shield</span>
            <h3 className="text-lg font-black text-white tracking-tight">Active Sentinel Approvals</h3>
          </div>
          <div className="text-[10px] px-2.5 py-1 bg-white/10 rounded-full border border-white/20 font-mono text-purple-100 uppercase tracking-wider">
            SECURE SANDBOX
          </div>
        </div>

        {/* Permission Items List */}
        <div className="permission-list relative z-10 space-y-3.5">
          {/* Item 1: Geolocation */}
          <motion.div
            whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.15)' }}
            className="permission-item active flex items-center justify-between p-4 rounded-2xl transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-white/10 text-white shadow-inner">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="permission-name font-bold text-sm tracking-wide text-white block" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  Sovereign Telemetry (Maps)
                </span>
                <span className="text-[10px] text-purple-200/80 block mt-0.5">Tailor meal matching and battle zone proximity grids</span>
              </div>
            </div>

            <button
              onClick={requestGeolocation}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                geoState.state === 'granted'
                  ? 'bg-emerald-500/80 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/15 hover:bg-white/25 border-white/20 hover:border-white/40 text-purple-100'
              }`}
            >
              {geoState.state === 'granted' ? '● Allowed' : 'Enable'}
            </button>
          </motion.div>

          {/* Item 2: Camera */}
          <motion.div
            whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.15)' }}
            className="permission-item active flex items-center justify-between p-4 rounded-2xl transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-white/10 text-white shadow-inner">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="permission-name font-bold text-sm tracking-wide text-white block" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  Visual Optics Matrix (Camera)
                </span>
                <span className="text-[10px] text-purple-200/80 block mt-0.5">Engage spatial vision scanner overlays and local profile scanning</span>
              </div>
            </div>

            <button
              onClick={requestCamera}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                cameraState.state === 'granted'
                  ? 'bg-emerald-500/80 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/15 hover:bg-white/25 border-white/20 hover:border-white/40 text-purple-100'
              }`}
            >
              {cameraState.state === 'granted' ? '● Allowed' : 'Enable'}
            </button>
          </motion.div>

          {/* Item 3: Microphone */}
          <motion.div
            whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.15)' }}
            className="permission-item active flex items-center justify-between p-4 rounded-2xl transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-white/10 text-white shadow-inner">
                <Mic className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="permission-name font-bold text-sm tracking-wide text-white block" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  Mila Vocal Sensor (Microphone)
                </span>
                <span className="text-[10px] text-purple-200/80 block mt-0.5">Speak with Mila and issue hands-free vocal workspace triggers</span>
              </div>
            </div>

            <button
              onClick={requestMicrophone}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                micState.state === 'granted'
                  ? 'bg-emerald-500/80 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/15 hover:bg-white/25 border-white/20 hover:border-white/40 text-purple-100'
              }`}
            >
              {micState.state === 'granted' ? '● Allowed' : 'Enable'}
            </button>
          </motion.div>

          {/* Item 4: Notifications */}
          <motion.div
            whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.15)' }}
            className="permission-item active flex items-center justify-between p-4 rounded-2xl transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-white/10 text-white shadow-inner">
                <Bell className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="permission-name font-bold text-sm tracking-wide text-white block" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  Temporal Triggers (Notifications)
                </span>
                <span className="text-[10px] text-purple-200/80 block mt-0.5">Receive alerts when cooking timers finish or battles commence</span>
              </div>
            </div>

            <button
              onClick={requestNotifications}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                notifState.state === 'granted'
                  ? 'bg-emerald-500/80 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/15 hover:bg-white/25 border-white/20 hover:border-white/40 text-purple-100'
              }`}
            >
              {notifState.state === 'granted' ? '● Allowed' : 'Enable'}
            </button>
          </motion.div>
        </div>

        {/* Humorous Maps Comment requested by the user */}
        <div className="funny-comment relative z-10 text-center pt-2 text-xs italic text-[#e0b0ff] opacity-85 select-none font-sans flex items-center justify-center gap-1">
          <span>🗺️</span> Maps: So you don’t get lost in your own living room.
        </div>

        {/* Action Button: "I AGREE :)" styled with deep glow & neon gradient */}
        <div className="relative z-10 pt-2 text-center">
          <motion.button
            whileHover={{
              y: -2.5,
              boxShadow: '0 8px 25px rgba(108, 92, 231, 0.75)',
            }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAgreeAll}
            className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white text-xs font-black tracking-widest uppercase rounded-full shadow-lg border border-purple-300/20 hover:border-purple-300/40 cursor-pointer select-none transition-all duration-200"
          >
            {isAgreed ? (
              <span className="flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-white" />
                SYSTEM AUTHORIZED :)
              </span>
            ) : (
              'I AGREE :)'
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Trust Shield Note block */}
      <div className="flex gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 text-left text-[10px] text-slate-500">
        <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          The Access Matrix leverages standard W3C Web APIs inside a local sandboxed scope. Toggling any of the sliders requests active consent directly via your secure browser client. No visual or spatial data ever travels to external servers.
        </p>
      </div>
    </div>
  );
}
