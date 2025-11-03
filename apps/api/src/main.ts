import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración Swagger
  const config = new DocumentBuilder()
    .setTitle('ReservaGym API')
    .addBearerAuth() // ← importante
    .setDescription('API para reservas del gimnasio UTAL')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📚 Swagger docs on http://localhost:3000/api/docs');
}
bootstrap();
