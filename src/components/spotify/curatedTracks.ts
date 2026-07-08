/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Track, Playlist } from "./types";

// Curated high-fidelity royalty-free streaming track URLs
export const POP_TRACKS: Track[] = [
  {
    id: "lumina-chill",
    title: "Lumina Chillwave",
    artist: "Aether Pilot",
    album: "Atmospheric Pulse",
    spotifyId: "0VjIjW4GlUZg7UpZCmPx6i",
    spotifyUri: "https://open.spotify.com/track/0VjIjW4GlUZg7UpZCmPx6i",
    imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=60",
    duration: "6:12",
    genre: "Chillwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "midnight-drive",
    title: "Midnight Drive",
    artist: "Synth Runner",
    album: "Neon Horizons",
    spotifyId: "4D7gV617mcy69j0Y6vY69a",
    spotifyUri: "https://open.spotify.com/track/4D7gV617mcy69j0Y6vY69a",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=60",
    duration: "7:05",
    genre: "Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "aether-flow",
    title: "Aether Flow",
    artist: "Solaris",
    album: "Solar Wind",
    spotifyId: "1BxfuN5ptOIGg7u44gLM70",
    spotifyUri: "https://open.spotify.com/track/1BxfuN5ptOIGg7u44gLM70",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60",
    duration: "5:44",
    genre: "Lofi Ambient",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

export const CHILL_LOFI_TRACKS: Track[] = [
  {
    id: "nebula-dream",
    title: "Nebula Dream",
    artist: "Lofi Dreamer",
    album: "Cozy Space Beats",
    spotifyId: "7ou7i7ZgYf4g4x7ou7i7Zg",
    spotifyUri: "https://open.spotify.com/track/7ou7i7ZgYf4g4x7ou7i7Zg",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=60",
    duration: "5:02",
    genre: "Lofi Hip Hop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
  {
    id: "cosmic-horizon",
    title: "Cosmic Horizon",
    artist: "Aura Ambient",
    album: "Nebular Waves",
    spotifyId: "3z8h06YgYf4g4x3z8h06Yg",
    spotifyUri: "https://open.spotify.com/track/3z8h06YgYf4g4x3z8h06Yg",
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=60",
    duration: "6:03",
    genre: "Ambient",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
  }
];

export const SYNTHWAVE_TRACKS: Track[] = [
  {
    id: "quantum-pulse",
    title: "Quantum Pulse",
    artist: "Laser Hawk",
    album: "Cyber Grid",
    spotifyId: "2x8h06YgYf4g4x2x8h06Yg",
    spotifyUri: "https://open.spotify.com/track/2x8h06YgYf4g4x2x8h06Yg",
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&auto=format&fit=crop&q=60",
    duration: "5:42",
    genre: "Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
  },
  {
    id: "solar-flare",
    title: "Solar Flare",
    artist: "Retro Wave",
    album: "Neon Sunset",
    spotifyId: "4ox7f8f9G4LToZ8LqP6clF",
    spotifyUri: "https://open.spotify.com/track/4ox7f8f9G4LToZ8LqP6clF",
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=60",
    duration: "6:23",
    genre: "Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"
  }
];

export const FALLBACK_TRACKS: Track[] = [
  ...POP_TRACKS,
  ...CHILL_LOFI_TRACKS,
  ...SYNTHWAVE_TRACKS
];

export const CURATED_PLAYLISTS: Playlist[] = [
  {
    id: "curated-chillwave",
    name: "Lumina Chillwave",
    description: "Relaxing retro atmospheric waves",
    tracks: POP_TRACKS,
    isCustom: false,
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300"
  },
  {
    id: "curated-lofi",
    name: "Lofi Dreamscapes",
    description: "Warm vinyl aesthetics and cozy beats",
    tracks: CHILL_LOFI_TRACKS,
    isCustom: false,
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300"
  },
  {
    id: "curated-synthwave",
    name: "Neon Horizons",
    description: "Cyberpunk grids and retro-futuristic runs",
    tracks: SYNTHWAVE_TRACKS,
    isCustom: false,
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300"
  }
];
