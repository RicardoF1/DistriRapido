const warnings: Record<string, string> = {
  VENTANA_INCUMPLIDA: 'Ventana de entrega incumplida',
  CAPACIDAD_PESO: 'Excede la capacidad de peso',
  CAPACIDAD_VOLUMEN: 'Excede la capacidad de volumen',
  VOLUMEN_NO_EVALUABLE: 'Volumen no evaluable',
  JORNADA_EXCEDIDA: 'Jornada excedida',
  SIN_DISPONIBILIDAD_COMPLETA: 'Sin disponibilidad completa',
  PEDIDO_DESACTUALIZADO: 'Pedido desactualizado',
};
export const warningLabel = (code: string) => warnings[code] ?? code;
