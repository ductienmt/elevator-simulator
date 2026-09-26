import type { ElevatorService } from "./elevatorService";
import {
  TICK_MS,
  addDestination,
  addHallCall,
  closeDoor,
  createInitialEngineState,
  holdDoor,
  stepEngine,
  toSnapshot,
  type EngineState } from
"./elevatorSimulation";
import { nearestElevatorScheduler } from "./mockScheduler";
import type { CallDirection, ElevatorId, Scheduler, SimulationSnapshot } from "./simulationTypes";

/**
 * In-browser implementation of ElevatorService. Runs the pure engine on a
 * single interval that only exists while someone is subscribed and the
 * simulation is running — so unmounting always cleans up.
 */
export class MockElevatorService implements ElevatorService {
  private state: EngineState;
  private running = true;
  private snapshot: SimulationSnapshot;
  private listeners = new Set<() => void>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private scheduler: Scheduler;

  constructor(scheduler: Scheduler = nearestElevatorScheduler) {
    this.scheduler = scheduler;
    this.state = createInitialEngineState();
    this.snapshot = toSnapshot(this.state, this.running);
  }

  // Arrow properties so they can be passed straight to useSyncExternalStore.
  getSnapshot = (): SimulationSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    this.syncTimer();
    return () => {
      this.listeners.delete(listener);
      this.syncTimer();
    };
  };

  getElevators() {
    return this.snapshot.elevators;
  }

  callElevator(floor: number, direction: CallDirection) {
    this.commit(addHallCall(this.state, floor, direction));
  }

  selectDestination(elevatorId: ElevatorId, floor: number) {
    this.commit(addDestination(this.state, elevatorId, floor));
  }

  openDoor(elevatorId: ElevatorId) {
    this.commit(holdDoor(this.state, elevatorId));
  }

  closeDoor(elevatorId: ElevatorId) {
    this.commit(closeDoor(this.state, elevatorId));
  }

  pause() {
    this.running = false;
    this.syncTimer();
    this.emit();
  }

  resume() {
    this.running = true;
    this.syncTimer();
    this.emit();
  }

  reset() {
    this.state = createInitialEngineState();
    this.running = true;
    this.syncTimer();
    this.emit();
  }

  dispose() {
    this.listeners.clear();
    this.syncTimer();
  }

  private commit(next: EngineState) {
    if (next === this.state) return;
    this.state = next;
    this.emit();
  }

  private emit() {
    this.snapshot = toSnapshot(this.state, this.running);
    this.listeners.forEach((listener) => listener());
  }

  private syncTimer() {
    const shouldRun = this.running && this.listeners.size > 0;
    if (shouldRun && this.intervalId === null) {
      this.intervalId = setInterval(() => {
        this.state = stepEngine(this.state, this.scheduler);
        this.emit();
      }, TICK_MS);
    } else if (!shouldRun && this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}