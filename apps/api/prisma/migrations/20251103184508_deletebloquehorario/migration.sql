/*
  Warnings:

  - You are about to drop the column `bloqueId` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the `BloqueHorario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Reserva" DROP CONSTRAINT "Reserva_bloqueId_fkey";

-- AlterTable
ALTER TABLE "public"."Reserva" DROP COLUMN "bloqueId",
ADD COLUMN     "dueDate" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."BloqueHorario";
