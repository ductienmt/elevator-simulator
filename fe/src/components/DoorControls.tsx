import React from "react";
import { DoorClosed, DoorOpen, Hand } from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "../utils/cn";
import type { Elevator, ElevatorId } from "../simulation/simulationTypes";
import { doorTone } from "../utils/elevatorLabels";

interface DoorControlsProps {
  elevator: Elevator;
  onHoldOpen: (elevatorId: ElevatorId) => void;
  onClose: (elevatorId: ElevatorId) => void;
}

function doorHint(elevator: Elevator): string {
  if (elevator.state === "MOVING") return "Locked while moving";
  if (elevator.doorHeld) return "Held open — auto-close paused";
  if (elevator.doorCloseCountdown !== null) return `Auto-closing in ${elevator.doorCloseCountdown}s`;
  if (elevator.doorStatus === "CLOSING") return "Closing…";
  return "Ready";
}

export function DoorControls({ elevator, onHoldOpen, onClose }: DoorControlsProps) {
  const isOpen = elevator.doorStatus !== "CLOSED";
  const Icon = isOpen ? DoorOpen : DoorClosed;

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg border bg-zinc-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", doorTone[elevator.doorStatus])} aria-hidden="true" />
          <span className="text-sm">
            Door: <span className={cn("font-mono font-semibold", doorTone[elevator.doorStatus])}>{elevator.doorStatus}</span>
          </span>
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {doorHint(elevator)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant={elevator.doorHeld ? "secondary" : "outline"}
          disabled={elevator.state === "MOVING"}
          aria-pressed={elevator.doorHeld}
          onClick={() => onHoldOpen(elevator.id)}>
          
          <Hand aria-hidden="true" />
          {elevator.doorHeld ? "Holding Open" : "Keep Door Open"}
        </Button>
        <Button variant="outline" disabled={elevator.doorStatus !== "OPEN"} onClick={() => onClose(elevator.id)}>
          <DoorClosed aria-hidden="true" />
          Close Door
        </Button>
      </div>
    </div>);

}