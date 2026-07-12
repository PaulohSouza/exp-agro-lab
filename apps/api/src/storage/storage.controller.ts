import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { StorageService } from "./storage.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";
import { Public } from "../auth/public.decorator";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const TIPOS_OK = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

@Controller()
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  /** Sobe uma imagem e devolve a URL pública (usada como fotoUrl na coleta). */
  @Post("uploads")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES } }))
  async upload(@CurrentUser() _user: UsuarioAtual, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Arquivo obrigatório (campo 'file').");
    if (!TIPOS_OK.has(file.mimetype))
      throw new BadRequestException("Tipo de imagem não suportado.");
    return this.storage.upload(file, "avaliacoes");
  }

  /** Serve o arquivo do storage local (modo fallback dev; público para uso em <img>). */
  @Public()
  @Get("uploads/:pasta/:arquivo")
  async servir(
    @Param("pasta") pasta: string,
    @Param("arquivo") arquivo: string,
    @Res() res: Response,
  ) {
    if (this.storage.modo !== "local") throw new BadRequestException("Storage remoto (use a URL).");
    try {
      const buf = await this.storage.lerLocal(`${pasta}/${arquivo}`);
      res.send(buf);
    } catch {
      throw new BadRequestException("Arquivo não encontrado.");
    }
  }
}
