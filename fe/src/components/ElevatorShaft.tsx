import React from "react";
import { cn } from "../utils/cn";
import { ElevatorCarVisual } from "./ElevatorCarVisual";
import type { Elevator, ElevatorId } from "../simulation/simulationTypes";
import { describeMovement } from "../utils/elevatorLabels";

interface ElevatorShaftProps {
  elevator: Elevator;
  floors: number[];
  topFloor: number;
  rowHeight: number;
  selected: boolean;
  onSelect: (id: ElevatorId) => void;
}

const CAR_INSET = 6;
const CAR_WIDTH = 40;

/** Converts a floor number into a vertical pixel offset from the top of the shaft. */
function floorOffset(floor: number, topFloor: number, rowHeight: number) {
  return (topFloor - floor) * rowHeight;
}

export function ElevatorShaft({ elevator, floors, topFloor, rowHeight, selected, onSelect }: ElevatorShaftProps) {
  return (
    <div className={cn("relative border-l transition-colors", selected && "bg-zinc-50")}>
      {floors.map((floor, index) =>
      <div
        key={floor}
        className={cn(index < floors.length - 1 && "border-b border-dashed border-zinc-200")}
        style={{ height: rowHeight }} />

      )}

      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-200" />

      {elevator.requests.map((floor) =>
      <span
        key={floor}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 bg-background",
          floor === elevator.targetFloor ? "border-sky-600" : "border-sky-300"
        )}
        style={{ top: floorOffset(floor, topFloor, rowHeight) + rowHeight / 2 - 5 }} />

      )}

      <button
        type="button"
        onClick={() => onSelect(elevator.id)}
        aria-label={`Elevator ${elevator.id} at floor ${elevator.currentFloor}, ${describeMovement(elevator)}`}
        className="absolute left-1/2 top-0 rounded-md transition-transform duration-500 ease-linear focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          width: CAR_WIDTH,
          marginLeft: -CAR_WIDTH / 2,
          height: rowHeight - CAR_INSET * 2,
          transform: `translateY(${floorOffset(elevator.currentFloor, topFloor, rowHeight) + CAR_INSET}px)`
        }}>
        
        <ElevatorCarVisual elevator={elevator} className={cn("size-full", selected && "shadow-md")} />
      </button>
    </div>);

}