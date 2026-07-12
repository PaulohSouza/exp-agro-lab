import { BadRequestException } from "@nestjs/common";

/** Política de senha forte (RN-AUTH). Mínimo configurável por
 *  PASSWORD_MIN_LENGTH (default 8) + ao menos uma letra e um número.
 *  Retorna a mensagem de erro ou null se a senha é aceitável. */
export function validarSenhaForte(senha: string): string | null {
  const min = Number(process.env.PASSWORD_MIN_LENGTH ?? 8);
  if (senha.length < min) return `A senha deve ter ao menos ${min} caracteres.`;
  if (!/[A-Za-z]/.test(senha)) return "A senha deve conter ao menos uma letra.";
  if (!/[0-9]/.test(senha)) return "A senha deve conter ao menos um número.";
  return null;
}

/** Lança 400 se a senha não atende à política. */
export function assertSenhaForte(senha: string): void {
  const erro = validarSenhaForte(senha);
  if (erro) throw new BadRequestException(erro);
}
