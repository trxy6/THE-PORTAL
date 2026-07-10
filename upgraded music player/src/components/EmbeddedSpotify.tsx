/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Disc, ExternalLink, HelpCircle } from "lucide-react";

interface EmbeddedSpotifyProps {
  type: "track" | "playlist" | "album" | "artist";
  id: string;
}

// Parses open.spotify.com URLs or spotify: uri protocols
export function parseSpotifyUrl(url: string): { type: "track" | "playlist" | "album" | "artist"; id: string } | null {
  try {
    const cleaned = url.trim();
    const webPattern = /open\.spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/;
    const uriPattern = /spotify:(track|playlist|album|artist):([a-zA-Z0-9]+)/;

    const webMatch = cleaned.match(webPattern);
    if (webMatch) {
      return {
        type: webMatch[1] as "track" | "playlist" | "album" | "artist",
        id: webMatch[2],
      };
    }

    const uriMatch = cleaned.match(uriPattern);
    if (uriMatch) {
      return {
        type: uriMatch[1] as "track" | "playlist" | "album" | "artist",
        id: uriMatch[2],
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

export default function EmbeddedSpotify({ type, id }: EmbeddedSpotifyProps) {
  if (!id) {
    return (
      <div id="embed-empty" className="h-[352px] bg-zinc-900/40 border-2 border-dashed border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-zinc-500">
        <Disc className="w-12 h-12 mb-3 text-zinc-700 animate-spin" style={{ animationDuration: "10s" }} />
        <p className="text-sm font-medium">No Player Loaded</p>
        <p className="text-xs text-zinc-600 max-w-[280px] mt-1">
          Select any track from search or paste a Spotify link to activate.
        </p>
      </div>
    );
  }

  // Generate official embed source URL
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;

  return (
    <div id="embed-spotify-box" className="w-full h-full flex flex-col bg-zinc-950 rounded-2xl border border-zinc-800/60 overflow-hidden shadow-2xl transition-all duration-300">
      {/* Embedded Iframe */}
      <div className="flex-1 relative min-h-[352px]">
        <iframe
          id="spotify-embed-iframe"
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ minHeight: "352px" }}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-t-2xl border-none block w-full bg-black"
        />
      </div>

      {/* Embedded Footer Information */}
      <div className="bg-zinc-950 px-4 py-3 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-zinc-400 capitalize">{type} Embed Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            id="open-spotify-external-link"
            href={`https://open.spotify.com/${type}/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-emerald-400 transition"
          >
            <span>Open App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className="relative group cursor-help">
            <HelpCircle className="w-4 h-4 text-zinc-600 hover:text-zinc-400 transition" />
            <div className="absolute right-0 bottom-full mb-2 w-64 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 leading-relaxed pointer-events-none">
              Spotify embeds play standard 30s previews. Log into Spotify in your active browser to play full-length tracks natively!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
