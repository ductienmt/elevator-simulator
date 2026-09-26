import { Direction } from './elevator-direction.enum.js';
import { ElevatorState } from './elevator-state.enum.js';
import { Door } from '../door/door.js';
import { DoorState } from '../door/door-state.enum.js';
import { HallRequest } from '../request/hall-request.js';
import { DestinationRequest } from '../request/destination-request.js';
import { RequestStatus } from '../request/request-status.enum.js';
import { Passenger } from '../passenger/passenger.js';
import { PassengerStatus } from '../passenger/passenger-status.enum.js';

export interface ElevatorOptions {
  id: string;
  initialFloor?: number;
  minFloor?: number;
  maxFloor?: number;
  doorAutoCloseDelayMs?: number;
}

export interface ElevatorEvent {
  type:
    | 'elevator.updated'
    | 'elevator.arrived'
    | 'elevator.door.opened'
    | 'elevator.door.closed'
    | 'elevator.state.changed'
    | 'passenger.boarding'
    | 'passenger.inside'
    | 'passenger.completed'
    | 'destination.created'
    | 'request.picked_up'
    | 'request.completed';
  elevatorId: string;
  floor: number;
  direction: Direction;
  state: ElevatorState;
  data?: any;
}

export class Elevator {
  private readonly id: string;
  private currentFloor: number;
  private direction: Direction = Direction.IDLE;
  private state: ElevatorState = ElevatorState.IDLE;
  private readonly door: Door;
  private readonly minFloor: number;
  private readonly maxFloor: number;

  private readonly hallRequests: Map<string, HallRequest> = new Map();
  private readonly destinationRequests: Map<string, DestinationRequest> = new Map();
  private readonly passengers: Map<string, Passenger> = new Map();

  private eventListeners: Array<(event: ElevatorEvent) => void> = [];

  constructor(options: ElevatorOptions) {
    this.id = options.id;
    this.currentFloor = options.initialFloor ?? 1;
    this.minFloor = options.minFloor ?? 1;
    this.maxFloor = options.maxFloor ?? 10;

    this.door = new Door({
      autoCloseDelayMs: options.doorAutoCloseDelayMs ?? 3000,
      onAutoClose: () => {
        this.handleAutoClose();
      },
      onStateChange: (doorState: DoorState) => {
        if (doorState === DoorState.OPEN) {
          this.state = ElevatorState.DOOR_OPEN;
          this.emitEvent({
            type: 'elevator.door.opened',
            elevatorId: this.id,
            floor: this.currentFloor,
            direction: this.direction,
            state: this.state,
          });
        } else {
          if (this.state === ElevatorState.DOOR_OPEN) {
            this.state = ElevatorState.STOPPED;
          }
          this.emitEvent({
            type: 'elevator.door.closed',
            elevatorId: this.id,
            floor: this.currentFloor,
            direction: this.direction,
            state: this.state,
          });
        }
      },
    });
  }

  public addEventListener(listener: (event: ElevatorEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private emitEvent(event: ElevatorEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in elevator event listener:', err);
      }
    }
  }

  public getId(): string {
    return this.id;
  }

  public getCurrentFloor(): number {
    return this.currentFloor;
  }

  public getDirection(): Direction {
    return this.direction;
  }

  public getState(): ElevatorState {
    return this.state;
  }

  public getDoor(): Door {
    return this.door;
  }

  public getHallRequests(): HallRequest[] {
    return Array.from(this.hallRequests.values());
  }

  public getDestinationRequests(): DestinationRequest[] {
    return Array.from(this.destinationRequests.values());
  }

  public getPassengers(): Passenger[] {
    return Array.from(this.passengers.values());
  }

  public getPendingRequestsCount(): number {
    let count = 0;
    for (const req of this.hallRequests.values()) {
      if (req.getStatus() === RequestStatus.ASSIGNED || req.getStatus() === RequestStatus.PENDING) {
        count++;
      }
    }
    for (const req of this.destinationRequests.values()) {
      if (req.getStatus() === RequestStatus.ASSIGNED || req.getStatus() === RequestStatus.PENDING) {
        count++;
      }
    }
    return count;
  }

  public addHallRequest(request: HallRequest): void {
    this.hallRequests.set(request.getId(), request);
    request.assignToElevator(this.id);

    if (this.direction === Direction.IDLE && this.state === ElevatorState.IDLE) {
      if (request.getFloor() > this.currentFloor) {
        this.direction = Direction.UP;
      } else if (request.getFloor() < this.currentFloor) {
        this.direction = Direction.DOWN;
      }
    }
  }

