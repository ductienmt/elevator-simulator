import React from "react";
import { cn } from "../utils/cn";
import { DirectionIcon } from "./DirectionIcon";
import { ElevatorShaft } from "./ElevatorShaft";
import { Floor } from "./Floor";
import type { CallDirection, Elevator, ElevatorId, ElevatorRequest } from "../simulation/simulationTypes";
import { getFloorsDescending } from "../utils/floors";
import { getHallButtonState, statusLabel, statusTone, type HallButtonStatus } from "../utils/requestStatus";

interface BuildingViewProps {
  floorCount: number;
  elevators: Elevator[];
  requests: ElevatorRequest[];
  tick: number;
  selectedElevatorId: ElevatorId;
  onSelectElevator: (id: ElevatorId) => void;
  onCall: (floor: number, direction: CallDirection) => void;
}

const ROW_HEIGHT = 52;
const LEGEND: HallButtonStatus[] = ["IDLE", "PENDING", "ASSIGNED", "SERVING", "SERVED"];

export function BuildingView({
  floorCount,
  elevators,
  requests,
  tick,
  selectedElevatorId,
  onSelectElevator,
  onCall
}: BuildingViewProps) {
  const floors = getFloorsDescending(floorCount);
  const gridColumns = `minmax(0,auto) repeat(${elevators.length}, minmax(56px, 1fr))`;

  return (
    <section aria-labelledby="building-title" className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="building-title" className="text-sm font-semibold">Building</h2>
          <p className="text-xs text-muted-foreground">Call an elevator from any floor</p>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground" aria-label="Call status legend">
          {LEGEND.map((status) =>
          <li key={status} className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded-sm border", statusTone[status])} />
              {statusLabel[status]}
            </li>
          )}
        </ul>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[320px]" style={{ gridTemplateColumns: gridColumns }}>
          {/* Column headers */}
          <div className="flex items-center border-b bg-zinc-50 px-3 py-2 font-mono text-[11px] tracking-wider text-muted-foreground sm:px-4">
            FLOOR / CALL
          </div>
          {elevators.map((elevator) =>
          <button
            key={elevator.id}
            type="button"
            onClick={() => onSelectElevator(elevator.id)}
            className={cn(
              "flex items-center justify-center gap-1 border-b border-l bg-zinc-50 py-2 font-mono text-[11px] tracking-wider text-muted-foreground transition-colors hover:text-foreground",
              elevator.id === selectedElevatorId && "text-foreground"
            )}>
            
              <span className="font-semibold">E{elevator.id}</span>
              <DirectionIcon direction={elevator.direction} className="size-3" />
              <span className="tabular-nums">{elevator.currentFloor}</span>
            </button>
          )}

          {/* Floors */}
          <div>
            {floors.map((floor) =>
            <Floor
              key={floor}
              floor={floor}
              topFloor={floorCount}
              rowHeight={ROW_HEIGHT}
              upState={getHallButtonState(requests, floor, "UP", tick)}
              downState={getHallButtonState(requests, floor, "DOWN", tick)}
              onCall={onCall} />

            )}
          </div>

          {/* Shafts */}
          {elevators.map((elevator) =>
          <ElevatorShaft
            key={elevator.id}
            elevator={elevator}
            floors={floors}
            topFloor={floorCount}
            rowHeight={ROW_HEIGHT}
            selected={elevator.id === selectedElevatorId}
            onSelect={onSelectElevator} />

          )}
        </div>
      </div>
    </section>);

}