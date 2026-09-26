import { Elevator } from '../domain/elevator/elevator.js';
import { HallRequest } from '../domain/request/hall-request.js';

export interface ElevatorScheduler {
  selectElevator(elevators: Elevator[], request: HallRequest): Elevator | null;
}
