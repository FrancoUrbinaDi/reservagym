import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EstadoValues } from "./estado";
import type { Estado } from "./estado";

export class CreateReservaDto {
 @ApiProperty() @IsString() @IsNotEmpty() nombreUsuario!: string;
 @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
 @ApiProperty({ enum: EstadoValues, default: 'ACTIVA' })
 @IsOptional()
 @IsEnum(EstadoValues)
 estado?: Estado = 'ACTIVA';
 @ApiProperty({ required: false }) @IsOptional() @IsDateString() dueDate?:
string;
}
