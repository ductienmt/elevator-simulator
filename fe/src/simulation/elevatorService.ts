import type { CallDirection, Elevator, ElevatorId, SimulationSnapshot } from "./simulationTypes";

/**
 * The contract React talks to. Backed by SocketElevatorService when connected to backend.
 */
export interface ElevatorService {
  getSnapshot(): SimulationSnapshot;
  getElevators(): Elevator[];
  subscribe(listener: () => void): () => void;

  callElevator(floor: number, direction: CallDirection): void;
  selectDestination(elevatorId: ElevatorId, floor: number): void;
  /** Opens the door (if stopped) and keeps it open until closeDoor is called. */
  openDoor(elevatorId: ElevatorId): void;
  closeDoor(elevatorId: ElevatorId): void;

  pause(): void;
  resume(): void;
  reset(): void;
  dispose(): void;
}