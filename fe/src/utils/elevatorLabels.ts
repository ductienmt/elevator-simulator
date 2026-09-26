import type { Direction, DoorStatus, Elevator, ElevatorState } from "../simulation/simulationTypes";

export const directionLabel: Record<Direction, string> = {
  UP: "Up",
  DOWN: "Down",
  IDLE: "Idle"
};

export const stateLabel: Record<ElevatorState, string> = {
  MOVING: "Moving",
  STOPPED: "Stopped",
  DOOR_OPEN: "Door Open",
  DOOR_CLOSED: "Door Closed"
};

export const doorTone: Record<DoorStatus, string> = {
  OPEN: "text-emerald-600",
  CLOSING: "text-amber-600",
  CLOSED: "text-foreground"
};

export function describeMovement(elevator: Elevator): string {
  if (elevator.state === "MOVING") return `Moving ${directionLabel[elevator.direction]}`;
  if (elevator.state === "STOPPED") return "Arriving";
  if (elevator.doorStatus === "CLOSING") return "Door Closing";
  if (elevator.doorStatus === "OPEN") return "Door Open";
  return elevator.requests.length ? "Departing" : "Idle";
}

export type MovementTone = "moving" | "open" | "stopped" | "idle";

export function getMovementTone(elevator: Elevator): MovementTone {
  if (elevator.state === "MOVING") return "moving";
  if (elevator.doorStatus !== "CLOSED") return "open";
  if (elevator.state === "STOPPED") return "stopped";
  return "idle";
}