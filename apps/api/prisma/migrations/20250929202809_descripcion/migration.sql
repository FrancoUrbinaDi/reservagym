/*
  Warnings:

  - You are about to drop the column `observacion` on the `Reserva` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Reserva" DROP COLUMN "observacion",
ADD COLUMN     "descripcion" TEXT;
