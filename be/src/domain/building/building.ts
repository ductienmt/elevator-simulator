import { Elevator } from '../elevator/elevator.js';

export interface BuildingOptions {
  floors?: number;
  elevatorIds?: string[];
  doorAutoCloseDelayMs?: number;
}

export class Building {
  private readonly floors: number;
  private readonly elevators: Map<string, Elevator> = new Map();

  constructor(options: BuildingOptions = {}) {
    this.floors = options.floors ?? 10;
    const elevatorIds = options.elevatorIds ?? ['A', 'B', 'C'];

    for (const id of elevatorIds) {
      const elevator = new Elevator({
        id,
        initialFloor: 1,
        minFloor: 1,
        maxFloor: this.floors,
        doorAutoCloseDelayMs: options.doorAutoCloseDelayMs ?? 3000,
      });
      this.elevators.set(id, elevator);
    }
  }

  public getFloors(): number {
    return this.floors;
  }

  public getElevators(): Elevator[] {
    return Array.from(this.elevators.values());
  }

  public getElevator(id: string): Elevator | undefined {
    return this.elevators.get(id);
  }

  public getStatus() {
    return {
      floors: this.floors,
      elevators: this.getElevators().map((e) => e.getStatus()),
    };
  }
}
