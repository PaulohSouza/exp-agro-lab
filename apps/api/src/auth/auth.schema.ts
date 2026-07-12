import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const registrarInstituicaoSchema = z.object({
  instituicaoNome: z.string().min(1, "Nome da instituição obrigatório"),
  adminNome: z.string().min(1, "Nome do administrador obrigatório"),
  adminEmail: z.string().email("E-mail inválido"),
  // política completa (tamanho + complexidade) validada no service (assertSenhaForte)
  adminSenha: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
});
export type RegistrarInstituicaoDto = z.infer<typeof registrarInstituicaoSchema>;

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, "refresh_token obrigatório"),
});
export type RefreshDto = z.infer<typeof refreshSchema>;
