export type Direction = "UP" | "DOWN" | "IDLE";
export type CallDirection = Exclude<Direction, "IDLE">;
export type ElevatorState = "MOVING" | "STOPPED" | "DOOR_OPEN" | "DOOR_CLOSED";
export type DoorStatus = "OPEN" | "CLOSING" | "CLOSED";

export type ElevatorId = string | number;

export interface Elevator {
  id: ElevatorId;
  currentFloor: number;
  direction: Direction;
  state: ElevatorState;
  doorOpen: boolean;
  doorStatus: DoorStatus;
  /** True while "Keep Door Open" is active — auto-close is suspended. */
  doorHeld: boolean;
  /** Seconds until the door auto-closes, or null when not counting down. */
  doorCloseCountdown: number | null;
  /** Floors this elevator still has to stop at. */
  requests: number[];
  /** The floor the elevator is currently travelling towards. */
  targetFloor: number | null;
}

/** HALL = UP/DOWN button on a floor. CAR = destination chosen inside an elevator. */
export type RequestKind = "HALL" | "CAR";
export type RequestStatus = "PENDING" | "ASSIGNED" | "SERVING" | "SERVED";

export interface ElevatorRequest {
  id: string;
  kind: RequestKind;
  floor: number;
  direction: CallDirection | null;
  elevatorId: ElevatorId | null;
  status: RequestStatus;
  createdTick: number;
  servedTick: number | null;
}

export interface SimulationSnapshot {
  tick: number;
  running: boolean;
  elevators: Elevator[];
  /** Newest first. */
  requests: ElevatorRequest[];
  connected?: boolean;
}

/** Picks an elevator for a hall call. */
export type Scheduler = (
  elevators: readonly Elevator[],
  request: ElevatorRequest
) => ElevatorId | null;