export type Delineamento = "DIC" | "DBC";

export interface Observacao {
  tratamento: string;
  bloco?: string | number;
  valor: number;
}

export interface MediaTratamento {
  tratamento: string;
  media: number;
  n: number;
  letra?: string;
}

export interface AnovaLinha {
  fonte: string;
  gl: number;
  sq: number;
  qm: number;
  f?: number;
  p?: number;
}

export interface ResultadoAnova {
  delineamento: Delineamento;
  tabela: AnovaLinha[];
  mediaGeral: number;
  cv: number;
  glResiduo: number;
  qmResiduo: number;
  fTratamento: number;
  pTratamento: number;
  significativo: boolean;
  medias: MediaTratamento[];
  pressupostos: { bartlettEstatistica: number; bartlettP: number; homogeneo: boolean };
  comparacao: { metodo: string; alpha: number };
}
