import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";

interface Req {
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
}
interface Res {
  setHeader(name: string, value: string): void;
}

/** Correlação de requisições: usa o `x-request-id` recebido (ex.: de um proxy)
 *  ou gera um novo. Fica disponível em `req.requestId` e volta no header da
 *  resposta, para casar logs cliente↔servidor. */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Req, res: Res, next: () => void) {
    const incoming = req.headers["x-request-id"];
    const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
    req.requestId = id;
    res.setHeader("x-request-id", id);
    next();
  }
}
