-- AlterTable
ALTER TABLE `Unidade` ADD COLUMN `departamentoId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `departamentoId` VARCHAR(191) NULL,
    ADD COLUMN `papel` ENUM('admin_sistema', 'gestao_instituicao', 'gestao_departamento', 'coordenador_area', 'pesquisador', 'analista', 'assistente') NOT NULL DEFAULT 'analista';

-- CreateTable
CREATE TABLE `Departamento` (
    `id` VARCHAR(191) NOT NULL,
    `instituicaoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Departamento_instituicaoId_idx`(`instituicaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Departamento` ADD CONSTRAINT `Departamento_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Instituicao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Unidade` ADD CONSTRAINT `Unidade_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `Departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `Departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
