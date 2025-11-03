import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateReservaDto) {
    const { dueDate, nombreUsuario, description, estado } = dto;
    return this.prisma.reserva.create({
      data: {
        nombreUsuario, // required by Prisma
        userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        descripcion: description,
        estado: estado ?? 'ACTIVA', // default to 'ACTIVA' if undefined
      },
    });
  }
  findAll(userId: string, skip = 0, take = 20) {
 return this.prisma.reserva.findMany({
 where: { userId },
 orderBy: { createdAt: 'desc' },
 skip, take,
 });
}
  async findOne(userId: string, id: string) {
 const task = await this.prisma.reserva.findFirst({ where: { id, userId } });
 if (!task) throw new NotFoundException('Task not found');
 return task;
}
async update(userId: string, id: string, dto: UpdateReservaDto) {
 await this.findOne(userId, id);
 const { dueDate, ...rest } = dto;
 return this.prisma.reserva.update({
 where: { id },
 data: { ...rest, ...(dueDate !== undefined ? { dueDate: dueDate ? new Date
(dueDate) : null } : {}) },
 });
}

async remove(userId: string, id: string) {
 await this.findOne(userId, id);
 await this.prisma.reserva.delete({ where: { id } });
 return { ok: true };
}
}