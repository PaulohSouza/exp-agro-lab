import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";
import { CurrentUser } from "./current-user.decorator";
import type { UsuarioAtual } from "./jwt.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  login(@Body() dto: { email: string; senha: string }) {
    return this.auth.login(dto.email, dto.senha);
  }

  @Public()
  @Post("register-instituicao")
  registrar(@Body() dto: { instituicaoNome: string; adminNome: string; adminEmail: string; adminSenha: string }) {
    return this.auth.registrarInstituicao(dto);
  }

  @Get("me")
  me(@CurrentUser() user: UsuarioAtual) {
    return user;
  }
}
