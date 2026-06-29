-- DropForeignKey
ALTER TABLE `Usuario` DROP FOREIGN KEY `User_departamentoId_fkey`;

-- DropForeignKey
ALTER TABLE `Usuario` DROP FOREIGN KEY `User_instituicaoId_fkey`;

-- DropForeignKey
ALTER TABLE `Usuario` DROP FOREIGN KEY `User_unidadeId_fkey`;

-- CreateTable
CREATE TABLE `DominioValor` (
    `id` VARCHAR(191) NOT NULL,
    `dominio` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `rotulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `isAtivo` BOOLEAN NOT NULL DEFAULT true,

    INDEX `DominioValor_dominio_idx`(`dominio`),
    UNIQUE INDEX `DominioValor_dominio_codigo_key`(`dominio`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Instituicao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `Departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `AvaliacaoDado` RENAME INDEX `AvaliacaoDado_avaliacaoId_parcelaId_numAmostra_key` TO `AvaliacaoDado_avaliacaoId_parcelaId_numeroAmostra_key`;

-- RenameIndex
ALTER TABLE `Usuario` RENAME INDEX `User_email_key` TO `Usuario_email_key`;
