import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/user.decorator';

type JwtUser = { sub: string; email: string };

@ApiTags('reservas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

 @Post()
 create(@CurrentUser() user: JwtUser, @Body() dto: CreateReservaDto) {
 return this.reservasService.create(user.sub, dto);
 }

 @Get()
 findAll(
 @CurrentUser() user: JwtUser,
 @Query('skip') skip = '0',
 @Query('take') take = '20',
 ) {
  return this.reservasService.findAll(user.sub, Number(skip), Number(take));
 }

  @Get(':id')
 findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
  return this.reservasService.findOne(user.sub, id);
 }

@Patch(':id') 
update(
 @CurrentUser() user: JwtUser,
 @Param('id') id: string,
 @Body() dto: UpdateReservaDto,
 ) {
  return this.reservasService.update(user.sub, id, dto);
 }

  @Delete(':id')
 remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
  return this.reservasService.remove(user.sub, id);
 }
}