  public addDestinationRequest(request: DestinationRequest): void {
    this.destinationRequests.set(request.getId(), request);

    if (this.direction === Direction.IDLE) {
      if (request.getDestinationFloor() > this.currentFloor) {
        this.direction = Direction.UP;
      } else if (request.getDestinationFloor() < this.currentFloor) {
        this.direction = Direction.DOWN;
      }
    }

    this.emitEvent({
      type: 'destination.created',
      elevatorId: this.id,
      floor: this.currentFloor,
      direction: this.direction,
      state: this.state,
      data: request.toJSON(),
    });
  }

  public addPassenger(passenger: Passenger): void {
    this.passengers.set(passenger.getId(), passenger);
  }

  public openDoor(): void {
    if (this.state === ElevatorState.MOVING) {
      throw new Error('Cannot open door while elevator is moving');
    }
    this.door.open();
    this.state = ElevatorState.DOOR_OPEN;
  }

  public closeDoor(): void {
    this.door.close();
    if (this.state === ElevatorState.DOOR_OPEN) {
      this.state = ElevatorState.STOPPED;
    }
  }

  public keepDoorOpen(delayMs?: number): void {
    if (this.state === ElevatorState.MOVING) {
      throw new Error('Cannot open/keep door open while elevator is moving');
    }
    this.door.keepOpen(delayMs);
    this.state = ElevatorState.DOOR_OPEN;
  }

  private handleAutoClose(): void {
    if (this.state === ElevatorState.DOOR_OPEN) {
      this.state = ElevatorState.STOPPED;
    }
  }

  public canStopForRequest(request: HallRequest): boolean {
    if (request.getFloor() !== this.currentFloor) {
      return false;
    }
    if (this.direction === Direction.IDLE) {
      return true;
    }
    if (this.direction === (request.getDirection() as unknown as Direction)) {
      return true;
    }
    return !this.hasRequestsAhead();
  }

  public hasRequestsAhead(): boolean {
    if (this.direction === Direction.UP) {
      for (const req of this.destinationRequests.values()) {
        if (
          req.getStatus() !== RequestStatus.COMPLETED &&
          req.getDestinationFloor() > this.currentFloor
        ) {
          return true;
        }
      }
      for (const req of this.hallRequests.values()) {
        if (
          req.getStatus() !== RequestStatus.COMPLETED &&
          req.getStatus() !== RequestStatus.PICKED_UP &&
          req.getFloor() > this.currentFloor
        ) {
          return true;
        }
      }
      return false;
    }

    if (this.direction === Direction.DOWN) {
      for (const req of this.destinationRequests.values()) {
        if (
          req.getStatus() !== RequestStatus.COMPLETED &&
          req.getDestinationFloor() < this.currentFloor
        ) {
          return true;
        }
      }
      for (const req of this.hallRequests.values()) {
        if (
          req.getStatus() !== RequestStatus.COMPLETED &&
          req.getStatus() !== RequestStatus.PICKED_UP &&
          req.getFloor() < this.currentFloor
        ) {
          return true;
        }
      }
      return false;
    }

    return false;
  }

  public hasRequestsBehind(): boolean {
    if (this.direction === Direction.UP) {
      for (const req of this.destinationRequests.values()) {
        if (
          req.getStatus() !== RequestStatus.COMPLETED &&
          req.getDestinationFloor() < this.currentFloor
        ) {
          return true;
        }
      }
      for (const req of this.hallRequests.values()) {
        if (
          req.getStatus() !== RequestStatus.COMPLETED &&
          req.getStatus() !== RequestStatus.PICKED_UP &&
          req.getFloor() < this.currentFloor
        ) {
          return true;
        }
      }
      return false;
    }

    if (this.direction === Direction.DOWN) {
      for (const req of this.destinationRequests.values()) {
        if (
          req.getStatus() !== RequestStatus.COMPLETED &&
          req.getDestinationFloor() > this.currentFloor
        ) {
          return true;
        }
      }
      for (const req of this.hallRequests.values()) {
        if (
          req.getStatus() !== RequestStatus.COMPLETED &&
          req.getStatus() !== RequestStatus.PICKED_UP &&
          req.getFloor() > this.currentFloor
        ) {
          return true;
        }
      }
      return false;
    }

    return false;
  }

