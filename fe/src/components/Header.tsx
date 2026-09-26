import { Building2, RotateCcw } from "lucide-react";
import { Button } from "./ui/Button";

interface HeaderProps {
  buildingName: string;
  floorCount: number;
  elevatorCount: number;
  running: boolean;
  tick: number;
  connected?: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
}

export function Header({
  buildingName,
  floorCount,
  elevatorCount,
  onReset
}: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border bg-zinc-50">
            <Building2 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold leading-tight tracking-tight">Elevator Simulator</h1>

            </div>
            <p className="text-sm text-muted-foreground">
              {buildingName} • {floorCount} Floors • {elevatorCount} Elevators
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={onReset}>
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>
    </header>);

}