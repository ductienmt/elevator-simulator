import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BuildingService } from './building.service.js';

@ApiTags('Building')
@Controller('api/building')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  @Get()
  @ApiOperation({ summary: 'Get building state (floors and all elevators)' })
  @ApiResponse({ status: 200, description: 'Building state' })
  getBuilding() {
    return this.buildingService.getBuilding().getStatus();
  }
}
