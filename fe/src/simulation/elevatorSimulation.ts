import { building, initialElevators, initialHallCalls } from "../data/mockElevators";
import type {
  CallDirection,
  Elevator,
  ElevatorId,
  ElevatorRequest,
  Scheduler,
  SimulationSnapshot } from
"./simulationTypes";

export const TICK_MS = 500;
const DOOR_OPEN_TICKS = 10; // 5s
const DOOR_CLOSE_AFTER_SELECT_TICKS = 3; // 1.5s
const MAX_SERVED_HISTORY = 40;

export interface EngineElevator extends Elevator {
  doorTimer: number;
}

export interface EngineState {
  tick: number;
  elevators: EngineElevator[];
  requests: ElevatorRequest[];
  nextRequestId: number;
}

type NewRequest = Pick<ElevatorRequest, "kind" | "floor" | "direction" | "elevatorId" | "status">;

export function createInitialEngineState(): EngineState {
  let state: EngineState = {
    tick: 0,
    elevators: initialElevators.map((e) => ({ ...e, requests: [...e.requests], doorTimer: 0 })),
    requests: [],
    nextRequestId: 1
  };
  for (const call of initialHallCalls) {
    state = addHallCall(state, call.floor, call.direction);
  }
  return state;
}

export function toSnapshot(state: EngineState, running: boolean): SimulationSnapshot {
  return {
    tick: state.tick,
    running,
    requests: state.requests,
    elevators: state.elevators.map(({ doorTimer, ...elevator }) => ({
      ...elevator,
      doorCloseCountdown:
      elevator.doorStatus === "OPEN" && !elevator.doorHeld ?
      Math.max(1, Math.ceil(doorTimer * TICK_MS / 1000)) :
      null
    }))
  };
}

// ---------- Commands ----------

export function addHallCall(state: EngineState, floor: number, direction: CallDirection): EngineState {
  if (!isValidFloor(floor)) return state;
  if (direction === "UP" && floor === building.floors) return state;
  if (direction === "DOWN" && floor === 1) return state;

  const duplicate = state.requests.some(
    (r) => r.kind === "HALL" && r.floor === floor && r.direction === direction && isActive(r)
  );
  if (duplicate) return state;

  const next = cloneState(state);
  next.requests.unshift(
    createRequest(next, { kind: "HALL", floor, direction, elevatorId: null, status: "PENDING" })
  );
  return trimHistory(next);
}

export function addDestination(state: EngineState, elevatorId: ElevatorId, floor: number): EngineState {
  const current = state.elevators.find((e) => e.id === elevatorId);
  if (!current || current.doorStatus !== "OPEN") return state;
  if (!isValidFloor(floor) || floor === current.currentFloor) return state;

  const next = cloneState(state);
  const elevator = findElevator(next, elevatorId);
  if (!elevator.requests.includes(floor)) elevator.requests.push(floor);

  const alreadyLogged = next.requests.some(
    (r) => r.kind === "CAR" && r.elevatorId === elevatorId && r.floor === floor && isActive(r)
  );
  if (!alreadyLogged) {
    next.requests.unshift(
      createRequest(next, { kind: "CAR", floor, direction: null, elevatorId, status: "ASSIGNED" })
    );
  }

  // A destination was chosen, so the doors close shortly after
  elevator.doorHeld = false;
  elevator.doorTimer = Math.min(elevator.doorTimer, DOOR_CLOSE_AFTER_SELECT_TICKS);
  elevator.direction = resolveDirection(elevator);
  return trimHistory(next);
}

export function holdDoor(state: EngineState, elevatorId: ElevatorId): EngineState {
  const current = state.elevators.find((e) => e.id === elevatorId);
  if (!current || current.state === "MOVING") return state;

  const next = cloneState(state);
  const elevator = findElevator(next, elevatorId);
  openDoors(elevator);
  elevator.doorHeld = true;
  return next;
}

export function closeDoor(state: EngineState, elevatorId: ElevatorId): EngineState {
  const current = state.elevators.find((e) => e.id === elevatorId);
  if (!current || current.doorStatus !== "OPEN") return state;

  const next = cloneState(state);
  const elevator = findElevator(next, elevatorId);
  elevator.doorStatus = "CLOSING";
  elevator.doorHeld = false;
  elevator.doorTimer = 0;
  return next;
}

// ---------- Tick ----------

export function stepEngine(state: EngineState, scheduler: Scheduler): EngineState {
  const next = cloneState(state);
  next.tick += 1;

  // 1. Assign pending hall calls
  for (const request of next.requests) {
    if (request.status !== "PENDING") continue;
    const elevatorId = scheduler(next.elevators, request);
    if (elevatorId === null) continue;
    request.elevatorId = elevatorId;
    request.status = "ASSIGNED";
    const elevator = findElevator(next, elevatorId);
    if (!elevator.requests.includes(request.floor)) elevator.requests.push(request.floor);
  }

  // 2. Advance each elevator by one step
  for (const elevator of next.elevators) {
    const doorOpenedForStop = advanceElevator(elevator);
    if (doorOpenedForStop) markServed(next, elevator);
  }

  // 3. Refresh in-flight request statuses
  for (const request of next.requests) {
    if (!isActive(request) || request.elevatorId === null) continue;
    const elevator = findElevator(next, request.elevatorId);
    const headingHere =
    (elevator.state === "MOVING" || elevator.state === "STOPPED") &&
    elevator.targetFloor === request.floor;
    request.status = headingHere ? "SERVING" : "ASSIGNED";
  }

  return next;
}

