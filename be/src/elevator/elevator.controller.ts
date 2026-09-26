import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ElevatorService } from './elevator.service.js';
import { AddDestinationDto } from './dto/add-destination.dto.js';
import { PassengerDestinationDto } from './dto/passenger-destination.dto.js';
import { ElevatorStatusDto } from './dto/elevator-status.dto.js';

@ApiTags('Elevators')
@Controller('api/elevators')
export class ElevatorController {
  constructor(private readonly elevatorService: ElevatorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all elevators state' })
  @ApiResponse({ status: 200, description: 'List of all elevators', type: [ElevatorStatusDto] })
  getAllElevators(): ElevatorStatusDto[] {
    return this.elevatorService.getAllElevators().map((e) => e.getStatus());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific elevator state by ID (A, B, C)' })
  @ApiResponse({ status: 200, description: 'Elevator state', type: ElevatorStatusDto })
  getElevator(@Param('id') id: string): ElevatorStatusDto {
    return this.elevatorService.getElevator(id).getStatus();
  }

  @Post(':id/destinations')
  @ApiOperation({ summary: 'Add destination floor inside an elevator' })
  @ApiResponse({ status: 201, description: 'Destination request accepted' })
  addDestination(@Param('id') id: string, @Body() dto: AddDestinationDto) {
    const request = this.elevatorService.addDestination(id, dto.floor, dto.passengerId);
    return request.toJSON();
  }

  @Post(':id/door/open')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Open elevator door' })
  @ApiResponse({ status: 200, description: 'Door opened' })
  @ApiResponse({ status: 409, description: 'Cannot open door while elevator is moving' })
  openDoor(@Param('id') id: string) {
    this.elevatorService.openDoor(id);
    return { success: true, message: `Door opened for Elevator ${id}` };
  }

  @Post(':id/door/keep-open')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Keep elevator door open / reset auto-close timer' })
  @ApiResponse({ status: 200, description: 'Door keep-open activated' })
  keepDoorOpen(@Param('id') id: string) {
    this.elevatorService.keepDoorOpen(id);
    return { success: true, message: `Door held open for Elevator ${id}` };
  }

  @Post(':id/door/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close elevator door immediately' })
  @ApiResponse({ status: 200, description: 'Door closed immediately' })
  closeDoor(@Param('id') id: string) {
    this.elevatorService.closeDoor(id);
    return { success: true, message: `Door closed for Elevator ${id}` };
  }

  @Post(':elevatorId/passengers/:passengerId/destination')
  @ApiOperation({ summary: 'Passenger inside elevator selects destination floor' })
  @ApiResponse({ status: 201, description: 'Passenger boarded and destination scheduled' })
  boardPassenger(
    @Param('elevatorId') elevatorId: string,
    @Param('passengerId') passengerId: string,
    @Body() dto: PassengerDestinationDto,
  ) {
    const destReq = this.elevatorService.boardPassenger(elevatorId, passengerId, dto.floor);
    return destReq.toJSON();
  }
}
