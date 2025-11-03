/*
  Warnings:

  - Added the required column `nombreUsuario` to the `Reserva` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Reserva" DROP CONSTRAINT "Reserva_bloqueId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reserva" DROP CONSTRAINT "Reserva_userId_fkey";

-- DropIndex
DROP INDEX "public"."Reserva_bloqueId_idx";

-- DropIndex
DROP INDEX "public"."Reserva_userId_idx";

-- AlterTable
ALTER TABLE "public"."Reserva" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "nombreUsuario" TEXT NOT NULL,
ALTER COLUMN "estado" DROP DEFAULT,
ALTER COLUMN "bloqueId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Reserva" ADD CONSTRAINT "Reserva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reserva" ADD CONSTRAINT "Reserva_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "public"."BloqueHorario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
