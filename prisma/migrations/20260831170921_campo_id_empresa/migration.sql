/*
  Warnings:

  - Added the required column `idEmpresa` to the `Solicitacoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idadeMaxima` to the `Solicitacoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Solicitacoes" ADD COLUMN     "idEmpresa" TEXT NOT NULL,
ADD COLUMN     "idadeMaxima" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Solicitacoes" ADD CONSTRAINT "Solicitacoes_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
