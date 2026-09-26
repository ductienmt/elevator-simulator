import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ElevatorService } from "../simulation/elevatorService";
import { SocketElevatorService } from "../simulation/socketElevatorService";
import type { CallDirection, ElevatorId } from "../simulation/simulationTypes";

const createDefaultService = (): ElevatorService => new SocketElevatorService();

/**
 * The single seam between React and the simulation. Uses SocketElevatorService to connect to NestJS backend.
 */
export function useElevatorSimulation(createService: () => ElevatorService = createDefaultService) {
  const [service] = useState(createService);

  useEffect(() => () => service.dispose(), [service]);

  const snapshot = useSyncExternalStore(service.subscribe, () => service.getSnapshot());

  const actions = useMemo(
    () => ({
      callElevator: (floor: number, direction: CallDirection) => service.callElevator(floor, direction),
      selectDestination: (elevatorId: ElevatorId, floor: number) => service.selectDestination(elevatorId, floor),
      openDoor: (elevatorId: ElevatorId) => service.openDoor(elevatorId),
      closeDoor: (elevatorId: ElevatorId) => service.closeDoor(elevatorId),
      pause: () => service.pause(),
      resume: () => service.resume(),
      reset: () => service.reset(),
    }),
    [service],
  );

  return { ...snapshot, ...actions };
}