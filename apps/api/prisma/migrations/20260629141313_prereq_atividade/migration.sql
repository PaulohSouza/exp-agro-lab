-- CreateTable
CREATE TABLE `ModeloAvaliacaoPrereqAtividade` (
    `modeloAvaliacaoId` VARCHAR(191) NOT NULL,
    `modeloAtividadeId` VARCHAR(191) NOT NULL,

    INDEX `ModeloAvaliacaoPrereqAtividade_modeloAtividadeId_idx`(`modeloAtividadeId`),
    PRIMARY KEY (`modeloAvaliacaoId`, `modeloAtividadeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ModeloAvaliacaoPrereqAtividade` ADD CONSTRAINT `ModeloAvaliacaoPrereqAtividade_modeloAvaliacaoId_fkey` FOREIGN KEY (`modeloAvaliacaoId`) REFERENCES `ModeloAvaliacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModeloAvaliacaoPrereqAtividade` ADD CONSTRAINT `ModeloAvaliacaoPrereqAtividade_modeloAtividadeId_fkey` FOREIGN KEY (`modeloAtividadeId`) REFERENCES `ModeloAtividade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
