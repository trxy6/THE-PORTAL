import React, { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, Compass, Search, Navigation, Lock, Shield, 
  Layers, Plus, Trash2, Sliders, Play, Pause, AlertCircle, Info, 
  ExternalLink, HelpCircle, Check, Network, Activity, MapPin, 
  Cpu, Database, Radio, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  createAccuracyCircle,
  PortalDestination,
  usePortalNavigation,
} from "./usePortalNavigation";

// Free, unlimited OpenStreetMap Engine (requires no API keys)

interface SovereignMapWorkspaceProps {
  themeColor: string;
  portalDarkMode: boolean;
  getThemeHex: () => string;
  toast: (msg: string, type?: 'success' | 'warn' | 'error' | 'info') => void;
  haptic: (pattern?: number | number[]) => void;
}

interface OfflineNode {
  id: string;
  name: string;
  sector: string;
  x: number;
  y: number;
  type: 'core' | 'gateway' | 'mesh' | 'server';
  status: 'online' | 'standby' | 'alert';
  description: string;
}

export default function SovereignMapWorkspace({
  themeColor,
  portalDarkMode,
  getThemeHex,
  toast,
  haptic
}: SovereignMapWorkspaceProps) {
  const [mapMode, setMapMode] = useState<'offline' | 'online' | 'gps'>('offline');

  // --- Online Map Settings ---
  const [onlineQuery, setOnlineQuery] = useState('San Francisco');
  const [activePoi, setActivePoi] = useState<{ lat: number, lng: number; title: string; description: string } | null>(null);
  const [onlineSearchText, setOnlineSearchText] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // default San Francisco
  const [mapZoom, setMapZoom] = useState(12);

  const accentColor = getThemeHex();

  const mapIframeRef = useRef<HTMLIFrameElement | null>(null);

  const gpsDestination: PortalDestination | null = activePoi
    ? {
        latitude: activePoi.lat,
        longitude: activePoi.lng,
        name: activePoi.title || "Selected destination",
      }
    : null;

  const navigation = usePortalNavigation({
    destination: gpsDestination,
    voiceEnabled: true,
    followLocation: true,
  });

  // Post real-time navigation updates to the Leaflet map iframe
  useEffect(() => {
    const iframe = mapIframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    
    iframe.contentWindow.postMessage({
      type: 'navigation-update',
      position: navigation.position,
      route: navigation.route,
      followLocation: navigation.followLocation && navigation.isTracking,
      isNavigating: navigation.isNavigating
    }, '*');
  }, [navigation.position, navigation.route, navigation.followLocation, navigation.isTracking, navigation.isNavigating]);

  // Automatically start GPS tracking when GPS mode is selected
  useEffect(() => {
    if (mapMode === 'gps') {
      if (!navigation.isTracking) {
        navigation.startTracking();
        toast("GPS tracking enabled.", "success");
      }
    }
  }, [mapMode, navigation.isTracking]);

  // --- Offline Sovereign Grid State ---
  const [offlineNodes, setOfflineNodes] = useState<OfflineNode[]>(() => {
    const saved = localStorage.getItem('sovereign_map_nodes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to default sci-fi nodes
      }
    }
    return [
      { id: 'node-1', name: 'Central Core Database', sector: 'SEC-01', x: 200, y: 150, type: 'core', status: 'online', description: 'Primary encrypted knowledge-base hub running on low-resource ARM core.' },
      { id: 'node-2', name: 'Secure P2P Gateway Alpha', sector: 'SEC-02', x: 450, y: 220, type: 'gateway', status: 'online', description: 'Zero-trust gateway managing client-side encrypted device synchronization.' },
      { id: 'node-3', name: 'Simulation Engine Server', sector: 'SEC-03', x: 150, y: 350, type: 'server', status: 'online', description: 'Runs local Qwen-1.5B neural model simulation matrix on hardware loop.' },
      { id: 'node-4', name: 'Mesh Node Gamma', sector: 'SEC-04', x: 600, y: 120, type: 'mesh', status: 'standby', description: 'Relay antenna routing private telemetry streams across neighborhood network.' },
      { id: 'node-5', name: 'Cryptonode Delta', sector: 'SEC-05', x: 550, y: 380, type: 'mesh', status: 'alert', description: 'Secured node experiencing heavy incoming P2P syncing packets.' }
    ];
  });

  // State persistence
  useEffect(() => {
    localStorage.setItem('sovereign_map_nodes', JSON.stringify(offlineNodes));
  }, [offlineNodes]);

  // Selected Nodes for mesh routing
  const [selectedNode, setSelectedNode] = useState<OfflineNode | null>(null);
  const [routingSource, setRoutingSource] = useState<OfflineNode | null>(null);
  const [routingTarget, setRoutingTarget] = useState<OfflineNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Custom node placement mode
  const [isPlacingNode, setIsPlacingNode] = useState(false);
  const [placedX, setPlacedX] = useState<number | null>(null);
  const [placedY, setPlacedY] = useState<number | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<'core' | 'gateway' | 'mesh' | 'server'>('mesh');
  
  // Simulated packet flow
  const [isSimulationActive, setIsSimulationActive] = useState(true);
  const [simulatedPackets, setSimulatedPackets] = useState<string[]>([]);
  
  // Interactive SVG Pan & Zoom state
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });



  const handleOnlineSearch = async (query: string) => {
    if (!query.trim()) return;
    setOnlineQuery(query);
    toast(`Locating "${query}" via free OSM Satellites...`, 'info');
    haptic(10);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        setMapCenter({ lat, lng });
        setMapZoom(13);
        setActivePoi({
          lat,
          lng,
          title: first.display_name.split(',')[0] || 'Located Destination',
          description: first.display_name || 'Global satellite node target.'
        });
        toast(`✓ Target locked: ${first.display_name.split(',')[0]}`, 'success');
        haptic([10, 15]);
      } else {
        toast(`Target "${query}" not found in database.`, 'warn');
      }
    } catch (err) {
      console.error('OSM Search failed:', err);
      toast('Sovereign satellite connection timed out.', 'error');
    }
  };

  const handleDetectMyLocation = () => {
    toast('Establish satellite connection with GPS...', 'info');
    haptic(10);
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setMapZoom(14);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const title = data.address?.road || data.address?.suburb || 'Current Position';
          const description = data.display_name || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          setActivePoi({
            lat: latitude,
            lng: longitude,
            title: `GPS: ${title}`,
            description: `${description} (Verified GPS Coordinates)`
          });
          toast(`✓ GPS locked: ${title}`, 'success');
        } catch (err) {
          setActivePoi({
            lat: latitude,
            lng: longitude,
            title: 'GPS Position',
            description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
          });
          toast(`✓ Location loaded (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`, 'success');
        }
        haptic([10, 15]);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast(`Failed to retrieve GPS: ${error.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Default Online Points of interest
  const POIS = [
    { id: 'sf', title: 'San Francisco Hub', description: 'Central tech office running secure server integrations.', lat: 37.7749, lng: -122.4194 },
    { id: 'sc', title: 'Silicon Valley lab', description: 'Advanced hardware acceleration and edge compute research center.', lat: 37.4419, lng: -122.1430 },
    { id: 'gg', title: 'Golden Gate Gateway', description: 'Primary edge mesh antenna overseeing coastal network traffic.', lat: 37.8199, lng: -122.4783 },
    { id: 'ok', title: 'Oakland Relay', description: 'Sovereign P2P relay terminal with redundant solar backup battery.', lat: 37.8044, lng: -122.2711 }
  ];

  // Simulated packet logs
  useEffect(() => {
    if (!isSimulationActive) return;
    const interval = setInterval(() => {
      const types = ['UDP_PACKET', 'P2P_HANDSHAKE', 'DHT_SEARCH', 'AES_CIPHER_TXT', 'SYNC_BLOCK'];
      const nodes = offlineNodes.map(n => n.name);
      if (nodes.length === 0) return;
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomNodeA = nodes[Math.floor(Math.random() * nodes.length)];
      let randomNodeB = nodes[Math.floor(Math.random() * nodes.length)];
      if (randomNodeA === randomNodeB) {
        randomNodeB = 'External Client Node';
      }
      const timestamp = new Date().toLocaleTimeString();
      const log = `[${timestamp}] ${randomType} forwarded from ${randomNodeA} ➔ ${randomNodeB} (Latency: ${Math.floor(Math.random() * 8) + 2}ms)`;
      
      setSimulatedPackets(prev => [log, ...prev].slice(0, 30));
    }, 2500);
    return () => clearInterval(interval);
  }, [isSimulationActive, offlineNodes]);

  // SVG Mouse handlers for dragging/panning
  const handleSvgMouseDown = (e: React.MouseEvent) => {
    // Only drag if not clicking a button/node (check if target is background)
    const target = e.target as HTMLElement;
    if (target.tagName === 'svg' || target.id === 'map-background-rect' || target.id === 'grid-pattern-rect') {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
      haptic(5);
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanX(e.clientX - dragStartRef.current.x);
    setPanY(e.clientY - dragStartRef.current.y);
  };

  const handleSvgMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingRef.current) return;
    if (!isPlacingNode) return;

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      // Calculate coordinates relative to SVG coordinate system taking scale & panning into account
      const clickX = (e.clientX - rect.left - panX) / zoomScale;
      const clickY = (e.clientY - rect.top - panY) / zoomScale;
      
      setPlacedX(Math.round(clickX));
      setPlacedY(Math.round(clickY));
      haptic(10);
    }
  };

  const addNewNode = () => {
    if (!newNodeName.trim() || placedX === null || placedY === null) {
      toast('Please enter a name and click on the grid to position your node.', 'warn');
      return;
    }
    const sectorId = `SEC-${Math.floor(placedX / 150) + 1}-${Math.floor(placedY / 150) + 1}`;
    const newNode: OfflineNode = {
      id: `custom-node-${Date.now()}`,
      name: newNodeName,
      sector: sectorId,
      x: placedX,
      y: placedY,
      type: newNodeType,
      status: 'online',
      description: `User-defined sovereign node placed on local tactical grid in Sector ${sectorId}.`
    };

    setOfflineNodes(prev => [...prev, newNode]);
    toast(`✓ Sovereign Node "${newNodeName}" deployed successfully!`, 'success');
    haptic([15, 20]);
    
    // reset form
    setNewNodeName('');
    setPlacedX(null);
    setPlacedY(null);
    setIsPlacingNode(false);
  };

  const deleteNode = (id: string) => {
    setOfflineNodes(prev => prev.filter(n => n.id !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
    if (routingSource?.id === id) setRoutingSource(null);
    if (routingTarget?.id === id) setRoutingTarget(null);
    toast('Node decommissioned from Sovereign network.', 'warn');
    haptic(20);
  };

  const handleRouteClick = (node: OfflineNode) => {
    if (!routingSource) {
      setRoutingSource(node);
      toast(`Origin locked: ${node.name}. Select destination node.`, 'info');
      haptic(10);
    } else if (routingSource.id === node.id) {
      setRoutingSource(null);
      toast('Origin node deselected.', 'info');
      haptic(10);
    } else {
      setRoutingTarget(node);
      toast(`⚡ Tunnel established: ${routingSource.name} ➔ ${node.name}`, 'success');
      haptic([10, 30]);
    }
  };

  const clearRoute = () => {
    setRoutingSource(null);
    setRoutingTarget(null);
    toast('Tunnel routing vectors cleared.', 'info');
    haptic(10);
  };

  // Filter nodes based on query and type
  const filteredNodes = offlineNodes.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.sector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || n.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-full bg-[#05020c]/90 text-white rounded-2xl border border-purple-500/10 overflow-hidden backdrop-blur-xl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-white/[0.05] bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <MapIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              Sovereign Grid Navigator 
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">BETA</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Dual-engine location matrix: Secure offline vector grid & global satellites</p>
          </div>
        </div>

        {/* Engine Toggle */}
        <div className="flex bg-slate-900/90 border border-white/5 rounded-xl p-1 shrink-0 select-none">
          <button 
            onClick={() => { setMapMode('offline'); haptic(10); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mapMode === 'offline' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Compass className="w-3.5 h-3.5" />
            📴 Sovereign Grid (Offline)
          </button>
          <button 
            onClick={() => { setMapMode('online'); haptic(10); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mapMode === 'online' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            🌐 Online Satellite Map (Free)
          </button>
          <button 
            onClick={() => { setMapMode('gps'); haptic(10); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mapMode === 'gps' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Navigation className="w-3.5 h-3.5" />
            🛰️ GPS
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        
        {/* SIDEBAR */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/[0.05] bg-slate-950/20 flex flex-col min-h-0 shrink-0 text-left">
          
          {/* SEARCH & FILTERS SECTION */}
          <div className="p-4 border-b border-white/[0.04] space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={mapMode === 'offline' ? "Search offline core nodes..." : "Search places globally (free)..."}
                value={mapMode === 'offline' ? searchQuery : onlineSearchText}
                onChange={(e) => {
                  if (mapMode === 'offline') {
                    setSearchQuery(e.target.value);
                  } else {
                    setOnlineSearchText(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (mapMode === 'offline') {
                      // Offline search is filtered automatically via state query
                    } else {
                      handleOnlineSearch(onlineSearchText);
                    }
                  }
                }}
                className="w-full bg-slate-900/60 hover:bg-slate-900/80 focus:bg-slate-900 text-xs text-white placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 border border-white/5 focus:border-purple-500/40 focus:outline-none transition-all"
              />
              {(mapMode === 'online' || mapMode === 'gps') && onlineSearchText.trim() && (
                <button 
                  onClick={() => {
                    handleOnlineSearch(onlineSearchText);
                  }}
                  className="absolute right-2 top-1.5 px-2 py-0.5 rounded bg-purple-500 text-[10px] font-bold hover:bg-purple-600 cursor-pointer"
                >
                  Go
                </button>
              )}
            </div>

            {mapMode === 'offline' ? (
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 text-[10px] text-slate-300 rounded-lg p-1.5 focus:outline-none"
                >
                  <option value="all">All Node Classes</option>
                  <option value="core">Database Cores</option>
                  <option value="gateway">Secure Gateways</option>
                  <option value="mesh">Mesh Relays</option>
                  <option value="server">Simulation Servers</option>
                </select>
                <button
                  onClick={() => setIsPlacingNode(!isPlacingNode)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${isPlacingNode ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300' : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-slate-800'}`}
                >
                  <Plus className="w-3 h-3" />
                  Deploy
                </button>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400">
                Click a preset terminal location below to teleport the online satellite camera:
              </div>
            )}

            <button
              onClick={handleDetectMyLocation}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 cursor-pointer transition-all shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              🛰️ Locate Me (GPS Node)
            </button>
          </div>

          {/* DYNAMIC LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mapMode === 'offline' ? (
              <>
                {/* Placing custom node setup panel */}
                {isPlacingNode && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-cyan-500/30 bg-cyan-950/15 rounded-xl p-3 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3 animate-spin" />
                        Node Deploy Sequence
                      </span>
                      <button 
                        onClick={() => setIsPlacingNode(false)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Node Designation</label>
                        <input
                          type="text"
                          placeholder="e.g. Mesh Relay Theta"
                          value={newNodeName}
                          onChange={(e) => setNewNodeName(e.target.value)}
                          className="w-full bg-slate-900/80 text-[11px] rounded p-1 border border-white/5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Hardware Class</label>
                        <div className="grid grid-cols-2 gap-1">
                          {(['mesh', 'gateway', 'server', 'core'] as const).map(t => (
                            <button
                              key={t}
                              onClick={() => setNewNodeType(t)}
                              className={`px-2 py-1 rounded text-[9px] capitalize border text-center transition-all ${newNodeType === t ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-2 bg-slate-900/60 rounded border border-white/5 text-[9px] text-slate-400 space-y-1">
                        <p className="font-bold text-cyan-400">Positioning Steps:</p>
                        <p>1. Double-click anywhere on the Grid Canvas map on the right to drop coordinate targets.</p>
                        <p className="font-semibold text-slate-300">
                          Current Coordinate: {placedX !== null && placedY !== null ? `X:${placedX}, Y:${placedY}` : 'Not designated'}
                        </p>
                      </div>

                      <button
                        onClick={addNewNode}
                        disabled={!newNodeName.trim() || placedX === null}
                        className="w-full py-1.5 rounded bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold transition-all text-black cursor-pointer"
                      >
                        Deploy Node to Sector
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Nodes List */}
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest block pb-1 border-b border-white/[0.03]">
                  Connected Node Terminals ({filteredNodes.length})
                </span>
                
                {filteredNodes.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    No sovereign nodes match search.
                  </div>
                ) : (
                  filteredNodes.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    const isSrc = routingSource?.id === node.id;
                    const isDst = routingTarget?.id === node.id;
                    
                    return (
                      <div 
                        key={node.id}
                        onClick={() => {
                          setSelectedNode(node);
                          haptic(10);
                        }}
                        className={`group border rounded-xl p-3 transition-all cursor-pointer text-left relative ${
                          isSelected ? 'bg-purple-950/20 border-purple-500/45' : 
                          isSrc ? 'bg-blue-950/20 border-blue-500/40' :
                          isDst ? 'bg-emerald-950/20 border-emerald-500/40' :
                          'bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              node.status === 'online' ? 'bg-emerald-500 animate-pulse' :
                              node.status === 'standby' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{node.name}</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-900 px-1 py-0.5 rounded uppercase">
                            {node.sector}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {node.description}
                        </p>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.03] text-[9px] text-slate-500">
                          <span className="capitalize font-semibold text-purple-400/80">Class: {node.type}</span>
                          
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRouteClick(node);
                              }}
                              className={`p-1 rounded hover:text-white transition-colors cursor-pointer ${isSrc ? 'text-blue-400' : 'text-slate-400'}`}
                              title="Set Route origin/destination"
                            >
                              <Navigation className="w-3 h-3" />
                            </button>
                            {node.id.startsWith('custom-node') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNode(node.id);
                                }}
                                className="p-1 rounded text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                title="Decommission Node"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Connection indicators */}
                        {isSrc && (
                          <div className="absolute right-3 top-3 w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-[8px] font-black font-mono text-blue-300">
                            A
                          </div>
                        )}
                        {isDst && (
                          <div className="absolute right-3 top-3 w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-[8px] font-black font-mono text-emerald-300">
                            B
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            ) : (
              <>
                {/* Preset Places for Global Satellite Map */}
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest block pb-1 border-b border-white/[0.03]">
                  Tactical Station Presets
                </span>
                
                <div className="space-y-2">
                  {POIS.map(poi => (
                    <button
                      key={poi.id}
                      onClick={() => {
                        setMapCenter({ lat: poi.lat, lng: poi.lng });
                        setMapZoom(13);
                        setActivePoi(poi);
                        toast(`Teleporting camera to ${poi.title}`, 'info');
                        haptic(10);
                      }}
                      className="w-full text-left bg-slate-900/40 border border-white/5 hover:border-purple-500/30 hover:bg-purple-950/10 rounded-xl p-3 transition-all cursor-pointer group flex items-center gap-3"
                    >
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-purple-300 transition-colors">
                          {poi.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                          {poi.lat.toFixed(4)}°N, {poi.lng.toFixed(4)}°W
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {activePoi && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-3 text-left mt-4 animate-[fadeIn_0.3s_ease-out]">
                    <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1 uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      Active Destination Node
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white leading-snug">{activePoi.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">{activePoi.description}</p>
                    </div>

                    {/* GPS Travel Mode Select */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        🧭 Routing Profile
                      </label>
                      <select
                        value={navigation.routingProfile}
                        onChange={(e) => {
                          haptic(10);
                          navigation.setRoutingProfile(e.target.value as any);
                          toast(`Routing profile updated to ${e.target.value}`, 'info');
                        }}
                        className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-zinc-200 font-bold focus:outline-none focus:border-purple-500/50 cursor-pointer"
                      >
                        <option value="driving">🚗 Driving (OSRM Car)</option>
                        <option value="walking">🚶 Walking (OSRM Foot)</option>
                        <option value="bicycling">🚲 Bicycling (OSRM Bicycle)</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={() => {
                          haptic(10);
                          if (navigation.isTracking) {
                            navigation.stopTracking();
                            toast("GPS sensor tracking paused.", "info");
                          } else {
                            navigation.startTracking();
                            toast("GPS sensor tracking activated.", "success");
                          }
                        }}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border text-center transition-all cursor-pointer select-none ${
                          navigation.isTracking 
                            ? 'bg-purple-500/20 border-purple-400/40 text-purple-300' 
                            : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {navigation.isTracking ? '📡 GPS ON' : '📡 GPS OFF'}
                      </button>
                      <button
                        onClick={async () => {
                          haptic(20);
                          if (navigation.isNavigating) {
                            navigation.stopNavigation();
                            toast("Navigation stopped.", "info");
                          } else {
                            toast("Calculating GPS routing grid...", "info");
                            await navigation.startNavigation();
                          }
                        }}
                        disabled={navigation.isRouting}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider text-white text-center cursor-pointer transition-all select-none ${
                          navigation.isNavigating 
                            ? 'bg-rose-600 hover:bg-rose-500 border border-rose-500/20 shadow-lg' 
                            : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg'
                        }`}
                      >
                        {navigation.isRouting ? 'Routing...' : navigation.isNavigating ? 'Stop Nav' : 'Start Nav'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-purple-950/10 border border-purple-500/15 rounded-xl space-y-2 text-left mt-4">
                  <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    Sovereign Satellite Link
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Powered by OpenStreetMap. Completely free, unlimited, and runs locally. Your host location is fully private, protected, and secure.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* NET FLOW / TELEMETRY LOOPS (BOTTOM SIDEBAR) */}
          {mapMode === 'offline' && (
            <div className="p-4 border-t border-white/[0.05] bg-slate-950/40 h-48 flex flex-col min-h-0 text-left">
              <div className="flex justify-between items-center mb-2 shrink-0 select-none">
                <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  P2P Sync Logs
                </span>
                <button
                  onClick={() => setIsSimulationActive(!isSimulationActive)}
                  className={`p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer`}
                  title={isSimulationActive ? 'Pause packet loop' : 'Resume packet loop'}
                >
                  {isSimulationActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[8px] text-slate-400 space-y-1 select-text scrollbar-thin">
                {simulatedPackets.length === 0 ? (
                  <p className="text-slate-500 italic">Awaiting local syncing packets...</p>
                ) : (
                  simulatedPackets.map((log, idx) => (
                    <div key={idx} className="hover:bg-white/5 p-0.5 rounded transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* INTERACTIVE MAP AREA (RIGHT COLUMN) */}
        <div className="flex-1 bg-slate-950 flex flex-col relative min-h-0 overflow-hidden">
          
          {mapMode === 'offline' ? (
            // --- OFFLINE VECTOR GRID SVG MAP ---
            <div className="flex-1 flex flex-col relative h-full select-none">
              
              {/* Floating Map Navigation HUD */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <div className="bg-slate-900/90 backdrop-blur border border-white/10 rounded-xl p-1 flex shadow-xl select-none">
                  <button 
                    onClick={() => { setZoomScale(s => Math.min(s + 0.25, 2.5)); haptic(5); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    ＋
                  </button>
                  <button 
                    onClick={() => { setZoomScale(s => Math.max(s - 0.25, 0.5)); haptic(5); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    －
                  </button>
                  <button 
                    onClick={() => { setPanX(0); setPanY(0); setZoomScale(1); haptic(5); }}
                    className="px-2.5 rounded-lg flex items-center justify-center text-[10px] font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Recenter Grid"
                  >
                    Reset Zoom
                  </button>
                </div>

                {/* Place Indicator banner */}
                {isPlacingNode && (
                  <div className="bg-cyan-950/80 backdrop-blur border border-cyan-400/30 text-cyan-200 text-[10px] font-bold rounded-xl px-3 flex items-center gap-2 shadow-xl">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>DOUBLE-CLICK GRID TO LOCK NODE COORDINATES</span>
                  </div>
                )}
              </div>

              {/* Connected Route Tunnel Banner */}
              {routingSource && (
                <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 backdrop-blur border border-blue-500/25 rounded-2xl p-3 shadow-2xl flex flex-col text-left max-w-sm">
                  <div className="flex justify-between items-center border-b border-white/[0.05] pb-1.5 mb-1.5">
                    <span className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-1 tracking-wider">
                      <Network className="w-3.5 h-3.5 animate-pulse" />
                      P2P Wire Tunnel
                    </span>
                    <button 
                      onClick={clearRoute}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer px-1 hover:bg-white/5 rounded"
                    >
                      Clear Tunnel
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <p className="text-slate-300">
                      <strong className="text-blue-300">From:</strong> {routingSource.name} <span className="text-[9px] font-mono text-slate-500">({routingSource.sector})</span>
                    </p>
                    {routingTarget ? (
                      <>
                        <p className="text-slate-300">
                          <strong className="text-emerald-300">To:</strong> {routingTarget.name} <span className="text-[9px] font-mono text-slate-500">({routingTarget.sector})</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1.5 text-[9px] font-mono font-bold">
                          <div className="bg-slate-950/60 border border-white/5 p-1 rounded">
                            <span className="text-slate-500 block uppercase text-[7px]">Distance</span>
                            <span className="text-slate-200 text-[11px]">
                              {Math.round(Math.sqrt(Math.pow(routingTarget.x - routingSource.x, 2) + Math.pow(routingTarget.y - routingSource.y, 2)))} Sectors
                            </span>
                          </div>
                          <div className="bg-slate-950/60 border border-white/5 p-1 rounded">
                            <span className="text-slate-500 block uppercase text-[7px]">Simulated Latency</span>
                            <span className="text-emerald-400 text-[11px]">
                              {(Math.sqrt(Math.pow(routingTarget.x - routingSource.x, 2) + Math.pow(routingTarget.y - routingSource.y, 2)) / 100 + 1.2).toFixed(2)} ms
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-500 italic animate-pulse">
                        Click on target node or route icon in list to establish loop...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Canvas Container */}
              <div className="flex-1 w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing">
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  onMouseDown={handleSvgMouseDown}
                  onMouseMove={handleSvgMouseMove}
                  onMouseUp={handleSvgMouseUp}
                  onMouseLeave={handleSvgMouseUp}
                  onDoubleClick={handleSvgClick}
                  className="w-full h-full"
                >
                  {/* Grid System Background */}
                  <g transform={`translate(${panX}, ${panY}) scale(${zoomScale})`}>
                    
                    {/* Dark Canvas Space */}
                    <rect
                      id="map-background-rect"
                      width="2000"
                      height="2000"
                      x="-1000"
                      y="-1000"
                      fill="#070312"
                    />

                    {/* Cyber Grid pattern */}
                    <defs>
                      <pattern id="tactical-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(139, 92, 246, 0.04)" strokeWidth="1" />
                        <circle cx="0" cy="0" r="1.5" fill="rgba(139, 92, 246, 0.15)" />
                      </pattern>
                      <pattern id="tactical-grid-coarse" width="250" height="250" patternUnits="userSpaceOnUse">
                        <path d="M 250 0 L 0 0 0 250" fill="none" stroke="rgba(139, 92, 246, 0.12)" strokeWidth="1.5" />
                      </pattern>
                    </defs>

                    <rect
                      id="grid-pattern-rect"
                      width="2000"
                      height="2000"
                      x="-1000"
                      y="-1000"
                      fill="url(#tactical-grid)"
                    />
                    <rect
                      width="2000"
                      height="2000"
                      x="-1000"
                      y="-1000"
                      fill="url(#tactical-grid-coarse)"
                      pointerEvents="none"
                    />

                    {/* Concentric Radar Rings in center */}
                    <circle cx="400" cy="250" r="250" fill="none" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="1.5" strokeDasharray="5,5" pointerEvents="none" />
                    <circle cx="400" cy="250" r="150" fill="none" stroke="rgba(139, 92, 246, 0.04)" strokeWidth="1" pointerEvents="none" />
                    <circle cx="400" cy="250" r="50" fill="none" stroke="rgba(139, 92, 246, 0.03)" strokeWidth="1" pointerEvents="none" />

                    {/* Coordinates Crosshair Lines */}
                    <line x1="-1000" y1="250" x2="2000" y2="250" stroke="rgba(139, 92, 246, 0.03)" strokeWidth="1" pointerEvents="none" />
                    <line x1="400" y1="-1000" x2="400" y2="2000" stroke="rgba(139, 92, 246, 0.03)" strokeWidth="1" pointerEvents="none" />

                    {/* Draw Routing Path (GLOWING dash-array P2P connection) */}
                    {routingSource && routingTarget && (
                      <g>
                        {/* Glow outline path */}
                        <line
                          x1={routingSource.x}
                          y1={routingSource.y}
                          x2={routingTarget.x}
                          y2={routingTarget.y}
                          stroke="#3b82f6"
                          strokeWidth="4"
                          strokeLinecap="round"
                          opacity="0.35"
                          style={{ filter: 'blur(3px)' }}
                        />
                        {/* Core path */}
                        <line
                          x1={routingSource.x}
                          y1={routingSource.y}
                          x2={routingTarget.x}
                          y2={routingTarget.y}
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="8,6"
                          strokeLinecap="round"
                          className="animate-[dash_15s_linear_infinite]"
                          style={{
                            strokeDashoffset: 100
                          }}
                        />

                        {/* Animated traveling P2P token packet */}
                        {isSimulationActive && (
                          <motion.circle
                            r="4.5"
                            fill="#60a5fa"
                            style={{ filter: 'drop-shadow(0 0 6px #3b82f6)' }}
                            animate={{
                              cx: [routingSource.x, routingTarget.x],
                              cy: [routingSource.y, routingTarget.y]
                            }}
                            transition={{
                              duration: 2.2,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                        )}
                      </g>
                    )}

                    {/* Custom Placed Node Ghost Coordinate */}
                    {isPlacingNode && placedX !== null && placedY !== null && (
                      <g>
                        <circle cx={placedX} cy={placedY} r="18" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3,3" />
                        <line x1={placedX - 25} y1={placedY} x2={placedX + 25} y2={placedY} stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
                        <line x1={placedX} y1={placedY - 25} x2={placedX} y2={placedY + 25} stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
                        <circle cx={placedX} cy={placedY} r="3" fill="#22d3ee" />
                      </g>
                    )}

                    {/* Render Node terminals */}
                    {offlineNodes.map(node => {
                      const isSelected = selectedNode?.id === node.id;
                      const isSrc = routingSource?.id === node.id;
                      const isDst = routingTarget?.id === node.id;

                      // Color mappings
                      let nodeColor = '#a78bfa'; // default purple
                      if (node.type === 'core') nodeColor = '#f43f5e'; // rose/red
                      if (node.type === 'gateway') nodeColor = '#3b82f6'; // blue
                      if (node.type === 'server') nodeColor = '#22d3ee'; // cyan
                      if (node.type === 'mesh') nodeColor = '#10b981'; // emerald

                      return (
                        <g 
                          key={node.id} 
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(node);
                            haptic(10);
                          }}
                        >
                          {/* Selected node halo ripple rings */}
                          {isSelected && (
                            <>
                              <circle cx={node.x} cy={node.y} r="24" fill="none" stroke={nodeColor} strokeWidth="1" opacity="0.25" className="animate-[ping_3s_ease-out_infinite]" />
                              <circle cx={node.x} cy={node.y} r="18" fill="none" stroke={nodeColor} strokeWidth="1" opacity="0.4" />
                            </>
                          )}

                          {/* Radar ripple for alert states */}
                          {node.status === 'alert' && !isSelected && (
                            <circle cx={node.x} cy={node.y} r="20" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.4" className="animate-ping" />
                          )}

                          {/* Outer Node Circle */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="11"
                            fill="#0d071d"
                            stroke={isSelected ? '#ffffff' : nodeColor}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            style={{ filter: `drop-shadow(0 0 6px ${nodeColor}55)` }}
                          />

                          {/* Inner core circle */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="4.5"
                            fill={nodeColor}
                            className={node.status === 'online' ? 'animate-pulse' : ''}
                          />

                          {/* Label Text */}
                          <text
                            x={node.x}
                            y={node.y - 18}
                            textAnchor="middle"
                            fill={isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                            fontSize="10"
                            fontWeight={isSelected ? 'bold' : 'normal'}
                            fontFamily="monospace"
                            className="pointer-events-none drop-shadow-md select-none"
                          >
                            {node.name}
                          </text>

                          {/* Node ID label */}
                          <text
                            x={node.x}
                            y={node.y + 22}
                            textAnchor="middle"
                            fill="rgba(148, 163, 184, 0.5)"
                            fontSize="8"
                            fontFamily="monospace"
                            className="pointer-events-none select-none"
                          >
                            {node.sector}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Compass HUD Overlay */}
                <div className="absolute right-4 bottom-4 bg-slate-900/85 backdrop-blur border border-white/10 rounded-2xl p-3 text-left font-mono text-[9px] text-slate-400 space-y-1 shadow-2xl pointer-events-none select-none">
                  <p className="font-bold text-white flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-purple-400" />
                    COMPASS TELEMETRY
                  </p>
                  <p>MATRIX POSITION: X:{panX.toFixed(0)}, Y:{panY.toFixed(0)}</p>
                  <p>MAGNIFICATION: {zoomScale.toFixed(2)}x</p>
                  <p>SOVEREIGN HOST: LOCAL_LOOP_127_0_0_1</p>
                </div>

                {/* Node Detail Popup Card */}
                {selectedNode && (
                  <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur border border-purple-500/20 rounded-2xl p-4 shadow-2xl max-w-xs text-left">
                    <div className="flex justify-between items-start border-b border-white/[0.05] pb-2 mb-2">
                      <div>
                        <span className="text-[9px] font-bold font-mono text-purple-400 uppercase tracking-widest bg-purple-500/10 px-1.5 py-0.5 rounded">
                          {selectedNode.sector}
                        </span>
                        <h3 className="text-xs font-black text-white mt-1">{selectedNode.name}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedNode(null)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer px-1.5"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2 text-[10px] text-slate-300 leading-relaxed">
                      <p>{selectedNode.description}</p>
                      
                      <div className="p-2 bg-slate-950/60 rounded border border-white/5 space-y-1 font-mono text-[9px]">
                        <p><span className="text-slate-500">Node Class:</span> <span className="text-purple-300 capitalize font-bold">{selectedNode.type}</span></p>
                        <p><span className="text-slate-500">Local Status:</span> <span className="text-emerald-400 font-bold">ONLINE (100% PRIVATE)</span></p>
                        <p><span className="text-slate-500">Sync Vector:</span> <span>Grid coords [{selectedNode.x}, {selectedNode.y}]</span></p>
                      </div>

                      <div className="flex gap-2 pt-1.5 select-none">
                        <button
                          onClick={() => handleRouteClick(selectedNode)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-black font-bold text-[9px] border border-blue-500/30 hover:border-transparent transition-all cursor-pointer text-center"
                        >
                          Establish Tunnel Vector
                        </button>
                        {selectedNode.id.startsWith('custom-node') && (
                          <button
                            onClick={() => deleteNode(selectedNode.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                            title="Decommission Node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // --- SOVEREIGN ONLINE ENGINE (OpenStreetMap / Leaflet, 100% Free & Unlimited) ---
            <div className="flex-1 flex flex-col relative h-full">
              <div className="flex-1 w-full h-full relative">
                <iframe
                  ref={mapIframeRef}
                  title="Sovereign Online Map"
                  srcDoc={generateMapHTML(
                    mapCenter.lat,
                    mapCenter.lng,
                    mapZoom,
                    activePoi,
                    POIS,
                    navigation.position,
                    navigation.route,
                    navigation.followLocation && navigation.isTracking,
                    navigation.isNavigating
                  )}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />

                {/* DOWNSIDE DRIVING DIRECTIONS HUD OVERLAY */}
                {navigation.isNavigating && (
                  <div className="absolute top-4 left-4 right-4 bg-slate-900/90 border border-purple-500/25 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.5)] backdrop-blur text-left space-y-2 z-10 select-none animate-[slideDown_0.3s_ease]">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-purple-400 block font-mono">
                          {navigation.routingProfile === 'walking' ? '🚶 Walking Navigation' :
                           navigation.routingProfile === 'bicycling' ? '🚲 Bicycling Navigation' :
                           '🚘 Driving Navigation'} Active (Online Only)
                        </span>
                        <h3 className="text-sm font-black text-white leading-snug">
                          {navigation.currentInstruction}
                        </h3>
                      </div>
                      <button
                        onClick={() => { haptic(15); navigation.stopNavigation(); }}
                        className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer select-none"
                      >
                        End Route
                      </button>
                    </div>
                    
                    <div className="flex gap-4 text-[10px] font-mono text-slate-400 border-t border-white/5 pt-2">
                      <p><span className="text-slate-500">Distance:</span> <strong className="text-slate-200">{navigation.formattedDistance}</strong></p>
                      <p><span className="text-slate-500">Time:</span> <strong className="text-slate-200">{navigation.formattedDuration}</strong></p>
                      {navigation.offRoute && (
                        <p className="text-amber-400 animate-pulse font-bold ml-auto flex items-center gap-1">
                          ⚠️ Recalculating...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* GPS Sensor Error Overlay */}
                {navigation.gpsError && (
                  <div className="absolute bottom-4 left-4 bg-rose-950/90 border border-rose-500/30 text-rose-200 rounded-xl p-3 max-w-sm text-left text-[10px] font-semibold backdrop-blur shadow-2xl z-10">
                    {navigation.gpsError}
                  </div>
                )}

                {/* Search query state details badge overlay */}
                <div className="absolute top-4 right-4 bg-slate-900/95 border border-white/10 rounded-2xl p-3 shadow-xl text-left text-[10px] font-mono pointer-events-none space-y-1">
                  <p className="font-bold text-white uppercase tracking-wide">🛰️ Active Geo-Stream</p>
                  <p><span className="text-slate-500">Query:</span> <span className="text-purple-400">{onlineQuery}</span></p>
                  <p><span className="text-slate-500">Coords:</span> <span>{mapCenter.lat.toFixed(4)}°N, {mapCenter.lng.toFixed(4)}°W</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Generates an interactive, dark-styled OpenStreetMap Leaflet page with glowing neon markers
function generateMapHTML(
  lat: number,
  lng: number,
  zoom: number,
  activePoi: any,
  pois: any[],
  initialPosition: any,
  initialRoute: any,
  initialFollowLocation: boolean,
  initialIsNavigating: boolean
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #070312;
    }
    /* Dark mode styling for OpenStreetMap tiles to match our sci-fi neon theme */
    .leaflet-tile-container {
      filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(95%);
    }
    .leaflet-container {
      background: #070312;
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
    /* Style popup */
    .leaflet-popup-content-wrapper {
      background: rgba(15, 23, 42, 0.95);
      color: #f8fafc;
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
    }
    .leaflet-popup-tip {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(139, 92, 246, 0.4);
    }
    .leaflet-popup-content {
      font-size: 11px;
      line-height: 1.5;
    }
    .leaflet-popup-content strong {
      color: #a78bfa;
      font-size: 12px;
    }
    /* Custom colored marker icon styling using Leaflet divIcon */
    .custom-marker {
      background: #a78bfa;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px #a78bfa, 0 0 20px #a78bfa;
    }
    .active-marker {
      background: #38bdf8;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 12px #38bdf8, 0 0 24px #38bdf8;
      animation: pulse-marker 1.5s infinite;
    }
    .gps-marker-icon {
      background: #8b5cf6;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 12px #8b5cf6, 0 0 24px #8b5cf6;
    }
    @keyframes pulse-marker {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${lat}, ${lng}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const pois = ${JSON.stringify(pois)};
    const activePoi = ${activePoi ? JSON.stringify(activePoi) : 'null'};

    // Custom Icon helper
    const getIcon = (isActive) => {
      return L.divIcon({
        className: isActive ? 'active-marker' : 'custom-marker',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });
    };

    // Draw POIs
    pois.forEach(poi => {
      const isActive = activePoi && activePoi.title === poi.title;
      const marker = L.marker([poi.lat, poi.lng], {
        icon: getIcon(isActive)
      }).addTo(map);
      
      marker.bindPopup(\`
        <div style="padding: 2px;">
          <strong style="color: #a78bfa; font-size: 12px;">\${poi.title}</strong>
          <p style="margin: 4px 0 0 0; color: #cbd5e1; font-size: 10px;">\${poi.description}</p>
          <div style="margin-top: 8px; font-size: 8px; color: #a78bfa; font-family: monospace; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase;">Sovereign Node Coordinates</div>
        </div>
      \`);

      if (isActive) {
        marker.openPopup();
      }
    });

    // If active POI is searched (and not one of the presets)
    if (activePoi && !pois.some(p => p.lat === activePoi.lat && p.lng === activePoi.lng)) {
      const marker = L.marker([activePoi.lat, activePoi.lng], {
        icon: getIcon(true)
      }).addTo(map);
      
      marker.bindPopup(\`
        <div style="padding: 2px;">
          <strong style="color: #38bdf8; font-size: 12px;">\${activePoi.title}</strong>
          <p style="margin: 4px 0 0 0; color: #cbd5e1; font-size: 10px;">\${activePoi.description}</p>
          <div style="margin-top: 8px; font-size: 8px; color: #38bdf8; font-family: monospace; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase;">Located Coordinate Node</div>
        </div>
      \`).openPopup();
    }

    // Real-time GPS and routing layer variables
    let gpsMarker = null;
    let accuracyCircle = null;
    let routeLineOutline = null;
    let routeLine = null;

    function updateNavigationLayers(position, route, followLocation, isNavigating) {
      // 1. Position update
      if (position) {
        const pos = [position.latitude, position.longitude];
        if (!gpsMarker) {
          gpsMarker = L.marker(pos, {
            icon: L.divIcon({
              className: 'gps-marker-icon',
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            })
          }).addTo(map);
        } else {
          gpsMarker.setLatLng(pos);
        }

        if (accuracyCircle) {
          map.removeLayer(accuracyCircle);
        }
        accuracyCircle = L.circle(pos, {
          radius: position.accuracy,
          color: '#8b5cf6',
          fillColor: '#8b5cf6',
          fillOpacity: 0.12,
          weight: 1
        }).addTo(map);

        if (followLocation) {
          map.setView(pos, isNavigating ? 16 : 14);
        }
      } else {
        if (gpsMarker) {
          map.removeLayer(gpsMarker);
          gpsMarker = null;
        }
        if (accuracyCircle) {
          map.removeLayer(accuracyCircle);
          accuracyCircle = null;
        }
      }

      // 2. Route update
      if (route && route.coordinates && route.coordinates.length > 0) {
        const latLngs = route.coordinates.map(c => [c[1], c[0]]);
        if (!routeLineOutline) {
          routeLineOutline = L.polyline(latLngs, {
            color: '#24123f',
            weight: 10,
            opacity: 0.85
          }).addTo(map);
        } else {
          routeLineOutline.setLatLngs(latLngs);
        }

        if (!routeLine) {
          routeLine = L.polyline(latLngs, {
            color: '#a855f7',
            weight: 6,
            opacity: 0.95
          }).addTo(map);
        } else {
          routeLine.setLatLngs(latLngs);
        }
      } else {
        if (routeLineOutline) {
          map.removeLayer(routeLineOutline);
          routeLineOutline = null;
        }
        if (routeLine) {
          map.removeLayer(routeLine);
          routeLine = null;
        }
      }
    }

    // Initialize with template data if present
    const initPos = ${initialPosition ? JSON.stringify(initialPosition) : 'null'};
    const initRoute = ${initialRoute ? JSON.stringify(initialRoute) : 'null'};
    const initFollow = ${initialFollowLocation ? 'true' : 'false'};
    const initNav = ${initialIsNavigating ? 'true' : 'false'};
    updateNavigationLayers(initPos, initRoute, initFollow, initNav);

    // Listen for parent messages
    window.addEventListener('message', (e) => {
      const { type, position, route, followLocation, isNavigating } = e.data || {};
      if (type === 'navigation-update') {
        updateNavigationLayers(position, route, followLocation, isNavigating);
      }
    });
  </script>
</body>
</html>
  `;
}
