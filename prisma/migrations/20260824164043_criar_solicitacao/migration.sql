/*
  Warnings:

  - Made the column `cursos` on table `Solicitacoes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Solicitacoes" ALTER COLUMN "cursos" SET NOT NULL;
