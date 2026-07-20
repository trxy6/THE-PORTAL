/**
 * @license
 * SPDX-License-Identifier: Meta Wearables Developer Platform SDK / Apache-2.0
 */

export type MetaNeuralGesture =
  | 'PINCH'
  | 'DOUBLE_PINCH'
  | 'HOLD_PINCH'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'SWIPE_UP'
  | 'SWIPE_DOWN'
  | 'MICRO_TAP'
  | 'WRIST_FLICK';

export interface MetaNeuralEventDetail {
  gesture: MetaNeuralGesture;
  confidence: number;
  emgSignalStrength: number; // 0.0 to 1.0
  timestamp: number;
}

export type MetaGestureCallback = (detail: MetaNeuralEventDetail) => void;

class MetaWearableSDKBridge {
  private callbacks: Set<MetaGestureCallback> = new Set();
  private emgActive: boolean = true;
  private hapticsSupported: boolean = true;

  constructor() {
    this.initEventListeners();
  }

  private initEventListeners() {
    if (typeof window === 'undefined') return;

    // Listen for official Meta Wearables custom event: meta:neural_gesture
    window.addEventListener('meta:neural_gesture', (e: Event) => {
      const customEvt = e as CustomEvent<MetaNeuralEventDetail>;
      if (customEvt.detail) {
        this.emit(customEvt.detail);
      }
    });

    // Keyboard Fallback for Neural Band testing
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      let gesture: MetaNeuralGesture | null = null;

      if (e.key === 'Enter' || e.key === ' ') gesture = 'PINCH';
      else if (e.key === 'Escape' || e.key === 'Backspace') gesture = 'DOUBLE_PINCH';
      else if (e.key === 'ArrowUp') gesture = 'SWIPE_UP';
      else if (e.key === 'ArrowDown') gesture = 'SWIPE_DOWN';
      else if (e.key === 'ArrowLeft') gesture = 'SWIPE_LEFT';
      else if (e.key === 'ArrowRight') gesture = 'SWIPE_RIGHT';
      else if (e.key === 'h' || e.key === 'H') gesture = 'HOLD_PINCH';
      else if (e.key === 'f' || e.key === 'F') gesture = 'WRIST_FLICK';

      if (gesture) {
        this.simulateGesture(gesture);
      }
    });
  }

  /**
   * Register a callback for Meta Neural Band EMG Gestures
   */
  public onGesture(callback: MetaGestureCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Emit Neural Band wristband haptic feedback pulse
   */
  public triggerWristHaptic(pattern: 'tap' | 'double_tap' | 'warning' | 'success') {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (pattern === 'tap') navigator.vibrate(15);
      else if (pattern === 'double_tap') navigator.vibrate([15, 30, 15]);
      else if (pattern === 'warning') navigator.vibrate([40, 50, 40]);
      else if (pattern === 'success') navigator.vibrate([20, 30, 40]);
    }
  }

  /**
   * Dispatch a simulated gesture for testing & developer tooling
   */
  public simulateGesture(gesture: MetaNeuralGesture, confidence: number = 0.98) {
    const detail: MetaNeuralEventDetail = {
      gesture,
      confidence,
      emgSignalStrength: 0.95,
      timestamp: Date.now(),
    };

    this.triggerWristHaptic(
      gesture === 'PINCH' ? 'tap' : gesture === 'DOUBLE_PINCH' ? 'double_tap' : 'tap'
    );

    this.emit(detail);
  }

  private emit(detail: MetaNeuralEventDetail) {
    this.callbacks.forEach((cb) => cb(detail));
  }

  /**
   * Meta Ray-Ban Waveguide Optical Display Config
   */
  public getWaveguideDisplaySpecs() {
    return {
      resolution: { width: 600, height: 600 },
      backgroundColor: '#000000', // 100% Transparent Black in physical optics
      accentColor: '#8b5cf6', // Waveguide Glowing Purple Focus Outline
      textColor: '#ffffff',
      refreshRateHz: 60,
      fieldOfViewDegrees: 20,
    };
  }
}

export const metaWearableSDK = new MetaWearableSDKBridge();
