import { Injectable, NotFoundException } from '@nestjs/common';
import { BuildingService } from '../building/building.service.js';
import { Passenger } from '../domain/passenger/passenger.js';
import { CreatePassengerDto } from './dto/create-passenger.dto.js';

@Injectable()
export class PassengerService {
  constructor(private readonly buildingService: BuildingService) {}

  public createPassenger(dto: CreatePassengerDto): Passenger {
    const passenger = new Passenger(dto.currentFloor, dto.destinationFloor ?? null);
    this.buildingService.addPassenger(passenger);
    return passenger;
  }

  public getPassenger(id: string): Passenger {
    const passenger = this.buildingService.getPassenger(id);
    if (!passenger) {
      throw new NotFoundException(`Passenger with ID ${id} not found`);
    }
    return passenger;
  }

  public getAllPassengers(): Passenger[] {
    return this.buildingService.getAllPassengers();
  }
}