/** Returns true when the door opened for (or absorbed) a stop at the current floor */
function advanceElevator(elevator: EngineElevator): boolean {
  switch (elevator.doorStatus) {
    case "OPEN":{
        let served = false;
        // A new call for this floor while the door is already open is served instantly
        if (elevator.requests.includes(elevator.currentFloor)) {
          removeStop(elevator, elevator.currentFloor);
          elevator.doorTimer = Math.max(elevator.doorTimer, DOOR_OPEN_TICKS);
          served = true;
        }
        if (!elevator.doorHeld) {
          elevator.doorTimer -= 1;
          if (elevator.doorTimer <= 0) elevator.doorStatus = "CLOSING";
        }
        return served;
      }

    case "CLOSING":
      elevator.doorStatus = "CLOSED";
      elevator.doorOpen = false;
      elevator.state = "DOOR_CLOSED";
      return false;

    case "CLOSED":{
        if (elevator.state === "STOPPED" || elevator.requests.includes(elevator.currentFloor)) {
          removeStop(elevator, elevator.currentFloor);
          openDoors(elevator);
          return true;
        }

        const target = pickNextStop(elevator);
        if (target === null) {
          elevator.direction = "IDLE";
          elevator.targetFloor = null;
          elevator.state = "DOOR_CLOSED";
          return false;
        }

        const step = target > elevator.currentFloor ? 1 : -1;
        elevator.direction = step > 0 ? "UP" : "DOWN";
        elevator.targetFloor = target;
        elevator.currentFloor += step;
        elevator.state = elevator.requests.includes(elevator.currentFloor) ? "STOPPED" : "MOVING";
        return false;
      }
  }
}

// ---------- Helpers ----------

/** Keep going in the current direction if there are stops ahead, else go to the nearest stop */
function pickNextStop(elevator: EngineElevator): number | null {
  const { requests, currentFloor, direction } = elevator;
  if (requests.length === 0) return null;

  const above = requests.filter((f) => f > currentFloor);
  const below = requests.filter((f) => f < currentFloor);
  if (direction === "UP" && above.length) return Math.min(...above);
  if (direction === "DOWN" && below.length) return Math.max(...below);

  return requests.reduce((best, f) =>
  Math.abs(f - currentFloor) < Math.abs(best - currentFloor) ? f : best
  );
}

function resolveDirection(elevator: EngineElevator): Elevator["direction"] {
  const { requests, currentFloor, direction } = elevator;
  if (requests.length === 0) return "IDLE";
  const hasAbove = requests.some((f) => f > currentFloor);
  const hasBelow = requests.some((f) => f < currentFloor);
  if (direction === "UP" && hasAbove) return "UP";
  if (direction === "DOWN" && hasBelow) return "DOWN";
  return hasAbove ? "UP" : "DOWN";
}

function openDoors(elevator: EngineElevator) {
  elevator.doorStatus = "OPEN";
  elevator.doorOpen = true;
  elevator.state = "DOOR_OPEN";
  elevator.doorTimer = DOOR_OPEN_TICKS;
  elevator.targetFloor = null;
  elevator.direction = resolveDirection(elevator);
}

function markServed(state: EngineState, elevator: EngineElevator) {
  for (const request of state.requests) {
    if (request.elevatorId === elevator.id && request.floor === elevator.currentFloor && isActive(request)) {
      request.status = "SERVED";
      request.servedTick = state.tick;
    }
  }
}

function removeStop(elevator: EngineElevator, floor: number) {
  elevator.requests = elevator.requests.filter((f) => f !== floor);
}

function createRequest(state: EngineState, fields: NewRequest): ElevatorRequest {
  const id = `R${state.nextRequestId}`;
  state.nextRequestId += 1;
  return { ...fields, id, createdTick: state.tick, servedTick: null };
}

function trimHistory(state: EngineState): EngineState {
  let served = 0;
  state.requests = state.requests.filter((r) => isActive(r) || ++served <= MAX_SERVED_HISTORY);
  return state;
}

function cloneState(state: EngineState): EngineState {
  return {
    ...state,
    elevators: state.elevators.map((e) => ({ ...e, requests: [...e.requests] })),
    requests: state.requests.map((r) => ({ ...r }))
  };
}

function findElevator(state: EngineState, id: ElevatorId): EngineElevator {
  const elevator = state.elevators.find((e) => e.id === id);
  if (!elevator) throw new Error(`Unknown elevator ${id}`);
  return elevator;
}

function isActive(request: ElevatorRequest) {
  return request.status !== "SERVED";
}

function isValidFloor(floor: number) {
  return Number.isInteger(floor) && floor >= 1 && floor <= building.floors;
}