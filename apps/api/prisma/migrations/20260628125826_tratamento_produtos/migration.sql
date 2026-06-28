-- CreateTable
CREATE TABLE `Produto` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `marca` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Atividade` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `valorVenda` DOUBLE NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Timing` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TratamentoProduto` (
    `id` VARCHAR(191) NOT NULL,
    `tratamentoId` VARCHAR(191) NOT NULL,
    `seq` INTEGER NOT NULL DEFAULT 1,
    `produtoId` VARCHAR(191) NOT NULL,
    `modoAplicacao` VARCHAR(191) NULL,
    `dose` DOUBLE NULL,
    `unidadeDose` VARCHAR(191) NULL,
    `volumeCaldaLha` DOUBLE NULL,
    `referencia` VARCHAR(191) NULL,
    `timingId` VARCHAR(191) NULL,
    `atividadeId` VARCHAR(191) NULL,
    `descricao` TEXT NULL,

    INDEX `TratamentoProduto_tratamentoId_idx`(`tratamentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Timing` ADD CONSTRAINT `Timing_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TratamentoProduto` ADD CONSTRAINT `TratamentoProduto_tratamentoId_fkey` FOREIGN KEY (`tratamentoId`) REFERENCES `Tratamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TratamentoProduto` ADD CONSTRAINT `TratamentoProduto_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TratamentoProduto` ADD CONSTRAINT `TratamentoProduto_timingId_fkey` FOREIGN KEY (`timingId`) REFERENCES `Timing`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TratamentoProduto` ADD CONSTRAINT `TratamentoProduto_atividadeId_fkey` FOREIGN KEY (`atividadeId`) REFERENCES `Atividade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
