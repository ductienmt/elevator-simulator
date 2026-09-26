import React from "react";
import { Badge } from "./ui/Badge";
import { cn } from "../utils/cn";
import { DirectionIcon } from "./DirectionIcon";
import { ElevatorCarVisual } from "./ElevatorCarVisual";
import type { Elevator, ElevatorId } from "../simulation/simulationTypes";
import {
  describeMovement,
  directionLabel,
  doorTone,
  getMovementTone,
  stateLabel,
  type MovementTone } from
"../utils/elevatorLabels";

interface ElevatorCardProps {
  elevator: Elevator;
  selected: boolean;
  onSelect: (id: ElevatorId) => void;
}

const badgeTone: Record<MovementTone, string> = {
  moving: "border-transparent bg-zinc-900 text-white",
  open: "border-emerald-200 bg-emerald-50 text-emerald-700",
  stopped: "border-amber-200 bg-amber-50 text-amber-700",
  idle: "border-border bg-muted text-muted-foreground"
};

const arrowTone: Record<Elevator["direction"], string> = {
  UP: "text-sky-600",
  DOWN: "text-violet-600",
  IDLE: "text-zinc-300"
};

export function ElevatorCard({ elevator, selected, onSelect }: ElevatorCardProps) {
  const tone = getMovementTone(elevator);

  return (
    <button
      type="button"
      onClick={() => onSelect(elevator.id)}
      aria-pressed={selected}
      aria-label={`Elevator ${elevator.id}, floor ${elevator.currentFloor}, ${describeMovement(elevator)}`}
      className={cn(
        "flex flex-col rounded-xl border bg-card p-4 text-left transition-colors hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-zinc-900 hover:border-zinc-900"
      )}>
      
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium tracking-widest text-muted-foreground">
          ELEVATOR {elevator.id}
        </span>
        <Badge variant="outline" className={cn("transition-colors", badgeTone[tone])}>
          {describeMovement(elevator)}
        </Badge>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirectionIcon
            direction={elevator.direction}
            className={cn("size-8 transition-colors", arrowTone[elevator.direction])} />
          
          <span className="font-mono text-5xl font-semibold tabular-nums tracking-tight">
            {elevator.currentFloor}
          </span>
        </div>
        <ElevatorCarVisual elevator={elevator} className="h-16 w-14" />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Direction</dt>
          <dd className="mt-0.5 font-medium">{directionLabel[elevator.direction]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">State</dt>
          <dd className="mt-0.5 font-medium">{stateLabel[elevator.state]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Door</dt>
          <dd className={cn("mt-0.5 font-mono font-medium", doorTone[elevator.doorStatus])}>
            {elevator.doorStatus}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-1.5 text-xs">
        <span className="mr-1 text-muted-foreground">Requests</span>
        {elevator.requests.length === 0 ?
        <span className="text-muted-foreground">—</span> :

        elevator.requests.map((floor) =>
        <span
          key={floor}
          className={cn(
            "rounded border px-1.5 py-0.5 font-mono",
            floor === elevator.targetFloor ? "border-sky-300 bg-sky-50 text-sky-800" : "bg-muted"
          )}>
          
              {floor}
            </span>
        )
        }
      </div>
    </button>);

}