  public shouldStopAtCurrentFloor(): boolean {
    // 1. Destination at current floor
    for (const req of this.destinationRequests.values()) {
      if (
        req.getStatus() !== RequestStatus.COMPLETED &&
        req.getDestinationFloor() === this.currentFloor
      ) {
        return true;
      }
    }

    // 2. Hall requests at current floor
    for (const req of this.hallRequests.values()) {
      if (
        req.getStatus() !== RequestStatus.COMPLETED &&
        req.getStatus() !== RequestStatus.PICKED_UP &&
        req.getFloor() === this.currentFloor
      ) {
        if (this.direction === Direction.IDLE) {
          return true;
        }
        if (this.direction === (req.getDirection() as unknown as Direction)) {
          return true;
        }
        if (!this.hasRequestsAhead()) {
          return true;
        }
      }
    }

    return false;
  }

  public updateDirection(): void {
    if (this.direction === Direction.UP) {
      if (this.hasRequestsAhead()) {
        this.direction = Direction.UP;
      } else if (this.hasRequestsBehind()) {
        this.direction = Direction.DOWN;
      } else {
        // Check if any request at current floor
        const hasCurrentFloorRequest = this.hasRequestsAtCurrentFloor();
        if (!hasCurrentFloorRequest) {
          this.direction = Direction.IDLE;
        }
      }
    } else if (this.direction === Direction.DOWN) {
      if (this.hasRequestsAhead()) {
        this.direction = Direction.DOWN;
      } else if (this.hasRequestsBehind()) {
        this.direction = Direction.UP;
      } else {
        const hasCurrentFloorRequest = this.hasRequestsAtCurrentFloor();
        if (!hasCurrentFloorRequest) {
          this.direction = Direction.IDLE;
        }
      }
    } else {
      // IDLE
      if (this.hasAnyRequestsAbove()) {
        this.direction = Direction.UP;
      } else if (this.hasAnyRequestsBelow()) {
        this.direction = Direction.DOWN;
      } else {
        this.direction = Direction.IDLE;
      }
    }
  }

  private hasRequestsAtCurrentFloor(): boolean {
    for (const req of this.destinationRequests.values()) {
      if (
        req.getStatus() !== RequestStatus.COMPLETED &&
        req.getDestinationFloor() === this.currentFloor
      ) {
        return true;
      }
    }
    for (const req of this.hallRequests.values()) {
      if (
        req.getStatus() !== RequestStatus.COMPLETED &&
        req.getStatus() !== RequestStatus.PICKED_UP &&
        req.getFloor() === this.currentFloor
      ) {
        return true;
      }
    }
    return false;
  }

  private hasAnyRequestsAbove(): boolean {
    for (const req of this.destinationRequests.values()) {
      if (
        req.getStatus() !== RequestStatus.COMPLETED &&
        req.getDestinationFloor() > this.currentFloor
      ) {
        return true;
      }
    }
    for (const req of this.hallRequests.values()) {
      if (
        req.getStatus() !== RequestStatus.COMPLETED &&
        req.getStatus() !== RequestStatus.PICKED_UP &&
        req.getFloor() > this.currentFloor
      ) {
        return true;
      }
    }
    return false;
  }

  private hasAnyRequestsBelow(): boolean {
    for (const req of this.destinationRequests.values()) {
      if (
        req.getStatus() !== RequestStatus.COMPLETED &&
        req.getDestinationFloor() < this.currentFloor
      ) {
        return true;
      }
    }
    for (const req of this.hallRequests.values()) {
      if (
        req.getStatus() !== RequestStatus.COMPLETED &&
        req.getStatus() !== RequestStatus.PICKED_UP &&
        req.getFloor() < this.currentFloor
      ) {
        return true;
      }
    }
    return false;
  }

  public move(): void {
    if (this.door.isOpen()) {
      throw new Error('Cannot move while door is open');
    }

    if (this.direction === Direction.UP && this.currentFloor < this.maxFloor) {
      this.currentFloor++;
    } else if (this.direction === Direction.DOWN && this.currentFloor > this.minFloor) {
      this.currentFloor--;
    }
  }

