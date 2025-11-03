import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
 constructor(private prisma: PrismaService) {}
 async create(email: string, password: string, name?: string) {
 const exists = await this.prisma.user.findUnique({ where: { email } });
 if (exists) throw new ConflictException('Email ya está en uso');
 const passwordHash = await bcrypt.hash(password, 10);
 return this.prisma.user.create({ data: { email, passwordHash, name } });
 }
 findByEmail(email: string) {
 return this.prisma.user.findUnique({ where: { email } });
 }
 findById(id: string) {
 return this.prisma.user.findUnique({ where: { id } });
 }
}
