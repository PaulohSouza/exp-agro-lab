import { Controller, Get, Param } from "@nestjs/common";
import { DominiosService } from "./dominios.service";

/** Dicionário de valores enumerados — significado legível de cada código (D6 / §4.9). */
@Controller("dominios")
export class DominiosController {
  constructor(private readonly service: DominiosService) {}

  @Get() listar() {
    return this.service.listar();
  }

  @Get(":dominio") porDominio(@Param("dominio") dominio: string) {
    return this.service.listarPorDominio(dominio);
  }
}
