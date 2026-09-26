import React from "react";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "../utils/cn";
import type { CallDirection } from "../simulation/simulationTypes";
import { statusLabel, statusTone, type HallButtonState } from "../utils/requestStatus";

interface FloorButtonProps {
  floor: number;
  direction: CallDirection;
  state: HallButtonState;
  disabled?: boolean;
  onPress: () => void;
}

export function FloorButton({ floor, direction, state, disabled, onPress }: FloorButtonProps) {
  const Arrow = direction === "UP" ? ArrowUp : ArrowDown;
  const { status, elevatorId } = state;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onPress}
      aria-label={`Call ${direction.toLowerCase()} from floor ${floor}. ${statusLabel[status]}${
      elevatorId ? `, elevator ${elevatorId}` : ""}`
      }
      className={cn(
        "h-8 w-[52px] gap-1 px-2 font-mono text-xs transition-colors sm:w-[60px]",
        status !== "IDLE" && statusTone[status],
        status === "SERVING" && "hover:bg-sky-700 hover:text-white",
        disabled && "border-dashed"
      )}>
      
      <Arrow aria-hidden="true" />
      {status === "PENDING" && <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />}
      {(status === "ASSIGNED" || status === "SERVING") && elevatorId && <span>E{elevatorId}</span>}
      {status === "SERVED" && <Check aria-hidden="true" />}
    </Button>);

}