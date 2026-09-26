import type { CallDirection, Elevator } from "../simulation/simulationTypes";

export const building = {
  name: "Office Building",
  floors: 10,
  elevatorCount: 3,
};

export const initialElevators: Elevator[] = [
  {
    id: "A",
    currentFloor: 1,
    direction: "IDLE",
    state: "DOOR_CLOSED",
    doorOpen: false,
    doorStatus: "CLOSED",
    doorHeld: false,
    doorCloseCountdown: null,
    requests: [],
    targetFloor: null,
  },
  {
    id: "B",
    currentFloor: 1,
    direction: "IDLE",
    state: "DOOR_CLOSED",
    doorOpen: false,
    doorStatus: "CLOSED",
    doorHeld: false,
    doorCloseCountdown: null,
    requests: [],
    targetFloor: null,
  },
  {
    id: "C",
    currentFloor: 1,
    direction: "IDLE",
    state: "DOOR_CLOSED",
    doorOpen: false,
    doorStatus: "CLOSED",
    doorHeld: false,
    doorCloseCountdown: null,
    requests: [],
    targetFloor: null,
  },
];

/** Seeded so the demo shows activity immediately on load / reset. */
export const initialHallCalls: { floor: number; direction: CallDirection }[] = [
  { floor: 3, direction: "UP" },
  { floor: 7, direction: "DOWN" },
];