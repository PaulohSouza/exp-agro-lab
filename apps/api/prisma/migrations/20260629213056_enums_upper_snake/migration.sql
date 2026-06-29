-- Padrão de desenvolvimento (D3): valores de enum em UPPER_SNAKE_CASE.
-- Preserva dados: ENUM -> VARCHAR -> UPDATE -> ENUM final.

-- Instituicao.politicaAprovacao (PoliticaAprovacao)
ALTER TABLE `Instituicao` MODIFY `politicaAprovacao` VARCHAR(191) NOT NULL;
UPDATE `Instituicao` SET `politicaAprovacao` = 'TODOS' WHERE `politicaAprovacao` = 'todos';
UPDATE `Instituicao` SET `politicaAprovacao` = 'N_DE_M' WHERE `politicaAprovacao` = 'n_de_m';
ALTER TABLE `Instituicao` MODIFY `politicaAprovacao` ENUM('TODOS', 'N_DE_M') NOT NULL DEFAULT 'TODOS';

-- Unidade.tipo (TipoUnidade)
ALTER TABLE `Unidade` MODIFY `tipo` VARCHAR(191) NOT NULL;
UPDATE `Unidade` SET `tipo` = 'UNIDADE' WHERE `tipo` = 'unidade';
UPDATE `Unidade` SET `tipo` = 'LABORATORIO' WHERE `tipo` = 'laboratorio';
ALTER TABLE `Unidade` MODIFY `tipo` ENUM('UNIDADE', 'LABORATORIO') NOT NULL DEFAULT 'UNIDADE';

-- User.papel (Papel)
ALTER TABLE `User` MODIFY `papel` VARCHAR(191) NOT NULL;
UPDATE `User` SET `papel` = 'ADMIN_SISTEMA' WHERE `papel` = 'admin_sistema';
UPDATE `User` SET `papel` = 'GESTAO_INSTITUICAO' WHERE `papel` = 'gestao_instituicao';
UPDATE `User` SET `papel` = 'GESTAO_DEPARTAMENTO' WHERE `papel` = 'gestao_departamento';
UPDATE `User` SET `papel` = 'COORDENADOR_AREA' WHERE `papel` = 'coordenador_area';
UPDATE `User` SET `papel` = 'PESQUISADOR' WHERE `papel` = 'pesquisador';
UPDATE `User` SET `papel` = 'ANALISTA' WHERE `papel` = 'analista';
UPDATE `User` SET `papel` = 'ASSISTENTE' WHERE `papel` = 'assistente';
ALTER TABLE `User` MODIFY `papel` ENUM('ADMIN_SISTEMA', 'GESTAO_INSTITUICAO', 'GESTAO_DEPARTAMENTO', 'COORDENADOR_AREA', 'PESQUISADOR', 'ANALISTA', 'ASSISTENTE') NOT NULL DEFAULT 'ANALISTA';

-- Experimento.ensaio (Ensaio)
ALTER TABLE `Experimento` MODIFY `ensaio` VARCHAR(191) NOT NULL;
UPDATE `Experimento` SET `ensaio` = 'INTERNO' WHERE `ensaio` = 'interno';
UPDATE `Experimento` SET `ensaio` = 'COMERCIAL' WHERE `ensaio` = 'comercial';
ALTER TABLE `Experimento` MODIFY `ensaio` ENUM('INTERNO', 'COMERCIAL') NOT NULL DEFAULT 'INTERNO';

-- Experimento.status (StatusExperimento)
ALTER TABLE `Experimento` MODIFY `status` VARCHAR(191) NOT NULL;
UPDATE `Experimento` SET `status` = 'INSERINDO' WHERE `status` = 'Inserindo';
UPDATE `Experimento` SET `status` = 'APROVADO_CAD' WHERE `status` = 'AprovadoCAD';
UPDATE `Experimento` SET `status` = 'RECUSADO_CAD' WHERE `status` = 'RecusadoCAD';
UPDATE `Experimento` SET `status` = 'EM_CONDUCAO' WHERE `status` = 'EmConducao';
UPDATE `Experimento` SET `status` = 'CONCLUIDO' WHERE `status` = 'Concluido';
ALTER TABLE `Experimento` MODIFY `status` ENUM('INSERINDO', 'APROVADO_CAD', 'RECUSADO_CAD', 'EM_CONDUCAO', 'CONCLUIDO') NOT NULL DEFAULT 'INSERINDO';

