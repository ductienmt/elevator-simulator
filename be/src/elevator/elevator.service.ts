import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BuildingService } from '../building/building.service.js';
import { ElevatorGateway } from './elevator.gateway.js';
import { Elevator } from '../domain/elevator/elevator.js';
import { ElevatorState } from '../domain/elevator/elevator-state.enum.js';
import { DestinationRequest } from '../domain/request/destination-request.js';

@Injectable()
export class ElevatorService {
  private readonly logger = new Logger(ElevatorService.name);

  constructor(
    private readonly buildingService: BuildingService,
    private readonly elevatorGateway: ElevatorGateway,
  ) {}

  public getAllElevators(): Elevator[] {
    return this.buildingService.getElevators();
  }

  public getElevator(id: string): Elevator {
    const elevator = this.buildingService.getElevator(id);
    if (!elevator) {
      throw new NotFoundException(`Elevator with ID ${id} not found`);
    }
    return elevator;
  }

  public addDestination(id: string, floor: number, passengerId?: string): DestinationRequest {
    const elevator = this.getElevator(id);

    if (floor < 1 || floor > 10) {
      throw new BadRequestException('Destination floor must be between 1 and 10');
    }
    if (floor === elevator.getCurrentFloor()) {
      throw new BadRequestException('Destination floor cannot be the current floor');
    }

    const destRequest = new DestinationRequest(id, floor, passengerId ?? null);
    elevator.addDestinationRequest(destRequest);

    this.logger.log(
      `[Elevator ${id}] Added destination floor ${floor}${passengerId ? ` for passenger ${passengerId}` : ''}`,
    );

    this.elevatorGateway.emitEvent('destination.created', destRequest.toJSON());
    this.elevatorGateway.emitEvent('elevator.updated', elevator.getStatus());
    this.elevatorGateway.broadcastBuildingState(this.buildingService.getBuilding().getStatus());

    return destRequest;
  }

  public openDoor(id: string): void {
    const elevator = this.getElevator(id);

    if (elevator.getState() === ElevatorState.MOVING) {
      throw new ConflictException('Cannot open door while elevator is moving');
    }

    try {
      elevator.openDoor();
      this.logger.log(`[Elevator ${id}] Door opened at floor ${elevator.getCurrentFloor()}`);
      this.elevatorGateway.emitEvent('elevator.door.opened', elevator.getStatus());
      this.elevatorGateway.emitEvent('door.opened', { elevatorId: id, floor: elevator.getCurrentFloor() });
      this.elevatorGateway.emitEvent('elevator.updated', elevator.getStatus());
    } catch (err: any) {
      throw new ConflictException(err.message);
    }
  }

  public closeDoor(id: string): void {
    const elevator = this.getElevator(id);
    elevator.closeDoor();
    this.logger.log(`[Elevator ${id}] Door closed at floor ${elevator.getCurrentFloor()}`);
    this.elevatorGateway.emitEvent('elevator.door.closed', elevator.getStatus());
    this.elevatorGateway.emitEvent('door.closed', { elevatorId: id, floor: elevator.getCurrentFloor() });
    this.elevatorGateway.emitEvent('elevator.updated', elevator.getStatus());
  }

  public keepDoorOpen(id: string, delayMs?: number): void {
    const elevator = this.getElevator(id);

    if (elevator.getState() === ElevatorState.MOVING) {
      throw new ConflictException('Cannot open door while elevator is moving');
    }

    try {
      elevator.keepDoorOpen(delayMs);
      this.logger.log(`[Elevator ${id}] Door held open at floor ${elevator.getCurrentFloor()}`);
      this.elevatorGateway.emitEvent('elevator.door.opened', elevator.getStatus());
      this.elevatorGateway.emitEvent('elevator.updated', elevator.getStatus());
    } catch (err: any) {
      throw new ConflictException(err.message);
    }
  }

  public boardPassenger(
    elevatorId: string,
    passengerId: string,
    destinationFloor: number,
  ): DestinationRequest {
    const elevator = this.getElevator(elevatorId);
    const passenger = this.buildingService.getPassenger(passengerId);

    if (!passenger) {
      throw new NotFoundException(`Passenger with ID ${passengerId} not found`);
    }

    if (!elevator.getDoor().isOpen()) {
      throw new ConflictException('Door must be OPEN for passenger to board');
    }

    if (elevator.getState() === ElevatorState.MOVING) {
      throw new ConflictException('Cannot board passenger while elevator is moving');
    }

    if (passenger.getCurrentFloor() !== elevator.getCurrentFloor()) {
      throw new BadRequestException(
        `Passenger is on floor ${passenger.getCurrentFloor()}, but elevator is on floor ${elevator.getCurrentFloor()}`,
      );
    }

    if (destinationFloor < 1 || destinationFloor > 10) {
      throw new BadRequestException('Destination floor must be between 1 and 10');
    }

    if (destinationFloor === elevator.getCurrentFloor()) {
      throw new BadRequestException('Destination floor cannot be the current floor');
    }

    try {
      const destReq = elevator.boardPassenger(passenger, destinationFloor);

      this.logger.log(
        `[Elevator ${elevatorId}] Passenger ${passengerId} boarded at floor ${elevator.getCurrentFloor()} -> destination ${destinationFloor}`,
      );

      this.elevatorGateway.emitEvent('passenger.inside', passenger.toJSON());
      this.elevatorGateway.emitEvent('destination.created', destReq.toJSON());
      this.elevatorGateway.emitEvent('elevator.updated', elevator.getStatus());
      this.elevatorGateway.broadcastBuildingState(this.buildingService.getBuilding().getStatus());

      return destReq;
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
