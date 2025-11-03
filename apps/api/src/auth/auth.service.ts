import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
 constructor(private users: UsersService, private jwt: JwtService) {}
 
 async signup(email: string, password: string, name?: string) {
   const user = await this.users.create(email, password, name);
   return this.sign(user.id, user.email);
 }
 
 async login(email: string, password: string) {
  const user = await this.users.findByEmail(email);
  if (!user) throw new UnauthorizedException('Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new UnauthorizedException('Invalid credentials');
  return this.sign(user.id, user.email);
 }
  private sign(sub: string, email: string) {
 const access_token = this.jwt.sign({ sub, email }, { expiresIn: Number(process.env.JWT_EXPIRES) ?? 86400 });
 return { access_token };
 }
}
