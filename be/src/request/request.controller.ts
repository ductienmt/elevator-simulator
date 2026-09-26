import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestService } from './request.service.js';
import { CreateHallRequestDto } from './dto/create-request.dto.js';

@ApiTags('Requests')
@Controller('api/requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create a hall request (press UP/DOWN on a floor)' })
  @ApiResponse({ status: 201, description: 'Request created and assigned to an elevator' })
  createRequest(@Body() dto: CreateHallRequestDto) {
    const request = this.requestService.createHallRequest(dto);
    return request.toJSON();
  }

  @Get()
  @ApiOperation({ summary: 'Get all active and pending requests' })
  @ApiResponse({ status: 200, description: 'List of hall and destination requests' })
  getAllRequests() {
    return this.requestService.getAllRequests();
  }
}
