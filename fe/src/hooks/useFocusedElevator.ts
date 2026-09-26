import { useEffect, useRef, useState } from "react";
import type { DoorStatus, Elevator, ElevatorId } from "../simulation/simulationTypes";

/**
 * Tracks which elevator the car-control panel shows. When an elevator opens its
 * doors, focus jumps to it — unless the one already in focus is also open.
 */
export function useFocusedElevator(elevators: Elevator[]) {
  const [selectedId, setSelectedId] = useState<ElevatorId>(elevators[0]?.id ?? "A");
  const previousDoors = useRef<Map<ElevatorId, DoorStatus>>(new Map());

  useEffect(() => {
    const prev = previousDoors.current;
    const justOpened = elevators.find(
      (e) => e.doorStatus === "OPEN" && prev.has(e.id) && prev.get(e.id) !== "OPEN",
    );
    previousDoors.current = new Map(elevators.map((e) => [e.id, e.doorStatus]));
    if (!justOpened) return;

    setSelectedId((current) => {
      const focused = elevators.find((e) => e.id === current);
      return focused?.doorStatus === "OPEN" ? current : justOpened.id;
    });
  }, [elevators]);

  return { selectedId, setSelectedId };
}