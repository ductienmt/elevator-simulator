import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddDestinationDto {
  @ApiProperty({ description: 'Destination floor between 1 and 10', example: 8, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  floor: number;

  @ApiPropertyOptional({ description: 'Optional passenger ID choosing this destination' })
  @IsOptional()
  @IsString()
  passengerId?: string;
}
