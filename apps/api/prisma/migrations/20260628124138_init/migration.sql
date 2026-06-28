-- CreateTable
CREATE TABLE `Instituicao` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NULL,
    `politicaAprovacao` ENUM('todos', 'n_de_m') NOT NULL DEFAULT 'todos',
    `nAprovadores` INTEGER NOT NULL DEFAULT 1,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Unidade` (
    `id` VARCHAR(191) NOT NULL,
    `instituicaoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('unidade', 'laboratorio') NOT NULL DEFAULT 'unidade',
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `instituicaoId` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `isAdminInstituicao` BOOLEAN NOT NULL DEFAULT false,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categoria` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subcategoria` (
    `id` VARCHAR(191) NOT NULL,
    `categoriaId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObjetoEstudo` (
    `id` VARCHAR(191) NOT NULL,
    `subcategoriaId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `obs` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Local` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Safra` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AreaPesquisa` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Delineamento` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Experimento` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `objetivo` TEXT NULL,
    `ensaio` ENUM('interno', 'comercial') NOT NULL DEFAULT 'interno',
    `status` ENUM('Inserindo', 'AprovadoCAD', 'RecusadoCAD', 'EmConducao', 'Concluido') NOT NULL DEFAULT 'Inserindo',
    `instituicaoId` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `objetoEstudoId` VARCHAR(191) NULL,
    `localId` VARCHAR(191) NULL,
    `safraId` VARCHAR(191) NULL,
    `areaPesquisaId` VARCHAR(191) NULL,
    `delineamentoId` VARCHAR(191) NULL,
    `cultivar` VARCHAR(191) NULL,
    `tipoExecucao` VARCHAR(191) NULL,
    `metodologia` TEXT NULL,
    `justificativa` TEXT NULL,
    `observacoes` TEXT NULL,
    `parcelaLarguraM` DOUBLE NULL,
    `parcelaComprimentoM` DOUBLE NULL,
    `parcelaNumLinhas` INTEGER NULL,
    `espacamentoLinhasM` DOUBLE NULL,
    `numRepeticoes` INTEGER NULL,
    `numTratamentos` INTEGER NULL,
    `totalParcelas` INTEGER NULL,
    `previsaoSemeadura` DATETIME(3) NULL,
    `dataSemeadura` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Experimento_instituicaoId_idx`(`instituicaoId`),
    INDEX `Experimento_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Fator` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('qualitativo', 'quantitativo') NOT NULL DEFAULT 'qualitativo',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NivelFator` (
    `id` VARCHAR(191) NOT NULL,
    `fatorId` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `rotulo` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tratamento` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `numeroRef` INTEGER NOT NULL,
    `tag` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NULL,
    `descricao` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Parcela` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `tratamentoId` VARCHAR(191) NOT NULL,
    `bloco` INTEGER NOT NULL,
    `numero` INTEGER NOT NULL,
    `posLinha` INTEGER NOT NULL,
    `posColuna` INTEGER NOT NULL,
    `isInicio` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Parcela_experimentoId_idx`(`experimentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Avaliacao` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `metodologia` TEXT NULL,
    `unidadeColeta` VARCHAR(191) NULL,
    `unidadeSaida` VARCHAR(191) NULL,
    `formula` VARCHAR(191) NULL,
    `tipo` ENUM('calendarizada', 'condicional') NOT NULL DEFAULT 'calendarizada',
    `personalizada` BOOLEAN NOT NULL DEFAULT false,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AvaliacaoDado` (
    `id` VARCHAR(191) NOT NULL,
    `avaliacaoId` VARCHAR(191) NOT NULL,
    `parcelaId` VARCHAR(191) NOT NULL,
    `numAmostra` INTEGER NOT NULL DEFAULT 1,
    `valorColetado` DOUBLE NULL,
    `numLinhasColhidas` INTEGER NULL,
    `comprimentoColhidoM` DOUBLE NULL,
    `areaUtilM2` DOUBLE NULL,
    `obs` TEXT NULL,
    `status` VARCHAR(191) NULL,
    `fotoUrl` VARCHAR(191) NULL,
    `origem` ENUM('web', 'mobile') NOT NULL DEFAULT 'web',
    `dispositivoId` VARCHAR(191) NULL,
    `syncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `AvaliacaoDado_avaliacaoId_parcelaId_numAmostra_key`(`avaliacaoId`, `parcelaId`, `numAmostra`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExperimentoCompartilhamento` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `convidadoEmail` VARCHAR(191) NULL,
    `nivel` ENUM('input', 'edit') NOT NULL DEFAULT 'input',
    `aceito` BOOLEAN NOT NULL DEFAULT false,
    `token` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ExperimentoCompartilhamento_token_key`(`token`),
    INDEX `ExperimentoCompartilhamento_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrdemServico` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `status` ENUM('rascunho', 'aguardando_aprovacao_interna', 'aguardando_aprovacao_cliente', 'aprovada', 'recusada') NOT NULL DEFAULT 'rascunho',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AprovadorInstituicao` (
    `id` VARCHAR(191) NOT NULL,
    `instituicaoId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `AprovadorInstituicao_instituicaoId_userId_key`(`instituicaoId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AprovacaoOSInterna` (
    `id` VARCHAR(191) NOT NULL,
    `ordemServicoId` VARCHAR(191) NOT NULL,
    `aprovadorUserId` VARCHAR(191) NOT NULL,
    `decisao` ENUM('pendente', 'aprovado', 'recusado') NOT NULL,
    `motivo` VARCHAR(191) NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AprovacaoCliente` (
    `id` VARCHAR(191) NOT NULL,
    `ordemServicoId` VARCHAR(191) NOT NULL,
    `clienteEmail` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `decisao` ENUM('pendente', 'aprovado', 'recusado') NOT NULL DEFAULT 'pendente',
    `motivo` VARCHAR(191) NULL,
    `decididoEm` DATETIME(3) NULL,
    `ip` VARCHAR(191) NULL,

    UNIQUE INDEX `AprovacaoCliente_ordemServicoId_key`(`ordemServicoId`),
    UNIQUE INDEX `AprovacaoCliente_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailLog` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `para` VARCHAR(191) NOT NULL,
    `assunto` VARCHAR(191) NOT NULL,
    `htmlPath` VARCHAR(191) NULL,
    `status` ENUM('simulado', 'enviado', 'erro') NOT NULL DEFAULT 'simulado',
    `erro` TEXT NULL,
    `refTipo` VARCHAR(191) NULL,
    `refId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StatusHistorico` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `de` VARCHAR(191) NULL,
    `para` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Unidade` ADD CONSTRAINT `Unidade_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Instituicao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Instituicao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subcategoria` ADD CONSTRAINT `Subcategoria_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `Categoria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObjetoEstudo` ADD CONSTRAINT `ObjetoEstudo_subcategoriaId_fkey` FOREIGN KEY (`subcategoriaId`) REFERENCES `Subcategoria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Experimento` ADD CONSTRAINT `Experimento_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Instituicao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Experimento` ADD CONSTRAINT `Experimento_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Experimento` ADD CONSTRAINT `Experimento_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Experimento` ADD CONSTRAINT `Experimento_objetoEstudoId_fkey` FOREIGN KEY (`objetoEstudoId`) REFERENCES `ObjetoEstudo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Experimento` ADD CONSTRAINT `Experimento_localId_fkey` FOREIGN KEY (`localId`) REFERENCES `Local`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Experimento` ADD CONSTRAINT `Experimento_safraId_fkey` FOREIGN KEY (`safraId`) REFERENCES `Safra`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Experimento` ADD CONSTRAINT `Experimento_areaPesquisaId_fkey` FOREIGN KEY (`areaPesquisaId`) REFERENCES `AreaPesquisa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Experimento` ADD CONSTRAINT `Experimento_delineamentoId_fkey` FOREIGN KEY (`delineamentoId`) REFERENCES `Delineamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fator` ADD CONSTRAINT `Fator_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NivelFator` ADD CONSTRAINT `NivelFator_fatorId_fkey` FOREIGN KEY (`fatorId`) REFERENCES `Fator`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tratamento` ADD CONSTRAINT `Tratamento_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Parcela` ADD CONSTRAINT `Parcela_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Parcela` ADD CONSTRAINT `Parcela_tratamentoId_fkey` FOREIGN KEY (`tratamentoId`) REFERENCES `Tratamento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Avaliacao` ADD CONSTRAINT `Avaliacao_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvaliacaoDado` ADD CONSTRAINT `AvaliacaoDado_avaliacaoId_fkey` FOREIGN KEY (`avaliacaoId`) REFERENCES `Avaliacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvaliacaoDado` ADD CONSTRAINT `AvaliacaoDado_parcelaId_fkey` FOREIGN KEY (`parcelaId`) REFERENCES `Parcela`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExperimentoCompartilhamento` ADD CONSTRAINT `ExperimentoCompartilhamento_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExperimentoCompartilhamento` ADD CONSTRAINT `ExperimentoCompartilhamento_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdemServico` ADD CONSTRAINT `OrdemServico_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AprovadorInstituicao` ADD CONSTRAINT `AprovadorInstituicao_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Instituicao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AprovadorInstituicao` ADD CONSTRAINT `AprovadorInstituicao_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AprovacaoOSInterna` ADD CONSTRAINT `AprovacaoOSInterna_ordemServicoId_fkey` FOREIGN KEY (`ordemServicoId`) REFERENCES `OrdemServico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AprovacaoCliente` ADD CONSTRAINT `AprovacaoCliente_ordemServicoId_fkey` FOREIGN KEY (`ordemServicoId`) REFERENCES `OrdemServico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StatusHistorico` ADD CONSTRAINT `StatusHistorico_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
