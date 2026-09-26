import { Injectable } from '@nestjs/common';
import { ElevatorScheduler } from './elevator-scheduler.interface.js';
import { Elevator } from '../domain/elevator/elevator.js';
import { HallRequest } from '../domain/request/hall-request.js';
import { Direction } from '../domain/elevator/elevator-direction.enum.js';

@Injectable()
export class CostBasedScheduler implements ElevatorScheduler {
  private readonly REVERSE_PENALTY = 10;
  private readonly QUEUE_MULTIPLIER = 2;

  public calculateCost(elevator: Elevator, request: HallRequest): number {
    const currentFloor = elevator.getCurrentFloor();
    const reqFloor = request.getFloor();
    const direction = elevator.getDirection();
    const reqDirection = request.getDirection() as unknown as Direction;

    const distanceCost = Math.abs(currentFloor - reqFloor);
    const queuePenalty = elevator.getPendingRequestsCount() * this.QUEUE_MULTIPLIER;
    let reversePenalty = 0;

    if (direction === Direction.IDLE) {
      reversePenalty = 0;
    } else if (direction === reqDirection) {
      if (direction === Direction.UP) {
        // Moving UP: if elevator hasn't passed the floor yet
        if (currentFloor <= reqFloor) {
          reversePenalty = 0;
        } else {
          // Already passed floor, must finish UP, go DOWN, then UP again
          reversePenalty = this.REVERSE_PENALTY;
        }
      } else if (direction === Direction.DOWN) {
        // Moving DOWN: if elevator hasn't passed the floor yet
        if (currentFloor >= reqFloor) {
          reversePenalty = 0;
        } else {
          // Already passed floor
          reversePenalty = this.REVERSE_PENALTY;
        }
      }
    } else {
      // Opposite direction
      reversePenalty = this.REVERSE_PENALTY;
    }

    return distanceCost + queuePenalty + reversePenalty;
  }

  public isSuitable(elevator: Elevator, request: HallRequest): boolean {
    // Elevator is suitable as long as it exists and operates within floor bounds
    const floor = request.getFloor();
    return floor >= 1 && floor <= 10;
  }

  public selectElevator(elevators: Elevator[], request: HallRequest): Elevator | null {
    if (!elevators || elevators.length === 0) {
      return null;
    }

    const suitableElevators = elevators.filter((e) => this.isSuitable(e, request));
    if (suitableElevators.length === 0) {
      return null;
    }

    let bestElevator: Elevator | null = null;
    let lowestCost = Number.POSITIVE_INFINITY;

    for (const elevator of suitableElevators) {
      const cost = this.calculateCost(elevator, request);
      if (cost < lowestCost) {
        lowestCost = cost;
        bestElevator = elevator;
      }
    }

    return bestElevator;
  }
}
