-- CreateEnum
CREATE TYPE "public"."RolUsuario" AS ENUM ('ESTUDIANTE', 'FUNCIONARIO', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "public"."EstadoReserva" AS ENUM ('ACTIVA', 'CANCELADA', 'COMPLETADA');

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "public"."RolUsuario" NOT NULL DEFAULT 'ESTUDIANTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."horarios" (
    "id" TEXT NOT NULL,
    "diaSemana" "public"."DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "capacidadMaxima" INTEGER NOT NULL DEFAULT 30,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservas" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "estado" "public"."EstadoReserva" NOT NULL DEFAULT 'ACTIVA',
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_rut_key" ON "public"."usuarios"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_diaSemana_horaInicio_key" ON "public"."horarios"("diaSemana", "horaInicio");

-- CreateIndex
CREATE INDEX "reservas_fecha_idx" ON "public"."reservas"("fecha");

-- CreateIndex
CREATE INDEX "reservas_usuarioId_idx" ON "public"."reservas"("usuarioId");

-- CreateIndex
CREATE INDEX "reservas_horarioId_idx" ON "public"."reservas"("horarioId");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_usuarioId_fecha_horarioId_key" ON "public"."reservas"("usuarioId", "fecha", "horarioId");

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "public"."horarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
