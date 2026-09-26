import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration and Swagger UI
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3000;

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Elevator Simulator API')
    .setDescription(
      'Complete Elevator Simulation backend with 10 floors, Cost-Based Scheduler.',
    )
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, 'Local server')
    .addServer(`http://127.0.0.1:${port}`, '127.0.0.1')
    .addTag('Building', 'Building state and configuration')
    .addTag('Elevators', 'Elevator status, destinations, and door controls')
    .addTag('Requests', 'Hall calls and request queues')
    .addTag('Passengers', 'Passenger lifecycle and boarding')
    .addTag('Simulation', 'Simulation loop management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerSetupOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  };

  SwaggerModule.setup('api/docs', app, document, swaggerSetupOptions);
  SwaggerModule.setup('docs', app, document, swaggerSetupOptions);

  await app.listen(port, '0.0.0.0');
  logger.log(`Elevator Simulator Backend is running on: http://localhost:${port}`);
  logger.log(`Swagger UI is available on: http://localhost:${port}/api/docs`);
  logger.log(`Swagger UI is also available on: http://localhost:${port}/docs`);
}

bootstrap();
