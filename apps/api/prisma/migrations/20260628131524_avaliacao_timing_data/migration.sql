-- AlterTable
ALTER TABLE `Avaliacao` ADD COLUMN `dataPrevista` DATETIME(3) NULL,
    ADD COLUMN `escala` VARCHAR(191) NULL,
    ADD COLUMN `timingId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Avaliacao` ADD CONSTRAINT `Avaliacao_timingId_fkey` FOREIGN KEY (`timingId`) REFERENCES `Timing`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
