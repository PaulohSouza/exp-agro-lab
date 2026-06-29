-- Padrão de desenvolvimento (D4): booleanos com prefixo is/has.
-- Renomeia colunas preservando os dados (RENAME COLUMN, MySQL 8).

-- ativo -> isAtivo (13 tabelas)
ALTER TABLE `Instituicao` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `Departamento` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `Unidade` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `User` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `Categoria` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `Subcategoria` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `ObjetoEstudo` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `Produto` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `Atividade` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `ModeloAvaliacao` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `GrupoColeta` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `ModeloAtividade` RENAME COLUMN `ativo` TO `isAtivo`;
ALTER TABLE `AprovadorInstituicao` RENAME COLUMN `ativo` TO `isAtivo`;

-- demais booleanos
ALTER TABLE `Categoria` RENAME COLUMN `eCultura` TO `isCultura`;
ALTER TABLE `Avaliacao` RENAME COLUMN `personalizada` TO `isPersonalizada`;
ALTER TABLE `ModeloAtividade` RENAME COLUMN `fornecAreaColheita` TO `isFonteAreaColheita`;
ALTER TABLE `ModeloAtividadeCampo` RENAME COLUMN `obrigatorio` TO `isObrigatorio`;
ALTER TABLE `AtividadeExperimento` RENAME COLUMN `confirmada` TO `isConfirmada`;
ALTER TABLE `ExperimentoCompartilhamento` RENAME COLUMN `aceito` TO `isAceito`;
