import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreatePassengerDto {
  @ApiProperty({ description: 'Initial floor passenger is waiting at (1-10)', example: 5, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  currentFloor: number;

  @ApiPropertyOptional({ description: 'Target destination floor (1-10)', example: 8, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  destinationFloor?: number;
}