-- Experimento.tipoPeriodo (TipoPeriodo)
ALTER TABLE `Experimento` MODIFY `tipoPeriodo` VARCHAR(191) NOT NULL;
UPDATE `Experimento` SET `tipoPeriodo` = 'SAFRA' WHERE `tipoPeriodo` = 'safra';
UPDATE `Experimento` SET `tipoPeriodo` = 'ANO_SEMESTRE' WHERE `tipoPeriodo` = 'ano_semestre';
ALTER TABLE `Experimento` MODIFY `tipoPeriodo` ENUM('SAFRA', 'ANO_SEMESTRE') NOT NULL DEFAULT 'SAFRA';

-- Fator.tipo (TipoFator)
ALTER TABLE `Fator` MODIFY `tipo` VARCHAR(191) NOT NULL;
UPDATE `Fator` SET `tipo` = 'QUALITATIVO' WHERE `tipo` = 'qualitativo';
UPDATE `Fator` SET `tipo` = 'QUANTITATIVO' WHERE `tipo` = 'quantitativo';
ALTER TABLE `Fator` MODIFY `tipo` ENUM('QUALITATIVO', 'QUANTITATIVO') NOT NULL DEFAULT 'QUALITATIVO';

-- Avaliacao.tipo (TipoAvaliacao)
ALTER TABLE `Avaliacao` MODIFY `tipo` VARCHAR(191) NOT NULL;
UPDATE `Avaliacao` SET `tipo` = 'CALENDARIZADA' WHERE `tipo` = 'calendarizada';
UPDATE `Avaliacao` SET `tipo` = 'CONDICIONAL' WHERE `tipo` = 'condicional';
ALTER TABLE `Avaliacao` MODIFY `tipo` ENUM('CALENDARIZADA', 'CONDICIONAL') NOT NULL DEFAULT 'CALENDARIZADA';

-- ModeloAvaliacao.escopo (EscopoModelo)
ALTER TABLE `ModeloAvaliacao` MODIFY `escopo` VARCHAR(191) NOT NULL;
UPDATE `ModeloAvaliacao` SET `escopo` = 'SISTEMA' WHERE `escopo` = 'sistema';
UPDATE `ModeloAvaliacao` SET `escopo` = 'INSTITUICAO' WHERE `escopo` = 'instituicao';
UPDATE `ModeloAvaliacao` SET `escopo` = 'DEPARTAMENTO' WHERE `escopo` = 'departamento';
ALTER TABLE `ModeloAvaliacao` MODIFY `escopo` ENUM('SISTEMA', 'INSTITUICAO', 'DEPARTAMENTO') NOT NULL DEFAULT 'SISTEMA';

-- GrupoColeta.escopo (EscopoModelo)
ALTER TABLE `GrupoColeta` MODIFY `escopo` VARCHAR(191) NOT NULL;
UPDATE `GrupoColeta` SET `escopo` = 'SISTEMA' WHERE `escopo` = 'sistema';
UPDATE `GrupoColeta` SET `escopo` = 'INSTITUICAO' WHERE `escopo` = 'instituicao';
UPDATE `GrupoColeta` SET `escopo` = 'DEPARTAMENTO' WHERE `escopo` = 'departamento';
ALTER TABLE `GrupoColeta` MODIFY `escopo` ENUM('SISTEMA', 'INSTITUICAO', 'DEPARTAMENTO') NOT NULL DEFAULT 'INSTITUICAO';

