import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";
import { CurrentUser } from "./current-user.decorator";
import type { UsuarioAtual } from "./jwt.strategy";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  loginSchema,
  registrarInstituicaoSchema,
  type LoginDto,
  type RegistrarInstituicaoDto,
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

  @Get("me")
  me(@CurrentUser() user: UsuarioAtual) {
    return user;
  }
}
