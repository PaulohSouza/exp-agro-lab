-- Padrão de desenvolvimento (§3): nomes por extenso (sem abreviações).
ALTER TABLE `Instituicao` RENAME COLUMN `nAprovadores` TO `numeroAprovadores`;
ALTER TABLE `ObjetoEstudo` RENAME COLUMN `obs` TO `observacoes`;
ALTER TABLE `Experimento` RENAME COLUMN `parcelaNumLinhas` TO `parcelaNumeroLinhas`;
ALTER TABLE `Experimento` RENAME COLUMN `numRepeticoes` TO `numeroRepeticoes`;
ALTER TABLE `Experimento` RENAME COLUMN `numTratamentos` TO `numeroTratamentos`;
ALTER TABLE `TratamentoProduto` RENAME COLUMN `seq` TO `sequencia`;
ALTER TABLE `Parcela` RENAME COLUMN `posLinha` TO `posicaoLinha`;
ALTER TABLE `Parcela` RENAME COLUMN `posColuna` TO `posicaoColuna`;
ALTER TABLE `AvaliacaoDado` RENAME COLUMN `numAmostra` TO `numeroAmostra`;
ALTER TABLE `AvaliacaoDado` RENAME COLUMN `obs` TO `observacoes`;
ALTER TABLE `AtividadeExperimento` RENAME COLUMN `obs` TO `observacoes`;
ALTER TABLE `EmailLog` RENAME COLUMN `refTipo` TO `referenciaTipo`;
ALTER TABLE `EmailLog` RENAME COLUMN `refId` TO `referenciaId`;
