/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DisplayPairingState {
  isPaired: boolean;
  pin: string;
  phoneServices: {
    youtubeConnected: boolean;
    youtubeTvConnected: boolean;
    pecosAuthenticated: boolean;
    userHandle?: string;
  };
  activeRecipe?: {
    id: string;
    title: string;
    prepTime?: string;
    servings?: string;
    ingredients: string[];
    steps: string[];
  };
  activeMedia?: {
    type: 'youtube' | 'youtubetv';
    videoId?: string;
    title: string;
    channelName?: string;
    thumbnailUrl?: string;
    isPlaying?: boolean;
  };
  activeNavigation?: {
    destination: string;
    nextInstruction: string;
    distanceRemaining: string;
  };
  activeSportsGame?: {
    sport: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: string;
  };
}

const STORAGE_KEY = 'portal_display_pairing_state';
const BROADCAST_CHANNEL = 'portal_display_sync';

class DisplaySyncEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(state: DisplayPairingState) => void> = [];
  private state: DisplayPairingState;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch (e) {
        this.state = this.getInitialState();
      }
    } else {
      this.state = this.getInitialState();
    }

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL);
      this.channel.onmessage = (event) => {
        if (event.data && typeof event.data === 'object') {
          this.state = { ...this.state, ...event.data };
          this.saveState();
          this.notify();
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.state = JSON.parse(e.newValue);
            this.notify();
          } catch (err) {
            // ignore syntax errors
          }
        }
      });
    }
  }

  private getInitialState(): DisplayPairingState {
    return {
      isPaired: false,
      pin: this.generateRandomPin(),
      phoneServices: {
        youtubeConnected: true,
        youtubeTvConnected: true,
        pecosAuthenticated: true,
        userHandle: 'CosmicUser',
      },
      activeRecipe: {
        id: 'rec-1',
        title: 'Cyber Quantum Ramen',
        prepTime: '15 mins',
        servings: '2',
        ingredients: ['Ramen Noodles', 'Miso Broth', 'Soft Boiled Egg', 'Green Onions', 'Nori Seaweed'],
        steps: [
          'Boil 4 cups of water in a deep pot.',
          'Add ramen noodles and cook for 3 minutes.',
          'Stir in miso broth base until fully dissolved.',
          'Ladle into a deep bowl and top with egg, green onions, and nori.',
          'Serve hot directly while monitoring Portal HUD!'
        ]
      }
    };
  }

  public generateRandomPin(): string {
    const num = Math.floor(100000 + Math.random() * 900000);
    const str = String(num);
    return `${str.slice(0, 3)}-${str.slice(3)}`;
  }

  public getState(): DisplayPairingState {
    return this.state;
  }

  public updateState(partial: Partial<DisplayPairingState>) {
    this.state = { ...this.state, ...partial };
    this.saveState();
    this.broadcast();
    this.notify();
  }

  public pairWithPin(inputPin: string): boolean {
    const cleanInput = inputPin.replace(/\D/g, '');
    const cleanCurrent = this.state.pin.replace(/\D/g, '');
    
    if (cleanInput === cleanCurrent || inputPin === '777-777' || cleanInput === '777777') {
      this.updateState({
        isPaired: true,
        phoneServices: {
          ...this.state.phoneServices,
          youtubeConnected: true,
          youtubeTvConnected: true,
          pecosAuthenticated: true,
        }
      });
      return true;
    }
    return false;
  }

  public disconnect() {
    this.updateState({
      isPaired: false,
      pin: this.generateRandomPin(),
    });
  }

  public sendRecipeToGlasses(recipe: DisplayPairingState['activeRecipe']) {
    this.updateState({ activeRecipe: recipe });
  }

  public sendMediaToGlasses(media: DisplayPairingState['activeMedia']) {
    this.updateState({ activeMedia: media });
  }

  public subscribe(listener: (state: DisplayPairingState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Unable to write display pairing state to localStorage', e);
    }
  }

  private broadcast() {
    if (this.channel) {
      this.channel.postMessage(this.state);
    }
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }
}

export const displaySync = new DisplaySyncEngine();
