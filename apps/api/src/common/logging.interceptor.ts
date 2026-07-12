import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

interface ReqCtx {
  method: string;
  url: string;
  originalUrl?: string;
  requestId?: string;
  user?: { userId?: string; instituicaoId?: string };
}
interface ResCtx {
  statusCode: number;
}

/** Log de acesso por requisição: método, rota, status, latência, request-id e
 *  usuário/instituição (quando autenticado). Texto legível em dev; uma linha
 *  JSON por requisição quando `LOG_JSON=true` (para coletores/observabilidade).
 *  Erros (>=500 ou exceção) saem em nível `error`. `/health` é ignorado. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");
  private readonly json = process.env.LOG_JSON === "true";

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();
    const http = context.switchToHttp();
    const req = http.getRequest<ReqCtx>();
    const res = http.getResponse<ResCtx>();
    const url = req.originalUrl ?? req.url;
    if (url.startsWith("/health")) return next.handle();

    const start = Date.now();
    const emit = (status: number, err?: string) => {
      const level = status >= 500 ? "error" : status >= 400 ? "warn" : "log";
      const p = {
        requestId: req.requestId,
        method: req.method,
        url,
        status,
        ms: Date.now() - start,
        userId: req.user?.userId,
        instituicaoId: req.user?.instituicaoId,
        ...(err ? { err } : {}),
      };
      if (this.json) {
        this.logger[level](JSON.stringify(p));
      } else {
        this.logger[level](
          `${p.method} ${p.url} ${p.status} ${p.ms}ms [${p.requestId ?? "-"}]` +
            (p.userId ? ` user=${p.userId}` : "") +
            (err ? ` — ${err}` : ""),
        );
      }
    };

    return next.handle().pipe(
      tap({
        next: () => emit(res.statusCode),
        error: (e: { status?: number; message?: string }) =>
          emit(e?.status ?? 500, e?.message ?? String(e)),
      }),
    );
  }
}
