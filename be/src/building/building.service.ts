import { Injectable, Logger } from '@nestjs/common';
import { Building } from '../domain/building/building.js';
import { Passenger } from '../domain/passenger/passenger.js';
import { HallRequest } from '../domain/request/hall-request.js';

@Injectable()
export class BuildingService {
  private readonly logger = new Logger(BuildingService.name);
  private building: Building;
  private readonly passengers: Map<string, Passenger> = new Map();
  private readonly hallRequests: Map<string, HallRequest> = new Map();

  constructor() {
    this.initBuilding();
  }

  public initBuilding(): void {
    this.building = new Building({
      floors: 10,
      elevatorIds: ['A', 'B', 'C'],
      doorAutoCloseDelayMs: 3000,
    });
    this.logger.log('Building initialized with 10 floors and Elevators A, B, C');
  }

  public getBuilding(): Building {
    return this.building;
  }

  public getFloors(): number {
    return this.building.getFloors();
  }

  public getElevators() {
    return this.building.getElevators();
  }

  public getElevator(id: string) {
    return this.building.getElevator(id);
  }

  public addPassenger(passenger: Passenger): void {
    this.passengers.set(passenger.getId(), passenger);
  }

  public getPassenger(id: string): Passenger | undefined {
    return this.passengers.get(id);
  }

  public getAllPassengers(): Passenger[] {
    return Array.from(this.passengers.values());
  }

  public addHallRequest(request: HallRequest): void {
    this.hallRequests.set(request.getId(), request);
  }

  public getHallRequest(id: string): HallRequest | undefined {
    return this.hallRequests.get(id);
  }

  public getAllHallRequests(): HallRequest[] {
    return Array.from(this.hallRequests.values());
  }

  public reset(): void {
    this.passengers.clear();
    this.hallRequests.clear();
    this.initBuilding();
  }
}
