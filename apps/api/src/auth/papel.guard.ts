import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Papel } from "@prisma/client";
import { PAPEIS_KEY } from "./papel.decorator";
import type { UsuarioAtual } from "./jwt.strategy";

/**
 * Aplica o @RequirePapel. Roda depois do JwtAuthGuard (já há request.user).
 * admin_sistema é global e passa em qualquer rota.
 */
@Injectable()
export class PapelGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const papeis = this.reflector.getAllAndOverride<Papel[] | undefined>(PAPEIS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!papeis || papeis.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as UsuarioAtual | undefined;
    if (!user) throw new ForbiddenException("Não autenticado.");
    if (user.papel === "admin_sistema" || papeis.includes(user.papel)) return true;
    throw new ForbiddenException("Seu papel não tem permissão para esta ação.");
  }
}
