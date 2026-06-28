import { SetMetadata } from "@nestjs/common";
import type { Papel } from "@prisma/client";

export const PAPEIS_KEY = "papeisPermitidos";

/**
 * Restringe a rota aos papéis informados (RN-RBAC). `admin_sistema` passa
 * sempre. Sem o decorator, qualquer usuário autenticado é permitido.
 */
export const RequirePapel = (...papeis: Papel[]) => SetMetadata(PAPEIS_KEY, papeis);
