import type { Scheduler } from "./simulationTypes";

/**
 * Deliberately naive: nearest elevator wins, ties go to the one with the
 * shorter queue, then the lower id. Replace with a real controller later.
 */
export const nearestElevatorScheduler: Scheduler = (elevators, request) => {
  if (elevators.length === 0) return null;

  const ranked = [...elevators].sort((a, b) => {
    const distance =
    Math.abs(a.currentFloor - request.floor) - Math.abs(b.currentFloor - request.floor);
    if (distance !== 0) return distance;
    const load = a.requests.length - b.requests.length;
    if (load !== 0) return load;
    return String(a.id).localeCompare(String(b.id));
  });

  return ranked[0].id;
};