export const EstadoValues = ['ACTIVA', 'CANCELADA', 'COMPLETADA'] as const;
export type Estado = (typeof EstadoValues)[number];