-- CreateTable
CREATE TABLE `ModeloAtividade` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `tipo` ENUM('acao', 'apontamento') NOT NULL DEFAULT 'acao',
    `metodologiaRelatorio` TEXT NULL,
    `escopo` ENUM('sistema', 'instituicao', 'departamento') NOT NULL DEFAULT 'sistema',
    `instituicaoId` VARCHAR(191) NULL,
    `departamentoId` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ModeloAtividade_escopo_idx`(`escopo`),
    INDEX `ModeloAtividade_instituicaoId_idx`(`instituicaoId`),
    INDEX `ModeloAtividade_departamentoId_idx`(`departamentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModeloAtividadeCampo` (
    `id` VARCHAR(191) NOT NULL,
    `modeloId` VARCHAR(191) NOT NULL,
    `rotulo` VARCHAR(191) NOT NULL,
    `tipo` ENUM('numero', 'texto', 'data', 'booleano') NOT NULL DEFAULT 'numero',
    `unidade` VARCHAR(191) NULL,
    `obrigatorio` BOOLEAN NOT NULL DEFAULT false,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    INDEX `ModeloAtividadeCampo_modeloId_idx`(`modeloId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeExperimento` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `modeloId` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('acao', 'apontamento') NOT NULL DEFAULT 'acao',
    `data` DATETIME(3) NULL,
    `responsavel` VARCHAR(191) NULL,
    `obs` TEXT NULL,
    `status` VARCHAR(191) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AtividadeExperimento_experimentoId_idx`(`experimentoId`),
    INDEX `AtividadeExperimento_modeloId_idx`(`modeloId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtividadeApontamentoValor` (
    `id` VARCHAR(191) NOT NULL,
    `atividadeId` VARCHAR(191) NOT NULL,
    `campoId` VARCHAR(191) NULL,
    `rotulo` VARCHAR(191) NOT NULL,
    `valorNum` DOUBLE NULL,
    `valorTexto` VARCHAR(191) NULL,
    `valorData` DATETIME(3) NULL,
    `valorBool` BOOLEAN NULL,

    INDEX `AtividadeApontamentoValor_atividadeId_idx`(`atividadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ModeloAtividade` ADD CONSTRAINT `ModeloAtividade_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Instituicao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModeloAtividade` ADD CONSTRAINT `ModeloAtividade_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `Departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModeloAtividadeCampo` ADD CONSTRAINT `ModeloAtividadeCampo_modeloId_fkey` FOREIGN KEY (`modeloId`) REFERENCES `ModeloAtividade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeExperimento` ADD CONSTRAINT `AtividadeExperimento_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeExperimento` ADD CONSTRAINT `AtividadeExperimento_modeloId_fkey` FOREIGN KEY (`modeloId`) REFERENCES `ModeloAtividade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeApontamentoValor` ADD CONSTRAINT `AtividadeApontamentoValor_atividadeId_fkey` FOREIGN KEY (`atividadeId`) REFERENCES `AtividadeExperimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
