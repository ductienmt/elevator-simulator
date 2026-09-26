import { Module } from '@nestjs/common';
import { BuildingController } from './building/building.controller.js';
import { BuildingService } from './building/building.service.js';
import { ElevatorController } from './elevator/elevator.controller.js';
import { ElevatorService } from './elevator/elevator.service.js';
import { ElevatorGateway } from './elevator/elevator.gateway.js';
import { RequestController } from './request/request.controller.js';
import { RequestService } from './request/request.service.js';
import { CostBasedScheduler } from './scheduler/cost-based.scheduler.js';
import { PassengerController } from './passenger/passenger.controller.js';
import { PassengerService } from './passenger/passenger.service.js';
import { SimulationController } from './simulation/simulation.controller.js';
import { SimulationService } from './simulation/simulation.service.js';

@Module({
  imports: [],
  controllers: [
    BuildingController,
    ElevatorController,
    RequestController,
    PassengerController,
    SimulationController,
  ],
  providers: [
    BuildingService,
    CostBasedScheduler,
    ElevatorGateway,
    ElevatorService,
    RequestService,
    PassengerService,
    SimulationService,
  ],
})
export class AppModule {}
