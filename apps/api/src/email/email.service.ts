import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { PrismaService } from "../prisma/prisma.service";

export interface EmailInput {
  tipo: string;
  para: string;
  assunto: string;
  html: string;
  referenciaTipo?: string;
  referenciaId?: string;
}

export interface EmailResultado {
  ok: boolean;
  status: "SIMULADO" | "ENVIADO" | "ERRO";
  htmlPath?: string;
  erro?: string;
}

/**
 * Dispatcher de e-mail adaptado do SAGRE (blastula → nodemailer).
 * Modo SIMULATE (SIMULATE_SEND=true): renderiza o HTML em arquivo e registra
 * EmailLog, sem enviar — "formato para simular" pedido no projeto.
 * @see SDD/04-design-detalhado/02-design-modulos.md#email
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get habilitado() {
    return (process.env.EMAIL_ENABLED ?? "true") === "true";
  }
  private get simular() {
    return (process.env.SIMULATE_SEND ?? "true") === "true";
  }

  async enviar(input: EmailInput): Promise<EmailResultado> {
    if (!this.habilitado) {
      return { ok: true, status: "SIMULADO", erro: "EMAIL_ENABLED=false" };
    }

    if (this.simular) {
      const dir = process.env.SIMULATE_OUTPUT_DIR ?? "./email-previews";
      await fs.mkdir(dir, { recursive: true });
      const safe = `${Date.now()}-${input.tipo}-${input.para}`.replace(/[^a-zA-Z0-9._@-]/g, "_");
      const file = path.join(dir, `${safe}.html`);
      await fs.writeFile(file, this.envelopeHtml(input), "utf8");
      this.logger.log(
        `[SIMULATE] e-mail "${input.assunto}" → ${input.para} renderizado em ${file}`,
      );
      await this.log({ ...input, status: "SIMULADO", htmlPath: file });
      return { ok: true, status: "SIMULADO", htmlPath: file };
    }

    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.SMTP_PASSWORD },
      });
      await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: input.para,
        subject: input.assunto,
        html: this.envelopeHtml(input),
      });
      await this.log({ ...input, status: "ENVIADO" });
      return { ok: true, status: "ENVIADO" };
    } catch (e) {
      const erro = e instanceof Error ? e.message : String(e);
      this.logger.error(`Falha ao enviar e-mail: ${erro}`);
      await this.log({ ...input, status: "ERRO", erro });
      return { ok: false, status: "ERRO", erro };
    }
  }

  /** E-mail de aprovação de Ordem de Serviço pelo cliente (link/token). */
  async enviarAprovacaoCliente(params: {
    para: string;
    ordemServicoId: string;
    token: string;
    experimentoTitulo: string;
  }): Promise<EmailResultado> {
    const base = process.env.EMAIL_BASE_URL ?? "http://localhost:3000";
    const url = `${base}/aprovacao/${params.token}`;
    const html = `
      <h2 style="color:#1F2940">Aprovação de Ordem de Serviço</h2>
      <p>Você foi solicitado a aprovar a OS do experimento
         <strong>${params.experimentoTitulo}</strong>.</p>
      <p>
        <a href="${url}?decisao=aprovado" style="background:#6FA830;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Aprovar</a>
        &nbsp;
        <a href="${url}?decisao=recusado" style="background:#F34343;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Recusar</a>
      </p>
      <p style="color:#7987A1;font-size:12px">Ou copie o link: ${url}</p>`;
    return this.enviar({
      tipo: "aprovacao_os_cliente",
      para: params.para,
      assunto: `[EXP-AGROLAB] Aprovação da OS — ${params.experimentoTitulo}`,
      html,
      referenciaTipo: "OrdemServico",
      referenciaId: params.ordemServicoId,
    });
  }

  private envelopeHtml(input: EmailInput): string {
    return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8">
      <title>${input.assunto}</title></head>
      <body style="font-family:Inter,Arial,sans-serif;background:#F9F9FB;padding:24px">
        <div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;padding:24px">
          ${input.html}
          <hr style="border:none;border-top:1px solid #e1e1ef;margin:24px 0">
          <p style="color:#7987A1;font-size:12px">EXP-AGROLAB — e-mail automático, não responda.</p>
        </div></body></html>`;
  }

  private async log(
    d: EmailInput & { status: "SIMULADO" | "ENVIADO" | "ERRO"; htmlPath?: string; erro?: string },
  ) {
    try {
      await this.prisma.emailLog.create({
        data: {
          tipo: d.tipo,
          para: d.para,
          assunto: d.assunto,
          htmlPath: d.htmlPath,
          status: d.status,
          erro: d.erro,
          referenciaTipo: d.referenciaTipo,
          referenciaId: d.referenciaId,
        },
      });
    } catch (e) {
      this.logger.warn(`Não foi possível gravar EmailLog: ${e instanceof Error ? e.message : e}`);
    }
  }
}
