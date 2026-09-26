import React from "react";
import { FloorButton } from "./FloorButton";
import type { CallDirection } from "../simulation/simulationTypes";
import type { HallButtonState } from "../utils/requestStatus";

interface FloorProps {
  floor: number;
  topFloor: number;
  rowHeight: number;
  upState: HallButtonState;
  downState: HallButtonState;
  onCall: (floor: number, direction: CallDirection) => void;
}

export function Floor({ floor, topFloor, rowHeight, upState, downState, onCall }: FloorProps) {
  return (
    <div
      role="group"
      aria-label={`Floor ${floor}`}
      className="flex items-center gap-1.5 border-b px-3 last:border-b-0 sm:gap-2 sm:px-4"
      style={{ height: rowHeight }}>
      
      <span className="w-10 shrink-0 font-mono text-sm sm:w-[72px]">
        <span className="hidden text-muted-foreground sm:inline">Floor </span>
        <span className="font-semibold tabular-nums">{floor}</span>
      </span>
      <FloorButton
        floor={floor}
        direction="UP"
        state={upState}
        disabled={floor === topFloor}
        onPress={() => onCall(floor, "UP")} />
      
      <FloorButton
        floor={floor}
        direction="DOWN"
        state={downState}
        disabled={floor === 1}
        onPress={() => onCall(floor, "DOWN")} />
      
    </div>);

}