import { Request } from './request.js';
import { RequestStatus } from './request-status.enum.js';

export class DestinationRequest extends Request {
  private readonly elevatorId: string;
  private readonly destinationFloor: number;

  constructor(
    elevatorId: string,
    destinationFloor: number,
    passengerId: string | null = null,
    id?: string,
  ) {
    super(passengerId, id);
    this.elevatorId = elevatorId;
    this.destinationFloor = destinationFloor;
    this.status = RequestStatus.ASSIGNED;
  }

  public getTargetFloor(): number {
    return this.destinationFloor;
  }

  public getElevatorId(): string {
    return this.elevatorId;
  }

  public getDestinationFloor(): number {
    return this.destinationFloor;
  }

  public toJSON() {
    return {
      id: this.id,
      elevatorId: this.elevatorId,
      destinationFloor: this.destinationFloor,
      status: this.status,
      passengerId: this.passengerId,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