  public boardPassenger(passenger: Passenger, destinationFloor: number): DestinationRequest {
    if (!this.door.isOpen()) {
      throw new Error('Cannot board passenger when door is closed');
    }
    if (this.state === ElevatorState.MOVING) {
      throw new Error('Cannot board passenger when elevator is moving');
    }
    if (passenger.getCurrentFloor() !== this.currentFloor) {
      throw new Error(
        `Passenger is on floor ${passenger.getCurrentFloor()}, but elevator is on floor ${this.currentFloor}`,
      );
    }
    if (destinationFloor < this.minFloor || destinationFloor > this.maxFloor) {
      throw new Error(`Destination floor must be between ${this.minFloor} and ${this.maxFloor}`);
    }
    if (destinationFloor === this.currentFloor) {
      throw new Error('Destination floor cannot be the current floor');
    }

    passenger.enterInside(destinationFloor);
    passenger.setAssignedElevatorId(this.id);
    this.passengers.set(passenger.getId(), passenger);

    // Create DestinationRequest
    const destReq = new DestinationRequest(this.id, destinationFloor, passenger.getId());
    this.addDestinationRequest(destReq);

    // Update HallRequest if associated
    if (passenger.getHallRequestId()) {
      const hallReq = this.hallRequests.get(passenger.getHallRequestId()!);
      if (hallReq) {
        hallReq.setStatus(RequestStatus.PICKED_UP);
        this.emitEvent({
          type: 'request.picked_up',
          elevatorId: this.id,
          floor: this.currentFloor,
          direction: this.direction,
          state: this.state,
          data: hallReq.toJSON(),
        });
      }
    }

    this.emitEvent({
      type: 'passenger.inside',
      elevatorId: this.id,
      floor: this.currentFloor,
      direction: this.direction,
      state: this.state,
      data: passenger.toJSON(),
    });

    return destReq;
  }

  public tick(): ElevatorEvent[] {
    const generatedEvents: ElevatorEvent[] = [];
    const collectListener = (evt: ElevatorEvent) => {
      generatedEvents.push(evt);
    };
    const unsubscribe = this.addEventListener(collectListener);

    try {
      // 1. If door is OPEN: cannot move
      if (this.door.isOpen()) {
        this.state = ElevatorState.DOOR_OPEN;
        return generatedEvents;
      }

      // If door was open and has now closed, update state from DOOR_OPEN to STOPPED
      if (this.state === ElevatorState.DOOR_OPEN) {
        this.state = ElevatorState.STOPPED;
      }

      // 2. Process current floor if stopped or idle and has request here
      if (this.shouldStopAtCurrentFloor()) {
        this.handleStopAtCurrentFloor();
        return generatedEvents;
      }

      // 3. Determine direction
      this.updateDirection();

      // If idle, nothing to do
      if (this.direction === Direction.IDLE) {
        if (this.state !== ElevatorState.IDLE) {
          this.state = ElevatorState.IDLE;
          this.emitEvent({
            type: 'elevator.state.changed',
            elevatorId: this.id,
            floor: this.currentFloor,
            direction: this.direction,
            state: this.state,
          });
        }
        return generatedEvents;
      }

      // 4. Move one floor in direction
      this.state = ElevatorState.MOVING;
      const prevFloor = this.currentFloor;
      this.move();

      this.emitEvent({
        type: 'elevator.updated',
        elevatorId: this.id,
        floor: this.currentFloor,
        direction: this.direction,
        state: this.state,
        data: { previousFloor: prevFloor, currentFloor: this.currentFloor },
      });

      // 5. Check if should stop at the newly reached floor
      if (this.shouldStopAtCurrentFloor()) {
        this.handleStopAtCurrentFloor();
      }

      return generatedEvents;
    } finally {
      unsubscribe();
    }
  }

