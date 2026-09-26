import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BuildingService } from '../building/building.service.js';
import { ElevatorGateway } from '../elevator/elevator.gateway.js';

@Injectable()
export class SimulationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SimulationService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunningState: boolean = true;
  private tickCount: number = 0;
  private tickIntervalMs: number = 1000;

  constructor(
    private readonly buildingService: BuildingService,
    private readonly elevatorGateway: ElevatorGateway,
  ) {}

  onModuleInit() {
    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  public start(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.isRunningState = true;
    this.timer = setInterval(() => {
      if (this.isRunningState) {
        this.tick();
      }
    }, this.tickIntervalMs);
    this.logger.log(`Simulation service started (tick: ${this.tickIntervalMs}ms)`);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunningState = false;
    this.logger.log('Simulation service stopped');
  }

  public pause(): void {
    this.isRunningState = false;
    this.logger.log('Simulation paused');
    this.elevatorGateway.emitEvent('simulation.paused', { tick: this.tickCount });
  }

  public resume(): void {
    this.isRunningState = true;
    this.logger.log('Simulation resumed');
    this.elevatorGateway.emitEvent('simulation.resumed', { tick: this.tickCount });
  }

  public isRunning(): boolean {
    return this.isRunningState;
  }

  public getTickCount(): number {
    return this.tickCount;
  }

  public tick(): void {
    this.tickCount++;
    const building = this.buildingService.getBuilding();
    const elevators = building.getElevators();

    for (const elevator of elevators) {
      const events = elevator.tick();

      for (const event of events) {
        this.elevatorGateway.emitEvent(event.type, {
          elevatorId: elevator.getId(),
          floor: elevator.getCurrentFloor(),
          direction: elevator.getDirection(),
          state: elevator.getState(),
          ...event.data,
        });

        if (event.type === 'elevator.updated') {
          this.logger.log(
            `[Elevator ${elevator.getId()}] Moving to floor ${elevator.getCurrentFloor()} (${elevator.getDirection()})`,
          );
        } else if (event.type === 'elevator.arrived') {
          this.logger.log(`[Elevator ${elevator.getId()}] Stopped at floor ${elevator.getCurrentFloor()}`);
        } else if (event.type === 'elevator.door.opened') {
          this.logger.log(`[Elevator ${elevator.getId()}] Door opened at floor ${elevator.getCurrentFloor()}`);
        } else if (event.type === 'elevator.door.closed') {
          this.logger.log(`[Elevator ${elevator.getId()}] Door closed at floor ${elevator.getCurrentFloor()}`);
        }
      }
    }

    // Broadcast updated building status
    this.elevatorGateway.broadcastBuildingState(building.getStatus());
  }

  public step(): void {
    this.tick();
  }

  public reset(): void {
    this.buildingService.reset();
    this.tickCount = 0;
    this.logger.log('Simulation reset to initial state');
    this.elevatorGateway.broadcastBuildingState(this.buildingService.getBuilding().getStatus());
  }
}
