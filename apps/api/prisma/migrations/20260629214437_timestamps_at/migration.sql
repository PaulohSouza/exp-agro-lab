-- Padrão de desenvolvimento (§4.6): timestamps técnicos com sufixo At.
ALTER TABLE `AprovacaoOSInterna` RENAME COLUMN `at` TO `decididoAt`;
ALTER TABLE `AprovacaoCliente` RENAME COLUMN `decididoEm` TO `decididoAt`;
ALTER TABLE `StatusHistorico` RENAME COLUMN `at` TO `createdAt`;