-- ModeloAtividade.escopo (EscopoModelo)
ALTER TABLE `ModeloAtividade` MODIFY `escopo` VARCHAR(191) NOT NULL;
UPDATE `ModeloAtividade` SET `escopo` = 'SISTEMA' WHERE `escopo` = 'sistema';
UPDATE `ModeloAtividade` SET `escopo` = 'INSTITUICAO' WHERE `escopo` = 'instituicao';
UPDATE `ModeloAtividade` SET `escopo` = 'DEPARTAMENTO' WHERE `escopo` = 'departamento';
ALTER TABLE `ModeloAtividade` MODIFY `escopo` ENUM('SISTEMA', 'INSTITUICAO', 'DEPARTAMENTO') NOT NULL DEFAULT 'SISTEMA';

-- ModeloAtividade.tipo (TipoAtividade)
ALTER TABLE `ModeloAtividade` MODIFY `tipo` VARCHAR(191) NOT NULL;
UPDATE `ModeloAtividade` SET `tipo` = 'ACAO' WHERE `tipo` = 'acao';
UPDATE `ModeloAtividade` SET `tipo` = 'APONTAMENTO' WHERE `tipo` = 'apontamento';
ALTER TABLE `ModeloAtividade` MODIFY `tipo` ENUM('ACAO', 'APONTAMENTO') NOT NULL DEFAULT 'ACAO';

-- AtividadeExperimento.tipo (TipoAtividade)
ALTER TABLE `AtividadeExperimento` MODIFY `tipo` VARCHAR(191) NOT NULL;
UPDATE `AtividadeExperimento` SET `tipo` = 'ACAO' WHERE `tipo` = 'acao';
UPDATE `AtividadeExperimento` SET `tipo` = 'APONTAMENTO' WHERE `tipo` = 'apontamento';
ALTER TABLE `AtividadeExperimento` MODIFY `tipo` ENUM('ACAO', 'APONTAMENTO') NOT NULL DEFAULT 'ACAO';

-- AtividadeExperimento.marco (MarcoTipo)
ALTER TABLE `AtividadeExperimento` MODIFY `marco` VARCHAR(191) NULL;
UPDATE `AtividadeExperimento` SET `marco` = 'IMPLANTACAO' WHERE `marco` = 'implantacao';
UPDATE `AtividadeExperimento` SET `marco` = 'INICIO' WHERE `marco` = 'inicio';
UPDATE `AtividadeExperimento` SET `marco` = 'FIM' WHERE `marco` = 'fim';
UPDATE `AtividadeExperimento` SET `marco` = 'SEMEADURA' WHERE `marco` = 'semeadura';
UPDATE `AtividadeExperimento` SET `marco` = 'COLHEITA' WHERE `marco` = 'colheita';
ALTER TABLE `AtividadeExperimento` MODIFY `marco` ENUM('IMPLANTACAO', 'INICIO', 'FIM', 'SEMEADURA', 'COLHEITA') NULL;

-- ModeloAtividadeCampo.tipo (TipoCampo)
ALTER TABLE `ModeloAtividadeCampo` MODIFY `tipo` VARCHAR(191) NOT NULL;
UPDATE `ModeloAtividadeCampo` SET `tipo` = 'NUMERO' WHERE `tipo` = 'numero';
UPDATE `ModeloAtividadeCampo` SET `tipo` = 'TEXTO' WHERE `tipo` = 'texto';
UPDATE `ModeloAtividadeCampo` SET `tipo` = 'DATA' WHERE `tipo` = 'data';
UPDATE `ModeloAtividadeCampo` SET `tipo` = 'BOOLEANO' WHERE `tipo` = 'booleano';
ALTER TABLE `ModeloAtividadeCampo` MODIFY `tipo` ENUM('NUMERO', 'TEXTO', 'DATA', 'BOOLEANO') NOT NULL DEFAULT 'NUMERO';

-- AvaliacaoDado.origem (OrigemColeta)
ALTER TABLE `AvaliacaoDado` MODIFY `origem` VARCHAR(191) NOT NULL;
UPDATE `AvaliacaoDado` SET `origem` = 'WEB' WHERE `origem` = 'web';
UPDATE `AvaliacaoDado` SET `origem` = 'MOBILE' WHERE `origem` = 'mobile';
ALTER TABLE `AvaliacaoDado` MODIFY `origem` ENUM('WEB', 'MOBILE') NOT NULL DEFAULT 'WEB';

