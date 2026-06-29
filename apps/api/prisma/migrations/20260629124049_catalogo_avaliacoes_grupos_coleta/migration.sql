-- AlterTable
ALTER TABLE `Avaliacao` ADD COLUMN `descricaoColeta` TEXT NULL,
    ADD COLUMN `grupoColetaId` VARCHAR(191) NULL,
    ADD COLUMN `modeloId` VARCHAR(191) NULL,
    ADD COLUMN `numeroPontos` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `ModeloAvaliacao` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricaoColeta` TEXT NULL,
    `numeroPontos` INTEGER NOT NULL DEFAULT 1,
    `metodologiaRelatorio` TEXT NULL,
    `unidadeColeta` VARCHAR(191) NULL,
    `unidadeSaida` VARCHAR(191) NULL,
    `calculoRelatorio` VARCHAR(191) NULL,
    `escopo` ENUM('sistema', 'instituicao', 'departamento') NOT NULL DEFAULT 'sistema',
    `instituicaoId` VARCHAR(191) NULL,
    `departamentoId` VARCHAR(191) NULL,
    `baseadoEmId` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ModeloAvaliacao_escopo_idx`(`escopo`),
    INDEX `ModeloAvaliacao_instituicaoId_idx`(`instituicaoId`),
    INDEX `ModeloAvaliacao_departamentoId_idx`(`departamentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModeloAvaliacaoPrereq` (
    `modeloId` VARCHAR(191) NOT NULL,
    `prerequisitoId` VARCHAR(191) NOT NULL,

    INDEX `ModeloAvaliacaoPrereq_prerequisitoId_idx`(`prerequisitoId`),
    PRIMARY KEY (`modeloId`, `prerequisitoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GrupoColeta` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `escopo` ENUM('sistema', 'instituicao', 'departamento') NOT NULL DEFAULT 'instituicao',
    `instituicaoId` VARCHAR(191) NULL,
    `departamentoId` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GrupoColeta_instituicaoId_idx`(`instituicaoId`),
    INDEX `GrupoColeta_departamentoId_idx`(`departamentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GrupoColetaItem` (
    `id` VARCHAR(191) NOT NULL,
    `grupoId` VARCHAR(191) NOT NULL,
    `modeloId` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `GrupoColetaItem_grupoId_modeloId_key`(`grupoId`, `modeloId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Avaliacao_modeloId_idx` ON `Avaliacao`(`modeloId`);

-- CreateIndex
CREATE INDEX `Avaliacao_grupoColetaId_idx` ON `Avaliacao`(`grupoColetaId`);

-- AddForeignKey
ALTER TABLE `Avaliacao` ADD CONSTRAINT `Avaliacao_modeloId_fkey` FOREIGN KEY (`modeloId`) REFERENCES `ModeloAvaliacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Avaliacao` ADD CONSTRAINT `Avaliacao_grupoColetaId_fkey` FOREIGN KEY (`grupoColetaId`) REFERENCES `GrupoColeta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModeloAvaliacao` ADD CONSTRAINT `ModeloAvaliacao_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Instituicao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModeloAvaliacao` ADD CONSTRAINT `ModeloAvaliacao_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `Departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModeloAvaliacao` ADD CONSTRAINT `ModeloAvaliacao_baseadoEmId_fkey` FOREIGN KEY (`baseadoEmId`) REFERENCES `ModeloAvaliacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModeloAvaliacaoPrereq` ADD CONSTRAINT `ModeloAvaliacaoPrereq_modeloId_fkey` FOREIGN KEY (`modeloId`) REFERENCES `ModeloAvaliacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModeloAvaliacaoPrereq` ADD CONSTRAINT `ModeloAvaliacaoPrereq_prerequisitoId_fkey` FOREIGN KEY (`prerequisitoId`) REFERENCES `ModeloAvaliacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupoColeta` ADD CONSTRAINT `GrupoColeta_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Instituicao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupoColeta` ADD CONSTRAINT `GrupoColeta_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `Departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupoColetaItem` ADD CONSTRAINT `GrupoColetaItem_grupoId_fkey` FOREIGN KEY (`grupoId`) REFERENCES `GrupoColeta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupoColetaItem` ADD CONSTRAINT `GrupoColetaItem_modeloId_fkey` FOREIGN KEY (`modeloId`) REFERENCES `ModeloAvaliacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
