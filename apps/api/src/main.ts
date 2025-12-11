import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors: true});
  app.useGlobalPipes(new ValidationPipe({ whitelist: true , transform: true}));
  app.enableCors({
    origin: 'http://localhost:5173', // Ajusta esto según el origen de tu frontend
    credentials: true,
  });

  
  const config = new DocumentBuilder()
    .setTitle('ReservaGym API')
    .setDescription('API para reservas de horas del gimnasio de la Universidad de Talca')
    .setVersion('1.0')
    .addBearerAuth() // ← importante
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📚 Swagger docs on http://localhost:3000/api/docs');
}
bootstrap();
