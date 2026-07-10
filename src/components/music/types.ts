/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Track {
  id: string;          // Unique identifier, usually the Spotify Track ID
  title: string;       // Name of the song
  artist: string;      // Performing artist
  album?: string;      // Album name
  spotifyId: string;   // Exact Spotify Track ID (used in embeds)
  spotifyUri: string;  // Full Spotify URL
  imageUrl?: string;   // Album artwork
  duration?: string;   // E.g., "3:45"
  genre?: string;      // Genre tag
}

export interface Playlist {
  id: string;          // Unique ID
  name: string;        // Name of the playlist
  description?: string; // Short subtitle/mood description
  tracks: Track[];     // List of track objects
  isCustom?: boolean;  // True if created by the user in-app
  isSpotifyRemote?: boolean; // True if this is a remote Spotify playlist
  imageUrl?: string;   // Playlist artwork cover url
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number; // Simulated progress (percentage or seconds)
  queue: Track[];
  history: Track[];
}

export interface SearchResponse {
  tracks: Track[];
  query: string;
  suggestedPlaylists?: Playlist[];
}
