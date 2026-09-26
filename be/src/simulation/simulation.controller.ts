import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SimulationService } from './simulation.service.js';

@ApiTags('Simulation')
@Controller('api/simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get simulation loop status and tick count' })
  @ApiResponse({ status: 200, description: 'Simulation status' })
  getStatus() {
    return {
      running: this.simulationService.isRunning(),
      tick: this.simulationService.getTickCount(),
    };
  }

  @Post('pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause simulation loop' })
  @ApiResponse({ status: 200, description: 'Simulation paused' })
  pause() {
    this.simulationService.pause();
    return { success: true, message: 'Simulation paused' };
  }

  @Post('resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume simulation loop' })
  @ApiResponse({ status: 200, description: 'Simulation resumed' })
  resume() {
    this.simulationService.resume();
    return { success: true, message: 'Simulation resumed' };
  }

  @Post('step')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step simulation forward by 1 tick' })
  @ApiResponse({ status: 200, description: 'Simulation stepped forward' })
  step() {
    this.simulationService.step();
    return { success: true, tick: this.simulationService.getTickCount() };
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset simulation and all elevators/requests to initial state' })
  @ApiResponse({ status: 200, description: 'Simulation reset' })
  reset() {
    this.simulationService.reset();
    return { success: true, message: 'Simulation reset' };
  }
}
