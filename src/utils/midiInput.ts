// Web MIDI API support for external keyboard input

export interface MIDIInputState {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  error: string | null;
}

export interface MIDICallbacks {
  onNoteOn?: (note: number, velocity: number) => void;
  onNoteOff?: (note: number) => void;
  onConnectionChange?: (connected: boolean, deviceName: string | null) => void;
}

class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private activeInput: MIDIInput | null = null;
  private callbacks: MIDICallbacks = {};
  private state: MIDIInputState = {
    isSupported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
    isConnected: false,
    deviceName: null,
    error: null,
  };

  getState(): MIDIInputState {
    return { ...this.state };
  }

  setCallbacks(callbacks: MIDICallbacks) {
    this.callbacks = callbacks;
  }

  async initialize(): Promise<MIDIInputState> {
    if (!this.state.isSupported) {
      this.state.error = 'Web MIDI API is not supported in this browser';
      return this.state;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();

      // Listen for device connections/disconnections
      this.midiAccess.onstatechange = (event) => {
        this.handleStateChange(event);
      };

      // Connect to first available input
      this.connectToFirstInput();

      return this.state;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to access MIDI devices';
      return this.state;
    }
  }

  private connectToFirstInput() {
    if (!this.midiAccess) return;

    const inputs = Array.from(this.midiAccess.inputs.values());

    if (inputs.length > 0) {
      this.connectToInput(inputs[0]);
    } else {
      this.state.isConnected = false;
      this.state.deviceName = null;
      this.callbacks.onConnectionChange?.(false, null);
    }
  }

  private connectToInput(input: MIDIInput) {
    // Disconnect from previous input
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
    }

    this.activeInput = input;
    this.activeInput.onmidimessage = (event) => this.handleMIDIMessage(event);

    this.state.isConnected = true;
    this.state.deviceName = input.name || 'Unknown Device';
    this.state.error = null;

    this.callbacks.onConnectionChange?.(true, this.state.deviceName);
  }

  private handleStateChange(event: MIDIConnectionEvent) {
    const port = event.port;

    if (port?.type === 'input') {
      if (port.state === 'connected') {
        // New input connected
        if (!this.state.isConnected) {
          this.connectToInput(port as MIDIInput);
        }
      } else if (port.state === 'disconnected') {
        // Input disconnected
        if (this.activeInput?.id === port.id) {
          this.activeInput = null;
          this.connectToFirstInput(); // Try to find another input
        }
      }
    }
  }

  private handleMIDIMessage(event: MIDIMessageEvent) {
    const data = event.data;
    if (!data || data.length < 2) return;

    const status = data[0];
    const note = data[1];
    const velocity = data.length > 2 ? data[2] : 0;

    // Note On (status 144-159 for channels 1-16)
    if (status >= 144 && status <= 159) {
      if (velocity > 0) {
        this.callbacks.onNoteOn?.(note, velocity / 127);
      } else {
        // Note On with velocity 0 is treated as Note Off
        this.callbacks.onNoteOff?.(note);
      }
    }
    // Note Off (status 128-143 for channels 1-16)
    else if (status >= 128 && status <= 143) {
      this.callbacks.onNoteOff?.(note);
    }
  }

  getAvailableInputs(): { id: string; name: string }[] {
    if (!this.midiAccess) return [];

    return Array.from(this.midiAccess.inputs.values()).map(input => ({
      id: input.id,
      name: input.name || 'Unknown Device',
    }));
  }

  selectInput(inputId: string): boolean {
    if (!this.midiAccess) return false;

    const input = this.midiAccess.inputs.get(inputId);
    if (input) {
      this.connectToInput(input);
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }

    this.state.isConnected = false;
    this.state.deviceName = null;
    this.callbacks.onConnectionChange?.(false, null);
  }

  cleanup() {
    this.disconnect();
    this.callbacks = {};
    this.midiAccess = null;
  }
}

// Singleton instance
export const midiManager = new MIDIManager();

// React hook for MIDI input
import { useState, useEffect, useCallback } from 'react';

export function useMIDIInput(callbacks?: MIDICallbacks) {
  const [state, setState] = useState<MIDIInputState>(midiManager.getState());

  useEffect(() => {
    // Set callbacks
    midiManager.setCallbacks({
      ...callbacks,
      onConnectionChange: (connected, deviceName) => {
        setState(prev => ({ ...prev, isConnected: connected, deviceName }));
        callbacks?.onConnectionChange?.(connected, deviceName);
      },
    });

    // Initialize MIDI
    midiManager.initialize().then(newState => {
      setState(newState);
    });

    return () => {
      // Don't cleanup on unmount - keep MIDI connection alive
    };
  }, []);

  // Update callbacks when they change
  useEffect(() => {
    if (callbacks) {
      midiManager.setCallbacks({
        ...callbacks,
        onConnectionChange: (connected, deviceName) => {
          setState(prev => ({ ...prev, isConnected: connected, deviceName }));
          callbacks?.onConnectionChange?.(connected, deviceName);
        },
      });
    }
  }, [callbacks?.onNoteOn, callbacks?.onNoteOff]);

  const refresh = useCallback(async () => {
    const newState = await midiManager.initialize();
    setState(newState);
  }, []);

  const selectDevice = useCallback((deviceId: string) => {
    midiManager.selectInput(deviceId);
    setState(midiManager.getState());
  }, []);

  const getDevices = useCallback(() => {
    return midiManager.getAvailableInputs();
  }, []);

  return {
    ...state,
    refresh,
    selectDevice,
    getDevices,
  };
}
