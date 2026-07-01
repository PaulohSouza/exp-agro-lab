#!/usr/bin/env Rscript
# Gera as fixtures de referência dos GOLDEN TESTS vs SAGRE.
#
# A engine estatística do SAGRE é o ExpDes.pt (dic/dbc/fat2.dbc/fat3.dbc), um
# wrapper sobre aov() com decomposição sequencial (Type I) — que, em designs
# BALANCEADOS, coincide com o Type II. Este script:
#   1. lê as planilhas de teste do SAGRE-app (BD/dados),
#   2. copia os dados como CSV versionado em golden/data/ (para o TS ler sem R),
#   3. calcula a ANOVA de referência via aov() — cruzada com ExpDes.pt::fat3.dbc
#      (ver STATUS §8.2; casamento à última casa decimal),
#   4. grava golden/reference.json.
# Rode localmente (precisa de R + readxl + jsonlite); a CI NÃO roda R, só compara
# o TS contra o JSON já commitado.
#
# uso:  Rscript packages/analytics/golden/gen-reference.R

suppressMessages({
  library(readxl)
  library(jsonlite)
  library(agricolae)
})

args <- commandArgs(trailingOnly = TRUE)
DADOS <- if (length(args) >= 1) args[1] else Sys.getenv(
  "SAGRE_DADOS",
  "/mnt/ds/drive/analytics/fmt-analytics-restrito/programming/projects/shiny/sagre-app/BD/dados"
)
AQUI <- dirname(sub("--file=", "", grep("--file=", commandArgs(FALSE), value = TRUE)))
if (length(AQUI) == 0 || AQUI == "") AQUI <- "packages/analytics/golden"
DATA_DIR <- file.path(AQUI, "data")
dir.create(DATA_DIR, showWarnings = FALSE, recursive = TRUE)

# --- manifest: cada caso mapeia uma planilha a um delineamento + resposta(s). ---
manifest <- list(
  list(id = "1fator_dbc_6trat", arquivo = "teste_1fator_dbc_6trat.xlsx",
       csv = "1fator_dbc_6trat.csv", tipo = "DBC1",
       trat = "Tratamento", bloco = "Bloco", respostas = "Produtividade"),
  list(id = "fatorial_dbc_3x4", arquivo = "teste_fatorial_dbc_3x4.xlsx",
       csv = "fatorial_dbc_3x4.csv", tipo = "FAT2", delineamento = "DBC",
       fatores = c("Fator1", "Fator2"), rotulos = c("F1", "F2"),
       bloco = "Bloco", respostas = c("Produtividade", "Altura")),
  list(id = "trifatorial_dbc_3x3x2", arquivo = "teste_trifatorial_dbc_3x3x2.xlsx",
       csv = "trifatorial_dbc_3x3x2.csv", tipo = "FAT3", delineamento = "DBC",
       fatores = c("Fator1", "Fator2", "Fator3"), rotulos = c("F1", "F2", "F3"),
       bloco = "Bloco", respostas = c("Produtividade", "Altura")),
  list(id = "trifatorial_triplasig_3x3x2", arquivo = "teste_trifatorial_triplasig_3x3x2.xlsx",
       csv = "trifatorial_triplasig_3x3x2.csv", tipo = "FAT3", delineamento = "DBC",
       fatores = c("Fator1", "Fator2", "Fator3"), rotulos = c("F1", "F2", "F3"),
       bloco = "Bloco", respostas = c("Produtividade", "Altura"))
)

# tabela ANOVA a partir de um aov(), com fontes renomeadas para o padrão do TS.
tabela_anova <- function(modelo, mapa) {
  a <- anova(modelo)
  linhas <- list()
  for (termo in rownames(a)) {
    fonte <- mapa(trimws(termo))
    linhas[[length(linhas) + 1]] <- list(
      fonte = fonte,
      gl = as.integer(a[termo, "Df"]),
      sq = unname(a[termo, "Sum Sq"]),
      qm = unname(a[termo, "Mean Sq"]),
      f = if ("F value" %in% colnames(a) && !is.na(a[termo, "F value"])) unname(a[termo, "F value"]) else NULL,
      p = if ("Pr(>F)" %in% colnames(a) && !is.na(a[termo, "Pr(>F)"])) unname(a[termo, "Pr(>F)"]) else NULL
    )
  }
  linhas
}

casos <- list()

