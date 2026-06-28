import { Body, Controller, Get, Post } from "@nestjs/common";
import { CadastrosService } from "./cadastros.service";

@Controller("cadastros")
export class CadastrosController {
  constructor(private readonly service: CadastrosService) {}

  @Get("produtos")
  listarProdutos() {
    return this.service.listarProdutos();
  }
  @Post("produtos")
  criarProduto(@Body() dto: { nome: string; marca?: string }) {
    return this.service.criarProduto(dto);
  }

  @Get("atividades")
  listarAtividades() {
    return this.service.listarAtividades();
  }
  @Post("atividades")
  criarAtividade(@Body() dto: { nome: string; valorVenda?: number }) {
    return this.service.criarAtividade(dto);
  }
}
