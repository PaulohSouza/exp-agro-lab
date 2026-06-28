import { Body, Controller, Post } from "@nestjs/common";
import { EmailService } from "./email.service";

/** Endpoint de demonstração do modo SIMULATE (Marco 0). */
@Controller("email")
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Post("preview-aprovacao")
  async previewAprovacao(@Body() body: { para?: string; experimentoTitulo?: string }) {
    const r = await this.email.enviarAprovacaoCliente({
      para: body.para ?? "cliente@exemplo.com",
      ordemServicoId: "demo",
      token: "demo-token-123",
      experimentoTitulo: body.experimentoTitulo ?? "PC1699 — Tidil Desfolhante",
    });
    return r;
  }
}
