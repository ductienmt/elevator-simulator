import React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Direction } from "../simulation/simulationTypes";

interface DirectionIconProps {
  direction: Direction;
  className?: string;
}

export function DirectionIcon({ direction, className }: DirectionIconProps) {
  if (direction === "UP") return <ArrowUp className={className} aria-hidden="true" />;
  if (direction === "DOWN") return <ArrowDown className={className} aria-hidden="true" />;
  return <Minus className={className} aria-hidden="true" />;
}