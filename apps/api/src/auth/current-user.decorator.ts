import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { UsuarioAtual } from "./jwt.strategy";

/** Injeta o usuário autenticado (payload do JWT) no handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAtual => {
    return ctx.switchToHttp().getRequest().user;
  },
);
