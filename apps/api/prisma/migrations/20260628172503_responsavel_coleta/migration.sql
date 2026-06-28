-- CreateTable
CREATE TABLE `ExperimentoResponsavel` (
    `id` VARCHAR(191) NOT NULL,
    `experimentoId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExperimentoResponsavel_userId_idx`(`userId`),
    UNIQUE INDEX `ExperimentoResponsavel_experimentoId_userId_key`(`experimentoId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ExperimentoResponsavel` ADD CONSTRAINT `ExperimentoResponsavel_experimentoId_fkey` FOREIGN KEY (`experimentoId`) REFERENCES `Experimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExperimentoResponsavel` ADD CONSTRAINT `ExperimentoResponsavel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
