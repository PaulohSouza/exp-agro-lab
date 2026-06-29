import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Valida a entrada (corpo/query/param) contra um schema Zod antes do handler.
 * Substitui o FormRequest do esboço (§5.2 do padrão). Em falha, 400 com as
 * mensagens em PT por campo.
 *
 * Uso: `@Body(new ZodValidationPipe(criarXSchema)) dto: CriarXDto`
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const r = this.schema.safeParse(value);
    if (!r.success) {
      const msgs = r.error.issues.map((i) => {
        const campo = i.path.join(".") || "(corpo)";
        return `${campo}: ${i.message}`;
      });
      throw new BadRequestException(msgs);
    }
    return r.data;
  }
}
