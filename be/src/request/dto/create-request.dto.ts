import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Direction } from '../../domain/elevator/elevator-direction.enum.js';

export class CreateHallRequestDto {
  @ApiProperty({ description: 'Floor number between 1 and 10', example: 5, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  floor: number;

  @ApiProperty({ enum: [Direction.UP, Direction.DOWN], description: 'Call direction', example: Direction.UP })
  @IsEnum([Direction.UP, Direction.DOWN], { message: 'direction must be UP or DOWN' })
  direction: Direction.UP | Direction.DOWN;

  @ApiPropertyOptional({ description: 'Optional passenger ID creating this request' })
  @IsOptional()
  @IsString()
  passengerId?: string;
}
