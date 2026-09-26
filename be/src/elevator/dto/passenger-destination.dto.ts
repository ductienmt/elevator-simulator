import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class PassengerDestinationDto {
  @ApiProperty({ description: 'Destination floor between 1 and 10', example: 8, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  floor: number;
}
