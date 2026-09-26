import React from "react";
import { cn } from "../utils/cn";
import type { Elevator } from "../simulation/simulationTypes";
import { getMovementTone, type MovementTone } from "../utils/elevatorLabels";

interface ElevatorCarVisualProps {
  elevator: Elevator;
  className?: string;
}

const doorOffset: Record<Elevator["doorStatus"], string> = {
  OPEN: "88%",
  CLOSING: "40%",
  CLOSED: "0%"
};

const frameTone: Record<MovementTone, string> = {
  moving: "border-zinc-900",
  open: "border-emerald-500",
  stopped: "border-amber-500",
  idle: "border-zinc-300"
};

/** Car frame with two sliding door panels. Purely presentational. */
export function ElevatorCarVisual({ elevator, className }: ElevatorCarVisualProps) {
  const offset = doorOffset[elevator.doorStatus];
  const tone = getMovementTone(elevator);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md border-2 bg-emerald-50 transition-colors duration-300",
        frameTone[tone],
        className
      )}>
      
      <div
        className="absolute inset-y-0 left-0 w-1/2 border-r border-zinc-300 bg-zinc-200 transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${offset})` }} />
      
      <div
        className="absolute inset-y-0 right-0 w-1/2 border-l border-zinc-300 bg-zinc-200 transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(${offset})` }} />
      
    </div>);

}