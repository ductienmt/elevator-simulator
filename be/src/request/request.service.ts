import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BuildingService } from '../building/building.service.js';
import { CostBasedScheduler } from '../scheduler/cost-based.scheduler.js';
import { ElevatorGateway } from '../elevator/elevator.gateway.js';
import { CreateHallRequestDto } from './dto/create-request.dto.js';
import { HallRequest } from '../domain/request/hall-request.js';
import { RequestStatus } from '../domain/request/request-status.enum.js';

@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  constructor(
    private readonly buildingService: BuildingService,
    private readonly scheduler: CostBasedScheduler,
    private readonly elevatorGateway: ElevatorGateway,
  ) {}

  public createHallRequest(dto: CreateHallRequestDto): HallRequest {
    const hallRequest = new HallRequest(dto.floor, dto.direction, dto.passengerId);
    this.buildingService.addHallRequest(hallRequest);

    this.logger.log(
      `[Request] Created HallRequest #${hallRequest.getId()} at floor ${dto.floor} ${dto.direction}`,
    );

    this.elevatorGateway.emitEvent('request.created', hallRequest.toJSON());

    // Link passenger if passengerId was provided
    if (dto.passengerId) {
      const passenger = this.buildingService.getPassenger(dto.passengerId);
      if (passenger) {
        passenger.setHallRequestId(hallRequest.getId());
      }
    }

    // Schedule assignment
    this.assignRequest(hallRequest);

    this.elevatorGateway.broadcastBuildingState(this.buildingService.getBuilding().getStatus());

    return hallRequest;
  }

  public assignRequest(hallRequest: HallRequest): void {
    const elevators = this.buildingService.getElevators();
    const selectedElevator = this.scheduler.selectElevator(elevators, hallRequest);

    if (selectedElevator) {
      selectedElevator.addHallRequest(hallRequest);
      this.logger.log(
        `[Scheduler] Request #${hallRequest.getId()} (Floor ${hallRequest.getFloor()} ${hallRequest.getDirection()}) assigned to Elevator ${selectedElevator.getId()}`,
      );

      if (hallRequest.getPassengerId()) {
        const passenger = this.buildingService.getPassenger(hallRequest.getPassengerId()!);
        if (passenger) {
          passenger.setAssignedElevatorId(selectedElevator.getId());
          selectedElevator.addPassenger(passenger);
        }
      }

      this.elevatorGateway.emitEvent('request.assigned', {
        requestId: hallRequest.getId(),
        elevatorId: selectedElevator.getId(),
        floor: hallRequest.getFloor(),
        direction: hallRequest.getDirection(),
        status: hallRequest.getStatus(),
      });
    } else {
      this.logger.warn(
        `[Scheduler] No suitable elevator currently available for Request #${hallRequest.getId()}. Remains PENDING.`,
      );
    }
  }

  public getAllRequests() {
    const hallRequests = this.buildingService.getAllHallRequests().map((r) => r.toJSON());
    const destinationRequests: any[] = [];

    for (const elevator of this.buildingService.getElevators()) {
      for (const dest of elevator.getDestinationRequests()) {
        destinationRequests.push(dest.toJSON());
      }
    }

    return {
      hallRequests,
      destinationRequests,
      pendingCount:
        hallRequests.filter((r) => r.status === RequestStatus.PENDING || r.status === RequestStatus.ASSIGNED).length +
        destinationRequests.filter((d) => d.status === RequestStatus.ASSIGNED || d.status === RequestStatus.PENDING).length,
    };
  }

  public getPendingRequests() {
    return this.getAllRequests();
  }
}
