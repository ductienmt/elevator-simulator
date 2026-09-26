import { PassengerStatus } from './passenger-status.enum.js';
import { randomUUID } from 'node:crypto';

export class Passenger {
  private readonly id: string;
  private currentFloor: number;
  private destinationFloor: number | null;
  private status: PassengerStatus;
  private assignedElevatorId: string | null = null;
  private hallRequestId: string | null = null;
  private readonly createdAt: Date;

  constructor(
    currentFloor: number,
    destinationFloor: number | null = null,
    id?: string,
  ) {
    this.id = id ?? randomUUID();
    this.currentFloor = currentFloor;
    this.destinationFloor = destinationFloor;
    this.status = PassengerStatus.WAITING;
    this.createdAt = new Date();
  }

  public getId(): string {
    return this.id;
  }

  public getCurrentFloor(): number {
    return this.currentFloor;
  }

  public setCurrentFloor(floor: number): void {
    this.currentFloor = floor;
  }

  public getDestinationFloor(): number | null {
    return this.destinationFloor;
  }

  public setDestinationFloor(floor: number): void {
    this.destinationFloor = floor;
  }

  public getStatus(): PassengerStatus {
    return this.status;
  }

  public setStatus(status: PassengerStatus): void {
    this.status = status;
  }

  public getAssignedElevatorId(): string | null {
    return this.assignedElevatorId;
  }

  public setAssignedElevatorId(elevatorId: string | null): void {
    this.assignedElevatorId = elevatorId;
  }

  public getHallRequestId(): string | null {
    return this.hallRequestId;
  }

  public setHallRequestId(requestId: string | null): void {
    this.hallRequestId = requestId;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public canBoard(elevatorId: string, elevatorFloor: number, isDoorOpen: boolean): boolean {
    return (
      isDoorOpen &&
      this.currentFloor === elevatorFloor &&
      (this.status === PassengerStatus.WAITING || this.status === PassengerStatus.BOARDING) &&
      (this.assignedElevatorId === null || this.assignedElevatorId === elevatorId)
    );
  }

  public board(elevatorId: string): void {
    this.assignedElevatorId = elevatorId;
    this.status = PassengerStatus.BOARDING;
  }

  public enterInside(destinationFloor: number): void {
    this.destinationFloor = destinationFloor;
    this.status = PassengerStatus.INSIDE;
  }

  public arrive(): void {
    this.status = PassengerStatus.ARRIVING;
  }

  public complete(): void {
    if (this.destinationFloor !== null) {
      this.currentFloor = this.destinationFloor;
    }
    this.status = PassengerStatus.COMPLETED;
  }

  public toJSON() {
    return {
      id: this.id,
      currentFloor: this.currentFloor,
      destinationFloor: this.destinationFloor,
      status: this.status,
      assignedElevatorId: this.assignedElevatorId,
      hallRequestId: this.hallRequestId,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
