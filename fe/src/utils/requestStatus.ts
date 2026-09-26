import type { CallDirection, ElevatorId, ElevatorRequest, RequestStatus } from "../simulation/simulationTypes";

export type HallButtonStatus = "IDLE" | RequestStatus;

export interface HallButtonState {
  status: HallButtonStatus;
  elevatorId: ElevatorId | null;
}

/** How long (in ticks) a served call keeps its ✓ on the floor button before disappearing. */
const SERVED_VISIBLE_TICKS = 2;

export function getHallButtonState(
requests: ElevatorRequest[],
floor: number,
direction: CallDirection,
tick: number)
: HallButtonState {
  const match = requests.find(
    (r) =>
    r.kind === "HALL" &&
    r.floor === floor &&
    r.direction === direction && (
    r.status !== "SERVED" || r.servedTick !== null && tick - r.servedTick <= SERVED_VISIBLE_TICKS)
  );
  return match ? { status: match.status, elevatorId: match.elevatorId } : { status: "IDLE", elevatorId: null };
}

export const statusLabel: Record<HallButtonStatus, string> = {
  IDLE: "Idle",
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  SERVING: "Moving",
  SERVED: "Served"
};

export const statusTone: Record<HallButtonStatus, string> = {
  IDLE: "border-border bg-background text-foreground",
  PENDING: "border-amber-300 bg-amber-50 text-amber-800",
  ASSIGNED: "border-sky-300 bg-sky-50 text-sky-800",
  SERVING: "border-sky-600 bg-sky-600 text-white",
  SERVED: "border-emerald-300 bg-emerald-50 text-emerald-700"
};