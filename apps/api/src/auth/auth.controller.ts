import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";
import { CurrentUser } from "./current-user.decorator";
import type { UsuarioAtual } from "./jwt.strategy";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  loginSchema,
  registrarInstituicaoSchema,
  refreshSchema,
  type LoginDto,
  type RegistrarInstituicaoDto,
  type RefreshDto,
} from "./auth.schema";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.auth.login(dto.email, dto.senha);
  }

  @Public()
  @Post("register-instituicao")
  registrar(@Body(new ZodValidationPipe(registrarInstituicaoSchema)) dto: RegistrarInstituicaoDto) {
    return this.auth.registrarInstituicao(dto);
  }

  @Public()
  @Post("refresh")
  refresh(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto) {
    return this.auth.refresh(dto.refresh_token);
  }

  @Public()
  @Post("logout")
  logout(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto) {
    return this.auth.logout(dto.refresh_token);
  }

  @Get("me")
  me(@CurrentUser() user: UsuarioAtual) {
    return user;
  }
}
