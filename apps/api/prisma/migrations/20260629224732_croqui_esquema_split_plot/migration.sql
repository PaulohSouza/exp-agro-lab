-- AlterTable
ALTER TABLE `Experimento` ADD COLUMN `esquema` ENUM('FATORIAL', 'PARCELA_SUBDIVIDIDA') NULL,
    ADD COLUMN `fatorPrincipalOrdem` INTEGER NULL;

-- AlterTable
ALTER TABLE `Parcela` ADD COLUMN `grupoPrincipal` INTEGER NULL,
    ADD COLUMN `nivelPrincipal` INTEGER NULL,
    ADD COLUMN `nivelSub` INTEGER NULL;
