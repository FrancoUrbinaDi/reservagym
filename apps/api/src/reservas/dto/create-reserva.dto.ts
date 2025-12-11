import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { $Enums } from '@prisma/client';

export class CreateReservaDto {
  @ApiProperty({ example: 'Nombre Usuario' })
  @IsString()
  nombreUsuario!: string;

  @ApiProperty({ required: false, example: 'Descripcion' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    required: false,
    enum: ['ACTIVA', 'CANCELADA', 'COMPLETADA'],
    default: 'ACTIVA',
  })
  @IsOptional()
  @IsEnum($Enums.EstadoReserva)
  estado?: $Enums.EstadoReserva;

  @ApiProperty({ required: false, example: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  dueDate?: string; // el servicio ya hace new Date(dueDate)
}
