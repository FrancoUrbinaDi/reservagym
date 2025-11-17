import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import type { $Enums } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) { }

  async signup(email: string, password: string, name?: string) {
    const user = await this.users.create(email, password, name);
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    // Verifica firma del refresh
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Busca el token en BD (rotación y revocación)
    const rt = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!rt || rt.revoked || rt.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh revoked/expired');
    }

    // Compara hash
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (hash !== rt.tokenHash) throw new UnauthorizedException('Invalid refresh token');

    // Rotación: revoca el actual y emite uno nuevo
    const user = await this.users.findById(rt.userId);
    const tokens = await this.issueTokens(user!.id, user!.email, user!.role);

    await this.prisma.refreshToken.update({
      where: { id: rt.id },
      data: { revoked: true, replaceByTokenId: tokens.refresh.jti },
    });

    return tokens; // devuelve ambos tokens, no solo public
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      await this.prisma.refreshToken.update({
        where: { id: payload.jti },
        data: { revoked: true },
      });
    } catch {/* silencioso */ }
    return { ok: true };
  }

  private async issueTokens(sub: string, email: string, role: $Enums.Role) {
    // Access
    const access_token = this.jwt.sign(
      { sub, email, role },
      { expiresIn: Number(process.env.JWT_EXPIRES) ?? 900 }
    );

    // Refresh (con jti para rotación)
    const jti = crypto.randomUUID();
    const refresh_token = this.jwt.sign(
      { sub, email, jti },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: Number(process.env.JWT_REFRESH_EXPIRES) ?? 1209600,
      }
    );

    const hash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        tokenHash: hash,
        userId: sub,
        expiresAt: new Date(Date.now() + 1000 * (Number(process.env.JWT_REFRESH_EXPIRES) ?? 1209600)),
      },
    });

    return {
      public: { access_token, refresh_token },
      refresh: { jti },
    };
  }
}
