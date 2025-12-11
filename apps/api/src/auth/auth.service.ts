import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import type { $Enums } from '@prisma/client';
import * as crypto from 'crypto';
// Tiempo de vida del access token (en segundos).
// Si no hay variable de entorno, usa 900s (15 minutos).
const ACCESS_TTL = process.env.JWT_EXPIRES
  ? Number(process.env.JWT_EXPIRES)
  : 900;
// Tiempo de vida del refresh token (en segundos).
// Si no hay variable de entorno, usa 14 días.
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES
  ? Number(process.env.JWT_REFRESH_EXPIRES)
  : 60 * 60 * 24 * 14;
@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) { }
  /**
  * Helper para emitir SOLO access token.
  */
  private sign(user: { id: string; email: string; role: $Enums.Role }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwt.sign(payload, {
      expiresIn: ACCESS_TTL,
    });
    return { access_token };
  }
  /**
  * Registro de usuario.
  * Devuelve access_token + refresh_token usando issueTokens().
  */
  async signup(email: string, password: string, name?: string) {
    const user = await this.users.create(email, password, name);
    const tokens = await this.issueTokens(user.id, user.email, user.role); // ✅ Solo 3 argumentos
    return tokens.public;
  }
  /**
  * Login de usuario.
  * Verifica credenciales y devuelve access_token + refresh_token.
 */
  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    
    const tokens = await this.issueTokens(user.id, user.email, user.role); // ✅ Solo 3 argumentos
    return tokens.public;
  }
  /**
  * Refresh de tokens:
  * - Verifica firma del refresh token.
  * - Comprueba en BD que exista, no esté revocado y no esté expirado.
  * - Compara hash del token enviado con el almacenado.
  * - Emite nuevos access + refresh tokens y revoca el actual.
  */
  async refresh(refreshToken: string) {
    // Verifica firma del refresh token
    let payload: { sub: string; email: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Busca el registro en BD por JTI
    const rt = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });
    // Si no existe, el token está revocado o expiró, y es rechazado
    if (!rt || rt.revoked || rt.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh revoked/expired');
    }
    // Compara hash del token (no guardamos el token en texto plano)
    const hash = crypto.createHash('sha256').update(refreshToken).digest
      ('hex');
    if (hash !== rt.tokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Rotación: emitimos nuevos tokens y revocamos el actual
    const user = await this.users.findById(rt.userId);
    if (!user) {
      throw new UnauthorizedException('User not found for this token');
    }
    const tokens = await this.issueTokens(user.id, user.email, user.role); // ✅ Solo 3 argumentos
    await this.prisma.refreshToken.update({
      where: { id: rt.id },
      data: { revoked: true, replaceByTokenId: tokens.refresh.jti },
    });
    return tokens.public; // { access_token, refresh_token }
  }
  /**
  * Logout lógico:
  * - Marca el refresh token como revocado (si es válido).
  * - Ignora errores y siempre responde { ok: true }.
  */
  async logout(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ jti: string }>(refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        });
      await this.prisma.refreshToken.update({
        where: { id: payload.jti },
        data: { revoked: true },
      });
    } catch {
      // silencioso: si el token ya está mal/expirado, simplemente no hacemos nada
    }
    return { ok: true };
  }
  /**
  * Emite un par de tokens:
  * - access_token (vida corta).
  * - refresh_token (vida larga).
  *
  * Además guarda en BD el hash del refresh token.
  */
  private async issueTokens(sub: string, email: string, role: $Enums.Role | string) {
    // Access token con rol incluido en el payload
    const access_token = this.jwt.sign(
      { sub, email, role },
      {
        expiresIn: ACCESS_TTL,
      },
    );
    // Refresh token con JTI (JWT ID) para poder identificarlo en BD
    const jti = crypto.randomUUID();
    const refresh_token = this.jwt.sign(
      { sub, email, jti },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: REFRESH_TTL,
      },
    );
    // Guardamos solo el hash del refresh token
    const hash = crypto.createHash('sha256').update(refresh_token).digest
      ('hex');
    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        tokenHash: hash,
        userId: sub,
        expiresAt: new Date(Date.now() + 1000 * REFRESH_TTL),
      },
    });
    return {
      public: { access_token, refresh_token },
      refresh: { jti },
    };
  }
}

