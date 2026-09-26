import React from "react";
import { BuildingView } from "./components/BuildingView";
import { ControlPanel } from "./components/ControlPanel";
import { ElevatorCard } from "./components/ElevatorCard";
import { Header } from "./components/Header";
import { building } from "./data/mockElevators";
import { useElevatorSimulation } from "./hooks/useElevatorSimulation";
import { useFocusedElevator } from "./hooks/useFocusedElevator";

export function App() {
  const simulation = useElevatorSimulation();
  const { selectedId, setSelectedId } = useFocusedElevator(simulation.elevators);
  const selected = simulation.elevators.find((e) => e.id === selectedId) ?? simulation.elevators[0];

  return (
    <div className="min-h-screen w-full bg-zinc-50 font-heading text-foreground">
      <Header
        buildingName={building.name}
        floorCount={building.floors}
        elevatorCount={simulation.elevators.length}
        running={simulation.running}
        tick={simulation.tick}
        connected={simulation.connected}
        onToggleRunning={simulation.running ? simulation.pause : simulation.resume}
        onReset={simulation.reset}
      />

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
        <section aria-label="Elevator status" className="grid gap-4 md:grid-cols-3">
          {simulation.elevators.map((elevator) => (
            <ElevatorCard
              key={elevator.id}
              elevator={elevator}
              selected={elevator.id === selected.id}
              onSelect={setSelectedId}
            />
          ))}
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <BuildingView
            floorCount={building.floors}
            elevators={simulation.elevators}
            requests={simulation.requests}
            tick={simulation.tick}
            selectedElevatorId={selected.id}
            onSelectElevator={setSelectedId}
            onCall={simulation.callElevator}
          />

          <div className="space-y-6">
            <ControlPanel
              elevators={simulation.elevators}
              selected={selected}
              floorCount={building.floors}
              onSelectElevator={setSelectedId}
              onSelectDestination={simulation.selectDestination}
              onHoldDoor={simulation.openDoor}
              onCloseDoor={simulation.closeDoor}
            />

          </div>
        </div>
      </main>
    </div>
  );
}