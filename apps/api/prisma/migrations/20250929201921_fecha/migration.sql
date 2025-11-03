/*
  Warnings:

  - You are about to drop the column `fecha` on the `Reserva` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Reserva" DROP COLUMN "fecha",
ADD COLUMN     "dueDate" TIMESTAMP(3);
