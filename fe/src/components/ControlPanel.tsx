import React from "react";
import { cn } from "../utils/cn";
import { DestinationPanel } from "./DestinationPanel";
import { DoorControls } from "./DoorControls";
import type { Elevator, ElevatorId } from "../simulation/simulationTypes";

interface ControlPanelProps {
  elevators: Elevator[];
  selected: Elevator;
  floorCount: number;
  onSelectElevator: (id: ElevatorId) => void;
  onSelectDestination: (elevatorId: ElevatorId, floor: number) => void;
  onHoldDoor: (elevatorId: ElevatorId) => void;
  onCloseDoor: (elevatorId: ElevatorId) => void;
}

export function ControlPanel({
  elevators,
  selected,
  floorCount,
  onSelectElevator,
  onSelectDestination,
  onHoldDoor,
  onCloseDoor
}: ControlPanelProps) {
  return (
    <section aria-labelledby="car-controls-title" className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h2 id="car-controls-title" className="text-sm font-semibold">Car Controls</h2>
        <p className="text-xs text-muted-foreground">Panel inside the selected elevator</p>
      </div>

      <div className="p-4">
        <div role="tablist" aria-label="Select elevator" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {elevators.map((elevator) => {
            const active = elevator.id === selected.id;
            return (
              <button
                key={elevator.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onSelectElevator(elevator.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                
                Elevator {elevator.id}
                {elevator.doorStatus === "OPEN" &&
                <span className="size-1.5 rounded-full bg-emerald-500" aria-label="door open" />
                }
              </button>);

          })}
        </div>

        <div role="tabpanel" className="mt-4 space-y-5">
          <DestinationPanel elevator={selected} floorCount={floorCount} onSelect={onSelectDestination} />
          <DoorControls elevator={selected} onHoldOpen={onHoldDoor} onClose={onCloseDoor} />
        </div>
      </div>
    </section>);

}