/**
 * Calculadora de Créditos
 * Implementa diferentes sistemas de amortización
 */

export interface CuotaCalculada {
  numeroCuota: number;
  fechaVencimiento: Date;
  montoCuota: number;
  capital: number;
  interes: number;
  balanceInicial: number;
  balanceFinal: number;
}

/**
 * Calcula las cuotas usando el sistema Francés (cuota fija)
 */
export function calcularSistemaFrances(
  monto: number,
  tasaInteresAnual: number,
  plazoMeses: number,
  fechaInicio: Date
): CuotaCalculada[] {
  const tasaMensual = tasaInteresAnual / 100 / 12;
  const cuotaMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / 
                       (Math.pow(1 + tasaMensual, plazoMeses) - 1);
  
  const cuotas: CuotaCalculada[] = [];
  let balance = monto;
  
  for (let i = 1; i <= plazoMeses; i++) {
    const interes = balance * tasaMensual;
    const capital = cuotaMensual - interes;
    const balanceInicial = balance;
    balance = balance - capital;
    
    const fechaVencimiento = new Date(fechaInicio);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
    
    cuotas.push({
      numeroCuota: i,
      fechaVencimiento,
      montoCuota: cuotaMensual,
      capital,
      interes,
      balanceInicial,
      balanceFinal: balance,
    });
  }
  
  return cuotas;
}

/**
 * Calcula las cuotas usando el sistema Alemán (capital fijo)
 */
export function calcularSistemaAleman(
  monto: number,
  tasaInteresAnual: number,
  plazoMeses: number,
  fechaInicio: Date
): CuotaCalculada[] {
  const tasaMensual = tasaInteresAnual / 100 / 12;
  const capitalFijo = monto / plazoMeses;
  
  const cuotas: CuotaCalculada[] = [];
  let balance = monto;
  
  for (let i = 1; i <= plazoMeses; i++) {
    const interes = balance * tasaMensual;
    const capital = capitalFijo;
    const montoCuota = capital + interes;
    const balanceInicial = balance;
    balance = balance - capital;
    
    const fechaVencimiento = new Date(fechaInicio);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
    
    cuotas.push({
      numeroCuota: i,
      fechaVencimiento,
      montoCuota,
      capital,
      interes,
      balanceInicial,
      balanceFinal: balance,
    });
  }
  
  return cuotas;
}

/**
 * Calcula las cuotas usando el sistema Americano (solo intereses, capital al final)
 */
export function calcularSistemaAmericano(
  monto: number,
  tasaInteresAnual: number,
  plazoMeses: number,
  fechaInicio: Date
): CuotaCalculada[] {
  const tasaMensual = tasaInteresAnual / 100 / 12;
  const interesMensual = monto * tasaMensual;
  
  const cuotas: CuotaCalculada[] = [];
  
  for (let i = 1; i <= plazoMeses; i++) {
    const fechaVencimiento = new Date(fechaInicio);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
    
    // Todas las cuotas son solo intereses excepto la última
    const esUltimaCuota = i === plazoMeses;
    const capital = esUltimaCuota ? monto : 0;
    const interes = interesMensual;
    const montoCuota = capital + interes;
    
    cuotas.push({
      numeroCuota: i,
      fechaVencimiento,
      montoCuota,
      capital,
      interes,
      balanceInicial: monto,
      balanceFinal: esUltimaCuota ? 0 : monto,
    });
  }
  
  return cuotas;
}

/**
 * Calcula las cuotas según el tipo de sistema seleccionado
 */
export function calcularCuotas(
  monto: number,
  tasaInteresAnual: number,
  plazoMeses: number,
  fechaInicio: Date,
  tipoCalculo: string
): CuotaCalculada[] {
  switch (tipoCalculo.toLowerCase()) {
    case 'frances':
      return calcularSistemaFrances(monto, tasaInteresAnual, plazoMeses, fechaInicio);
    case 'aleman':
      return calcularSistemaAleman(monto, tasaInteresAnual, plazoMeses, fechaInicio);
    case 'americano':
      return calcularSistemaAmericano(monto, tasaInteresAnual, plazoMeses, fechaInicio);
    default:
      return calcularSistemaFrances(monto, tasaInteresAnual, plazoMeses, fechaInicio);
  }
}

/**
 * Calcula el total de intereses a pagar
 */
export function calcularTotalIntereses(cuotas: CuotaCalculada[]): number {
  return cuotas.reduce((total, cuota) => total + cuota.interes, 0);
}

/**
 * Calcula el total a pagar (capital + intereses)
 */
export function calcularTotalPagar(cuotas: CuotaCalculada[]): number {
  return cuotas.reduce((total, cuota) => total + cuota.montoCuota, 0);
}
