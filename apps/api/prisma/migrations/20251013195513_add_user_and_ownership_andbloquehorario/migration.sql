/*
  Warnings:

  - You are about to drop the column `descripcion` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `nombreUsuario` on the `Reserva` table. All the data in the column will be lost.
  - Added the required column `bloqueId` to the `Reserva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Reserva` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "public"."Reserva" DROP COLUMN "descripcion",
DROP COLUMN "nombreUsuario",
ADD COLUMN     "bloqueId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passworddHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BloqueHorario" (
    "id" TEXT NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFin" TIMESTAMP(3) NOT NULL,
    "cuposTotales" INTEGER NOT NULL,
    "cuposOcupados" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BloqueHorario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BloqueHorario_horaInicio_horaFin_key" ON "public"."BloqueHorario"("horaInicio", "horaFin");

-- CreateIndex
CREATE INDEX "Reserva_bloqueId_idx" ON "public"."Reserva"("bloqueId");

-- CreateIndex
CREATE INDEX "Reserva_userId_idx" ON "public"."Reserva"("userId");

-- AddForeignKey
ALTER TABLE "public"."Reserva" ADD CONSTRAINT "Reserva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reserva" ADD CONSTRAINT "Reserva_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "public"."BloqueHorario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
