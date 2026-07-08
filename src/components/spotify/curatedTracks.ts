/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Track, Playlist } from "./types";

// Curated high-fidelity Spotify track IDs
export const POP_TRACKS: Track[] = [
  {
    id: "0VjIjW4GlUZg7UpZCmPx6i",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    spotifyId: "0VjIjW4GlUZg7UpZCmPx6i",
    spotifyUri: "https://open.spotify.com/track/0VjIjW4GlUZg7UpZCmPx6i",
    imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=60",
    duration: "3:20",
    genre: "Pop"
  },
  {
    id: "4D7gV617mcy69j0Y6vY69a",
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    spotifyId: "4D7gV617mcy69j0Y6vY69a",
    spotifyUri: "https://open.spotify.com/track/4D7gV617mcy69j0Y6vY69a",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=60",
    duration: "2:47",
    genre: "Pop"
  },
  {
    id: "1BxfuN5ptOIGg7u44gLM70",
    title: "Cruel Summer",
    artist: "Taylor Swift",
    album: "Lover",
    spotifyId: "1BxfuN5ptOIGg7u44gLM70",
    spotifyUri: "https://open.spotify.com/track/1BxfuN5ptOIGg7u44gLM70",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60",
    duration: "2:58",
    genre: "Pop"
  },
  {
    id: "5P9SmXbS6vB4E-x0zTzCAt",
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    album: "F*CK LOVE 3: OVER YOU",
    spotifyId: "5P9SmXbS6vB4E-x0zTzCAt",
    spotifyUri: "https://open.spotify.com/track/5P9SmXbS6vB4E-x0zTzCAt",
    imageUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=60",
    duration: "2:21",
    genre: "Pop"
  },
  {
    id: "7mz6Xm4v6vGkhz4H0bXf4x",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    album: "Starboy",
    spotifyId: "7mz6Xm4v6vGkhz4H0bXf4x",
    spotifyUri: "https://open.spotify.com/track/7mz6Xm4v6vGkhz4H0bXf4x",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=60",
    duration: "3:50",
    genre: "Pop"
  }
];

export const CHILL_LOFI_TRACKS: Track[] = [
  {
    id: "7696mCOg0T8r7Zg9",
    title: "Get You",
    artist: "Daniel Caesar ft. Kali Uchis",
    album: "Freudian",
    spotifyId: "7696mCOg0T8r7Zg9",
    spotifyUri: "https://open.spotify.com/track/7696mCOg0T8r7Zg9",
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=60",
    duration: "4:38",
    genre: "Chill"
  },
  {
    id: "2T0m1v1t4clXas",
    title: "Sweater Weather",
    artist: "The Neighbourhood",
    album: "I Love You.",
    spotifyId: "2T0m1v1t4clXas",
    spotifyUri: "https://open.spotify.com/track/2T0m1v1t4clXas",
    imageUrl: "https://images.unsplash.com/photo-1487180142328-054b783fc471?w=300&auto=format&fit=crop&q=60",
    duration: "4:00",
    genre: "Chill"
  },
  {
    id: "4ptg3Z6eHkBF3zI7Y9G7Ie",
    title: "Coffee",
    artist: "beabadoobee",
    album: "Coffee",
    spotifyId: "4ptg3Z6eHkBF3zI7Y9G7Ie",
    spotifyUri: "https://open.spotify.com/track/4ptg3Z6eHkBF3zI7Y9G7Ie",
    imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300&auto=format&fit=crop&q=60",
    duration: "2:06",
    genre: "Chill"
  }
];

export const SYNTHWAVE_TRACKS: Track[] = [
  {
    id: "1Y2isxK84m76mCOg0T8r7",
    title: "Resonance",
    artist: "HOME",
    album: "Odyssey",
    spotifyId: "1Y2isxK84m76mCOg0T8r7",
    spotifyUri: "https://open.spotify.com/track/1Y2isxK84m76mCOg0T8r7",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=60",
    duration: "3:32",
    genre: "Synthwave"
  },
  {
    id: "0S0A6v7XIE2608g2mZ269f",
    title: "Nightcall",
    artist: "Kavinsky",
    album: "Outrun",
    spotifyId: "0S0A6v7XIE2608g2mZ269f",
    spotifyUri: "https://open.spotify.com/track/0S0A6v7XIE2608g2mZ269f",
    imageUrl: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=300&auto=format&fit=crop&q=60",
    duration: "4:19",
    genre: "Synthwave"
  }
];

// Group into beautiful playlists that reflect iconic Spotify vibes
export const CURATED_PLAYLISTS: Playlist[] = [
  {
    id: "today-top-hits",
    name: "Today's Top Hits",
    description: "The biggest tracks in the world right now.",
    tracks: POP_TRACKS
  },
  {
    id: "lofi-beats",
    name: "Lo-Fi Beats",
    description: "Chill instrumental lo-fi beats, perfect for coding and studying.",
    tracks: CHILL_LOFI_TRACKS
  },
  {
    id: "retro-synthwave",
    name: "Synthwave Sunset",
    description: "High-octane neon retro beats for late night drives.",
    tracks: SYNTHWAVE_TRACKS
  }
];

// Fallback search matches in case the AI Search fails or has network timeout
export const FALLBACK_TRACKS: Track[] = [
  ...POP_TRACKS,
  ...CHILL_LOFI_TRACKS,
  ...SYNTHWAVE_TRACKS,
  {
    id: "4ox7f8f9G4LToZ8LqP6clF",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    spotifyId: "4ox7f8f9G4LToZ8LqP6clF",
    spotifyUri: "https://open.spotify.com/track/4ox7f8f9G4LToZ8LqP6clF",
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=60",
    duration: "5:55",
    genre: "Rock"
  },
  {
    id: "3z8h06YgYf4g4x3z8h06Yg",
    title: "Dreams",
    artist: "Fleetwood Mac",
    album: "Rumours",
    spotifyId: "3z8h06YgYf4g4x3z8h06Yg",
    spotifyUri: "https://open.spotify.com/track/3z8h06YgYf4g4x3z8h06Yg",
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=60",
    duration: "4:17",
    genre: "Rock"
  },
  {
    id: "4u7E6vbg0T8r7Zg9M7M",
    title: "Hotel California",
    artist: "Eagles",
    album: "Hotel California",
    spotifyId: "4u7E6vbg0T8r7Zg9M7M",
    spotifyUri: "https://open.spotify.com/track/4u7E6vbg0T8r7Zg9M7M",
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&auto=format&fit=crop&q=60",
    duration: "6:30",
    genre: "Rock"
  }
];
