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
  adminSenha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});
export type RegistrarInstituicaoDto = z.infer<typeof registrarInstituicaoSchema>;
