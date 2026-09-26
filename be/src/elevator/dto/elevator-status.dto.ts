import { ApiProperty } from '@nestjs/swagger';
import { Direction } from '../../domain/elevator/elevator-direction.enum.js';
import { ElevatorState } from '../../domain/elevator/elevator-state.enum.js';
import { DoorState } from '../../domain/door/door-state.enum.js';

export class ElevatorStatusDto {
  @ApiProperty({ example: 'A' })
  id: string;

  @ApiProperty({ example: 1 })
  currentFloor: number;

  @ApiProperty({ enum: Direction, example: Direction.IDLE })
  direction: Direction;

  @ApiProperty({ enum: ElevatorState, example: ElevatorState.IDLE })
  state: ElevatorState;

  @ApiProperty({ enum: DoorState, example: DoorState.CLOSED })
  door: DoorState;

  @ApiProperty({ example: false })
  doorOpen: boolean;

  @ApiProperty({ example: 'CLOSED' })
  doorStatus: 'OPEN' | 'CLOSED';

  @ApiProperty({ example: false })
  doorHeld: boolean;

  @ApiProperty({ example: null, nullable: true })
  doorCloseCountdown: number | null;

  @ApiProperty({ type: [Number], example: [3, 5, 8] })
  requests: number[];

  @ApiProperty({ example: 5, nullable: true })
  targetFloor: number | null;

  @ApiProperty({ type: [Object], example: [] })
  passengers: any[];

  @ApiProperty({ example: 0 })
  pendingRequestsCount: number;
}