-- ExperimentoCompartilhamento.nivel (NivelCompartilhamento)
ALTER TABLE `ExperimentoCompartilhamento` MODIFY `nivel` VARCHAR(191) NOT NULL;
UPDATE `ExperimentoCompartilhamento` SET `nivel` = 'INPUT' WHERE `nivel` = 'input';
UPDATE `ExperimentoCompartilhamento` SET `nivel` = 'EDIT' WHERE `nivel` = 'edit';
ALTER TABLE `ExperimentoCompartilhamento` MODIFY `nivel` ENUM('INPUT', 'EDIT') NOT NULL DEFAULT 'INPUT';

-- OrdemServico.status (StatusOS)
ALTER TABLE `OrdemServico` MODIFY `status` VARCHAR(191) NOT NULL;
UPDATE `OrdemServico` SET `status` = 'RASCUNHO' WHERE `status` = 'rascunho';
UPDATE `OrdemServico` SET `status` = 'AGUARDANDO_APROVACAO_INTERNA' WHERE `status` = 'aguardando_aprovacao_interna';
UPDATE `OrdemServico` SET `status` = 'AGUARDANDO_APROVACAO_CLIENTE' WHERE `status` = 'aguardando_aprovacao_cliente';
UPDATE `OrdemServico` SET `status` = 'APROVADA' WHERE `status` = 'aprovada';
UPDATE `OrdemServico` SET `status` = 'RECUSADA' WHERE `status` = 'recusada';
ALTER TABLE `OrdemServico` MODIFY `status` ENUM('RASCUNHO', 'AGUARDANDO_APROVACAO_INTERNA', 'AGUARDANDO_APROVACAO_CLIENTE', 'APROVADA', 'RECUSADA') NOT NULL DEFAULT 'RASCUNHO';

-- AprovacaoOSInterna.decisao (Decisao)
ALTER TABLE `AprovacaoOSInterna` MODIFY `decisao` VARCHAR(191) NOT NULL;
UPDATE `AprovacaoOSInterna` SET `decisao` = 'PENDENTE' WHERE `decisao` = 'pendente';
UPDATE `AprovacaoOSInterna` SET `decisao` = 'APROVADO' WHERE `decisao` = 'aprovado';
UPDATE `AprovacaoOSInterna` SET `decisao` = 'RECUSADO' WHERE `decisao` = 'recusado';
ALTER TABLE `AprovacaoOSInterna` MODIFY `decisao` ENUM('PENDENTE', 'APROVADO', 'RECUSADO') NOT NULL;

-- AprovacaoCliente.decisao (Decisao)
ALTER TABLE `AprovacaoCliente` MODIFY `decisao` VARCHAR(191) NOT NULL;
UPDATE `AprovacaoCliente` SET `decisao` = 'PENDENTE' WHERE `decisao` = 'pendente';
UPDATE `AprovacaoCliente` SET `decisao` = 'APROVADO' WHERE `decisao` = 'aprovado';
UPDATE `AprovacaoCliente` SET `decisao` = 'RECUSADO' WHERE `decisao` = 'recusado';
ALTER TABLE `AprovacaoCliente` MODIFY `decisao` ENUM('PENDENTE', 'APROVADO', 'RECUSADO') NOT NULL DEFAULT 'PENDENTE';

-- EmailLog.status (StatusEmail)
ALTER TABLE `EmailLog` MODIFY `status` VARCHAR(191) NOT NULL;
UPDATE `EmailLog` SET `status` = 'SIMULADO' WHERE `status` = 'simulado';
UPDATE `EmailLog` SET `status` = 'ENVIADO' WHERE `status` = 'enviado';
UPDATE `EmailLog` SET `status` = 'ERRO' WHERE `status` = 'erro';
ALTER TABLE `EmailLog` MODIFY `status` ENUM('SIMULADO', 'ENVIADO', 'ERRO') NOT NULL DEFAULT 'SIMULADO';

