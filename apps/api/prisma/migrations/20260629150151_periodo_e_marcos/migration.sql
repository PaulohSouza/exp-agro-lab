-- AlterTable
ALTER TABLE `AtividadeExperimento` ADD COLUMN `confirmada` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `dataPrevista` DATETIME(3) NULL,
    ADD COLUMN `marco` ENUM('implantacao', 'inicio', 'fim', 'semeadura', 'colheita') NULL;

-- AlterTable
ALTER TABLE `Categoria` ADD COLUMN `eCultura` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Experimento` ADD COLUMN `anoSemestre` VARCHAR(191) NULL,
    ADD COLUMN `tipoPeriodo` ENUM('safra', 'ano_semestre') NOT NULL DEFAULT 'safra';
