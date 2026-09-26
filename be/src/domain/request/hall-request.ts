import { Request } from './request.js';
import { Direction } from '../elevator/elevator-direction.enum.js';
import { RequestStatus } from './request-status.enum.js';

export class HallRequest extends Request {
  private readonly floor: number;
  private readonly direction: Direction.UP | Direction.DOWN;
  private assignedElevatorId: string | null = null;

  constructor(
    floor: number,
    direction: Direction.UP | Direction.DOWN,
    passengerId: string | null = null,
    id?: string,
  ) {
    super(passengerId, id);
    this.floor = floor;
    this.direction = direction;
  }

  public getTargetFloor(): number {
    return this.floor;
  }

  public getFloor(): number {
    return this.floor;
  }

  public getDirection(): Direction.UP | Direction.DOWN {
    return this.direction;
  }

  public getAssignedElevatorId(): string | null {
    return this.assignedElevatorId;
  }

  public assignToElevator(elevatorId: string): void {
    this.assignedElevatorId = elevatorId;
    this.status = RequestStatus.ASSIGNED;
  }

  public toJSON() {
    return {
      id: this.id,
      floor: this.floor,
      direction: this.direction,
      status: this.status,
      assignedElevatorId: this.assignedElevatorId,
      passengerId: this.passengerId,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
