/*
  Warnings:

  - You are about to drop the `horarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reservas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuarios` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."reservas" DROP CONSTRAINT "reservas_horarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reservas" DROP CONSTRAINT "reservas_usuarioId_fkey";

-- DropTable
DROP TABLE "public"."horarios";

-- DropTable
DROP TABLE "public"."reservas";

-- DropTable
DROP TABLE "public"."usuarios";

-- DropEnum
DROP TYPE "public"."DiaSemana";

-- DropEnum
DROP TYPE "public"."RolUsuario";

-- CreateTable
CREATE TABLE "public"."Reserva" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3),
    "nombreUsuario" TEXT NOT NULL,
    "estado" "public"."EstadoReserva" NOT NULL DEFAULT 'ACTIVA',
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);
