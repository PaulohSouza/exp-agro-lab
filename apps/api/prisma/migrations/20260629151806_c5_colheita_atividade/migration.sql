/*
  Warnings:

  - You are about to drop the column `areaUtilM2` on the `AvaliacaoDado` table. All the data in the column will be lost.
  - You are about to drop the column `comprimentoColhidoM` on the `AvaliacaoDado` table. All the data in the column will be lost.
  - You are about to drop the column `numLinhasColhidas` on the `AvaliacaoDado` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `AvaliacaoDado` DROP COLUMN `areaUtilM2`,
    DROP COLUMN `comprimentoColhidoM`,
    DROP COLUMN `numLinhasColhidas`;

-- AlterTable
ALTER TABLE `ModeloAtividade` ADD COLUMN `fornecAreaColheita` BOOLEAN NOT NULL DEFAULT false;
