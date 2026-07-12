import { Injectable, Logger } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";

/**
 * Storage de arquivos (fotos de parcela / anexos). Driver S3-compatível (MinIO
 * em dev via docker-compose, S3 em produção) com **fallback local** quando as
 * variáveis S3_* não estão configuradas — mesmo padrão do e-mail (SMTP → SIMULATE).
 * @see SDD/04-design-detalhado/09-fotos-coleta-parcial-timeline.md (Demanda E)
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3?: S3Client;
  private readonly bucket = process.env.S3_BUCKET ?? "expagrolab";
  // Base pública para montar a URL do objeto (ex.: http://localhost:9000).
  private readonly publicBase = process.env.S3_PUBLIC_BASE ?? process.env.S3_ENDPOINT ?? "";
  // Fallback local: pasta servida por GET /uploads/* e base da API para a URL.
  private readonly localDir = process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), "uploads");
  private readonly apiBase = process.env.API_PUBLIC_BASE ?? "";

  constructor() {
    const { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;
    if (S3_ENDPOINT && S3_ACCESS_KEY && S3_SECRET_KEY) {
      this.s3 = new S3Client({
        endpoint: S3_ENDPOINT,
        region: process.env.S3_REGION ?? "us-east-1",
        forcePathStyle: true, // exigido pelo MinIO
        credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
      });
    } else {
      this.logger.warn("S3 não configurado — usando storage local (fallback dev).");
    }
  }

  get modo(): "s3" | "local" {
    return this.s3 ? "s3" : "local";
  }

  /** Sobe um arquivo e devolve a URL pública. `prefixo` organiza o objeto (ex.: "avaliacoes"). */
  async upload(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    prefixo = "uploads",
  ): Promise<{ url: string; key: string }> {
    const ext = path
      .extname(file.originalname)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, "");
    const key = `${prefixo}/${randomUUID()}${ext}`;

    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      const base = this.publicBase.replace(/\/$/, "");
      return { url: `${base}/${this.bucket}/${key}`, key };
    }

    // Fallback local: grava em disco; servido por GET /uploads/*.
    const dest = path.join(this.localDir, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, file.buffer);
    const base = this.apiBase.replace(/\/$/, "");
    return { url: `${base}/uploads/${key}`, key };
  }

  /** Lê um arquivo do storage local (só usado no modo fallback). */
  async lerLocal(key: string): Promise<Buffer> {
    const safe = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
    return fs.readFile(path.join(this.localDir, safe));
  }
}