for (m in manifest) {
  df <- as.data.frame(read_excel(file.path(DADOS, m$arquivo)))
  names(df) <- make.names(names(df))
  write.csv(df, file.path(DATA_DIR, m$csv), row.names = FALSE)

  for (resp in m$respostas) {
    respv <- df[[make.names(resp)]]
    medias <- NULL
    if (m$tipo == "DBC1") {
      trat <- factor(df[[m$trat]]); bloco <- factor(df[[m$bloco]])
      mod <- aov(respv ~ trat + bloco)
      mapa <- function(t) c("trat" = "Tratamento", "bloco" = "Bloco", "Residuals" = "Resíduo")[t]
      rotulos <- NULL
      # médias + grupos de Tukey (agricolae HSD.test) — valida comparacao.ts
      h <- HSD.test(mod, "trat", group = TRUE)
      g <- h$groups
      medias <- lapply(rownames(g), function(tr) list(
        tratamento = tr, media = unname(g[tr, 1]), grupos = trimws(as.character(g[tr, "groups"]))
      ))
    } else {
      bloco <- factor(df[[m$bloco]])
      fs <- lapply(m$fatores, function(f) factor(df[[f]]))
      names(fs) <- paste0("f", seq_along(fs))
      env <- list2env(fs); assign("bloco", bloco, env); assign("respv", respv, env)
      form <- as.formula(paste0("respv ~ ", paste(names(fs), collapse = "*"), " + bloco"))
      mod <- eval(aov(form, data = env))
      # mapa fN / fN:fM → rótulo × rótulo, na convenção do TS.
      rot <- m$rotulos
      mapa <- function(t) {
        if (t == "bloco") return("Bloco")
        if (t == "Residuals") return("Resíduo")
        idx <- as.integer(gsub("f", "", strsplit(t, ":")[[1]]))
        paste(rot[idx], collapse = " × ")
      }
      rotulos <- rot
    }
    glRes <- df.residual(mod)
    qmRes <- sum(residuals(mod)^2) / glRes
    cv <- sqrt(qmRes) / mean(respv) * 100
    casos[[length(casos) + 1]] <- list(
      id = paste0(m$id, "__", make.names(resp)),
      arquivo = m$arquivo, csv = m$csv, tipo = m$tipo,
      delineamento = if (!is.null(m$delineamento)) m$delineamento else "DBC",
      fatores = if (!is.null(m$fatores)) m$fatores else NULL,
      rotulos = rotulos, bloco = m$bloco, trat = if (!is.null(m$trat)) m$trat else NULL,
      resposta = resp,
      n = length(respv), cv = cv, glResiduo = as.integer(glRes), qmResiduo = qmRes,
      anova = tabela_anova(mod, mapa), medias = medias
    )
  }
}

# --- SPLIT-PLOT (parcela subdividida, DBC): reusa layout fatorial 2 como split.
# Referência independente via aov(y ~ A*B + Error(Bloco/A)) — dois erros —,
# cruzada com ExpDes.pt::psub2.dbc à última casa decimal (ver STATUS §3.7).
manifest_split <- list(
  list(id = "split_dbc_3x4", arquivo = "teste_fatorial_dbc_3x4.xlsx",
       csv = "fatorial_dbc_3x4.csv", fatorA = "Fator1", fatorB = "Fator2",
       bloco = "Bloco", respostas = c("Produtividade", "Altura"))
)
for (m in manifest_split) {
  df <- as.data.frame(read_excel(file.path(DADOS, m$arquivo)))
  names(df) <- make.names(names(df))
  for (resp in m$respostas) {
    A <- factor(df[[m$fatorA]]); B <- factor(df[[m$fatorB]])
    Bl <- factor(df[[m$bloco]]); y <- df[[make.names(resp)]]
    mod <- aov(y ~ A * B + Error(Bl / A))
    s <- summary(mod)
    linha <- function(df_est, termo) {
      r <- df_est[trimws(rownames(df_est)) == termo, , drop = FALSE]
      list(gl = as.integer(r[["Df"]]), sq = unname(r[["Sum Sq"]]), qm = unname(r[["Mean Sq"]]),
           f = if ("F value" %in% colnames(r) && !is.na(r[["F value"]])) unname(r[["F value"]]) else NULL,
           p = if ("Pr(>F)" %in% colnames(r) && !is.na(r[["Pr(>F)"]])) unname(r[["Pr(>F)"]]) else NULL)
    }
    estBloco <- s[["Error: Bl"]][[1]]; estA <- s[["Error: Bl:A"]][[1]]; estW <- s[["Error: Within"]][[1]]
    bloco <- linha(estBloco, "Residuals"); fatA <- linha(estA, "A"); erroA <- linha(estA, "Residuals")
    fatB <- linha(estW, "B"); ab <- linha(estW, "A:B"); erroB <- linha(estW, "Residuals")
    anova <- list(
      list(fonte = "Bloco", gl = bloco$gl, sq = bloco$sq, qm = bloco$qm),
      list(fonte = "Fator A (parcela)", gl = fatA$gl, sq = fatA$sq, qm = fatA$qm, f = fatA$f, p = fatA$p),
      list(fonte = "Erro(a)", gl = erroA$gl, sq = erroA$sq, qm = erroA$qm),
      list(fonte = "Fator B (subparcela)", gl = fatB$gl, sq = fatB$sq, qm = fatB$qm, f = fatB$f, p = fatB$p),
      list(fonte = "A × B", gl = ab$gl, sq = ab$sq, qm = ab$qm, f = ab$f, p = ab$p),
      list(fonte = "Erro(b)", gl = erroB$gl, sq = erroB$sq, qm = erroB$qm)
    )
    casos[[length(casos) + 1]] <- list(
      id = paste0(m$id, "__", make.names(resp)), arquivo = m$arquivo, csv = m$csv,
      tipo = "SPLIT", delineamento = "DBC", bloco = m$bloco,
      fatorA = m$fatorA, fatorB = m$fatorB, resposta = resp,
      n = length(y), cvParcela = sqrt(erroA$qm) / mean(y) * 100,
      cvSubparcela = sqrt(erroB$qm) / mean(y) * 100,
      glResiduoA = erroA$gl, glResiduoB = erroB$gl, anova = anova
    )
  }
}

out <- list(
  fonte = "ExpDes.pt / aov() — engine do SAGRE (cross-check fat3.dbc/psub2.dbc à última casa decimal)",
  geradoPor = "packages/analytics/golden/gen-reference.R",
  casos = casos
)
write_json(out, file.path(AQUI, "reference.json"), auto_unbox = TRUE, digits = 12, pretty = TRUE)
cat("OK:", length(casos), "casos →", file.path(AQUI, "reference.json"), "\n")
