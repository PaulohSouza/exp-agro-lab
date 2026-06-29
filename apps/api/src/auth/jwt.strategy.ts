import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import type { Papel } from "@prisma/client";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtPayload } from "./auth.service";

export interface UsuarioAtual {
  userId: string;
  email: string;
  instituicaoId: string;
  papel: Papel;
  isAdminInstituicao: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "dev-secret",
    });
  }

  validate(payload: JwtPayload): UsuarioAtual {
    return {
      userId: payload.sub,
      email: payload.email,
      instituicaoId: payload.instituicaoId,
      papel: payload.papel ?? (payload.isAdminInstituicao ? "GESTAO_INSTITUICAO" : "ANALISTA"),
      isAdminInstituicao: payload.isAdminInstituicao,
    };
  }
}
