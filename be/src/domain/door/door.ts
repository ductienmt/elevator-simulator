import { DoorState } from './door-state.enum.js';

export interface DoorOptions {
  autoCloseDelayMs?: number;
  onAutoClose?: () => void;
  onStateChange?: (state: DoorState) => void;
}

export class Door {
  private state: DoorState = DoorState.CLOSED;
  private autoCloseDelayMs: number;
  private autoCloseTimer: NodeJS.Timeout | null = null;
  private isHeldOpen: boolean = false;
  private remainingCountdownSeconds: number | null = null;
  private onAutoClose?: () => void;
  private onStateChange?: (state: DoorState) => void;

  constructor(options: DoorOptions = {}) {
    this.autoCloseDelayMs = options.autoCloseDelayMs ?? 3000;
    this.onAutoClose = options.onAutoClose;
    this.onStateChange = options.onStateChange;
  }

  public getState(): DoorState {
    return this.state;
  }

  public isOpen(): boolean {
    return this.state === DoorState.OPEN;
  }

  public isHeld(): boolean {
    return this.isHeldOpen;
  }

  public getCountdown(): number | null {
    return this.remainingCountdownSeconds;
  }

  public open(): void {
    if (this.state === DoorState.OPEN) {
      this.scheduleAutoClose();
      return;
    }

    this.state = DoorState.OPEN;
    this.isHeldOpen = false;
    this.scheduleAutoClose();

    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  public close(): void {
    this.clearAutoCloseTimer();
    this.isHeldOpen = false;
    this.remainingCountdownSeconds = null;

    if (this.state === DoorState.OPEN) {
      this.state = DoorState.CLOSED;
      if (this.onStateChange) {
        this.onStateChange(this.state);
      }
    }
  }

  public keepOpen(delayMs?: number): void {
    if (this.state !== DoorState.OPEN) {
      this.open();
    }

    this.clearAutoCloseTimer();
    this.isHeldOpen = true;

    if (delayMs && delayMs > 0) {
      this.autoCloseDelayMs = delayMs;
      this.scheduleAutoClose();
    } else {
      this.remainingCountdownSeconds = null;
    }
  }

  private scheduleAutoClose(): void {
    this.clearAutoCloseTimer();

    if (this.autoCloseDelayMs <= 0) {
      return;
    }

    this.remainingCountdownSeconds = Math.ceil(this.autoCloseDelayMs / 1000);

    this.autoCloseTimer = setTimeout(() => {
      if (this.isHeldOpen) {
        return;
      }
      this.close();
      if (this.onAutoClose) {
        this.onAutoClose();
      }
    }, this.autoCloseDelayMs);
  }

  private clearAutoCloseTimer(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  public setCallbacks(callbacks: {
    onAutoClose?: () => void;
    onStateChange?: (state: DoorState) => void;
  }): void {
    if (callbacks.onAutoClose) this.onAutoClose = callbacks.onAutoClose;
    if (callbacks.onStateChange) this.onStateChange = callbacks.onStateChange;
  }
}
