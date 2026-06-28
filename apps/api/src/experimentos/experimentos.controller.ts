import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import {
  ExperimentosService,
  type CriarExperimentoDto,
  type DefinirFatoresDto,
} from "./experimentos.service";

type AtualizarExperimentoDto = Partial<CriarExperimentoDto> & Record<string, unknown>;

@Controller("experimentos")
export class ExperimentosController {
  constructor(private readonly service: ExperimentosService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(":id")
  obter(@Param("id") id: string) {
    return this.service.obter(id);
  }

  @Post()
  criar(@Body() dto: CriarExperimentoDto) {
    return this.service.criar(dto);
  }

  @Put(":id")
  atualizar(@Param("id") id: string, @Body() dto: AtualizarExperimentoDto) {
    return this.service.atualizar(id, dto);
  }

  @Post(":id/fatores")
  definirFatores(@Param("id") id: string, @Body() dto: DefinirFatoresDto) {
    return this.service.definirFatores(id, dto);
  }

  @Post(":id/croqui/gerar")
  gerarCroqui(
    @Param("id") id: string,
    @Body() body: { delineamento?: "DIC" | "DBC" | "FATORIAL"; blocos?: number; seed?: number; numeroInicial?: number },
  ) {
    return this.service.gerarCroqui(id, body ?? {});
  }

  @Put(":id/croqui")
  salvarCroqui(
    @Param("id") id: string,
    @Body() body: { parcelas: Array<{ id: string; tratamentoId: string; bloco: number; posLinha: number; posColuna: number; numero: number; isInicio?: boolean }> },
  ) {
    return this.service.salvarCroqui(id, body.parcelas);
  }
}