  private handleStopAtCurrentFloor(): void {
    this.state = ElevatorState.STOPPED;

    this.emitEvent({
      type: 'elevator.arrived',
      elevatorId: this.id,
      floor: this.currentFloor,
      direction: this.direction,
      state: this.state,
    });

    // Open door automatically
    this.openDoor();

    // 1. Process Destination Requests - Passengers arriving
    for (const destReq of Array.from(this.destinationRequests.values())) {
      if (
        destReq.getStatus() !== RequestStatus.COMPLETED &&
        destReq.getDestinationFloor() === this.currentFloor
      ) {
        destReq.setStatus(RequestStatus.COMPLETED);

        const passengerId = destReq.getPassengerId();
        if (passengerId && this.passengers.has(passengerId)) {
          const passenger = this.passengers.get(passengerId)!;
          passenger.arrive();
          passenger.complete();

          this.emitEvent({
            type: 'passenger.completed',
            elevatorId: this.id,
            floor: this.currentFloor,
            direction: this.direction,
            state: this.state,
            data: passenger.toJSON(),
          });
        }

        this.emitEvent({
          type: 'request.completed',
          elevatorId: this.id,
          floor: this.currentFloor,
          direction: this.direction,
          state: this.state,
          data: destReq.toJSON(),
        });
      }
    }

    // 2. Process Hall Requests at this floor - Passengers boarding
    for (const hallReq of Array.from(this.hallRequests.values())) {
      if (
        hallReq.getStatus() !== RequestStatus.COMPLETED &&
        hallReq.getStatus() !== RequestStatus.PICKED_UP &&
        hallReq.getFloor() === this.currentFloor &&
        this.canStopForRequest(hallReq)
      ) {
        hallReq.setStatus(RequestStatus.PICKED_UP);

        const passengerId = hallReq.getPassengerId();
        if (passengerId && this.passengers.has(passengerId)) {
          const passenger = this.passengers.get(passengerId)!;
          passenger.board(this.id);

          this.emitEvent({
            type: 'passenger.boarding',
            elevatorId: this.id,
            floor: this.currentFloor,
            direction: this.direction,
            state: this.state,
            data: passenger.toJSON(),
          });
        }

        this.emitEvent({
          type: 'request.picked_up',
          elevatorId: this.id,
          floor: this.currentFloor,
          direction: this.direction,
          state: this.state,
          data: hallReq.toJSON(),
        });
      }
    }

    // After processing, update direction for subsequent movements
    this.updateDirection();
  }

  public getTargetFloor(): number | null {
    if (this.direction === Direction.UP) {
      let maxTarget = -1;
      for (const d of this.destinationRequests.values()) {
        if (d.getStatus() !== RequestStatus.COMPLETED && d.getDestinationFloor() > this.currentFloor) {
          if (d.getDestinationFloor() > maxTarget) maxTarget = d.getDestinationFloor();
        }
      }
      for (const h of this.hallRequests.values()) {
        if (
          h.getStatus() !== RequestStatus.COMPLETED &&
          h.getStatus() !== RequestStatus.PICKED_UP &&
          h.getFloor() > this.currentFloor
        ) {
          if (h.getFloor() > maxTarget) maxTarget = h.getFloor();
        }
      }
      return maxTarget !== -1 ? maxTarget : null;
    }

    if (this.direction === Direction.DOWN) {
      let minTarget = 999;
      for (const d of this.destinationRequests.values()) {
        if (d.getStatus() !== RequestStatus.COMPLETED && d.getDestinationFloor() < this.currentFloor) {
          if (d.getDestinationFloor() < minTarget) minTarget = d.getDestinationFloor();
        }
      }
      for (const h of this.hallRequests.values()) {
        if (
          h.getStatus() !== RequestStatus.COMPLETED &&
          h.getStatus() !== RequestStatus.PICKED_UP &&
          h.getFloor() < this.currentFloor
        ) {
          if (h.getFloor() < minTarget) minTarget = h.getFloor();
        }
      }
      return minTarget !== 999 ? minTarget : null;
    }

    return null;
  }

  public getAllRequestFloors(): number[] {
    const floors = new Set<number>();
    for (const d of this.destinationRequests.values()) {
      if (d.getStatus() !== RequestStatus.COMPLETED) {
        floors.add(d.getDestinationFloor());
      }
    }
    for (const h of this.hallRequests.values()) {
      if (h.getStatus() !== RequestStatus.COMPLETED && h.getStatus() !== RequestStatus.PICKED_UP) {
        floors.add(h.getFloor());
      }
    }
    return Array.from(floors).sort((a, b) => a - b);
  }

  public getStatus() {
    return {
      id: this.id,
      currentFloor: this.currentFloor,
      direction: this.direction,
      state: this.state,
      door: this.door.getState(),
      doorOpen: this.door.isOpen(),
      doorStatus: (this.door.isOpen() ? 'OPEN' : 'CLOSED') as 'OPEN' | 'CLOSED',
      doorHeld: this.door.isHeld(),
      doorCloseCountdown: this.door.getCountdown(),
      requests: this.getAllRequestFloors(),
      targetFloor: this.getTargetFloor(),
      passengers: Array.from(this.passengers.values()).map((p) => p.toJSON()),
      pendingRequestsCount: this.getPendingRequestsCount(),
    };
  }
}
