import React from "react";
import { Button } from "./ui/Button";
import { cn } from "../utils/cn";
import type { Elevator, ElevatorId } from "../simulation/simulationTypes";
import { getFloorsAscending } from "../utils/floors";

interface DestinationPanelProps {
  elevator: Elevator;
  floorCount: number;
  onSelect: (elevatorId: ElevatorId, floor: number) => void;
}

export function DestinationPanel({ elevator, floorCount, onSelect }: DestinationPanelProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">Select Destination</h3>
        <span className="text-xs text-muted-foreground">
          Current floor <span className="font-mono font-semibold text-foreground">{elevator.currentFloor}</span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label={`Elevator ${elevator.id} destinations`}>
        {getFloorsAscending(floorCount).map((floor) => {
          const queued = elevator.requests.includes(floor);
          const isCurrent = floor === elevator.currentFloor;
          return (
            <Button
              key={floor}
              variant={queued ? "default" : "outline"}
              disabled={isCurrent}
              aria-pressed={queued}
              aria-label={`Floor ${floor}${queued ? ", selected" : ""}${isCurrent ? ", current floor" : ""}`}
              onClick={() => onSelect(elevator.id, floor)}
              className={cn(
                "h-11 font-mono text-sm tabular-nums transition-colors",
                queued && "border-sky-600 bg-sky-600 text-white hover:bg-sky-700",
                isCurrent && "border-dashed opacity-50 cursor-not-allowed",
              )}
            >
              {floor}
            </Button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
        Select a destination floor — elevator will queue it and travel there whether doors are open or closed.
      </p>
    </div>
  );
}