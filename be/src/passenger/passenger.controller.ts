import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PassengerService } from './passenger.service.js';
import { CreatePassengerDto } from './dto/create-passenger.dto.js';

@ApiTags('Passengers')
@Controller('api/passengers')
export class PassengerController {
  constructor(private readonly passengerService: PassengerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new passenger waiting at a floor' })
  @ApiResponse({ status: 201, description: 'Passenger created successfully' })
  createPassenger(@Body() dto: CreatePassengerDto) {
    const passenger = this.passengerService.createPassenger(dto);
    return passenger.toJSON();
  }

  @Get()
  @ApiOperation({ summary: 'Get all passengers' })
  @ApiResponse({ status: 200, description: 'List of passengers' })
  getAllPassengers() {
    return this.passengerService.getAllPassengers().map((p) => p.toJSON());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get passenger by ID' })
  @ApiResponse({ status: 200, description: 'Passenger details' })
  getPassenger(@Param('id') id: string) {
    return this.passengerService.getPassenger(id).toJSON();
  }
}
