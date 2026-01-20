import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WebSocketGateway } from './websocket/websocket.gateway';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const gateway = app.get(WebSocketGateway);
  gateway.createServer(8080);
  
  console.log('Aparty server started');
}

bootstrap();
