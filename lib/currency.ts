// Mapeo de códigos de moneda a sus configuraciones
export const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string; code: string }> = {
  EUR: { symbol: '€', locale: 'es-ES', code: 'EUR' },
  USD: { symbol: '$', locale: 'en-US', code: 'USD' },
  GBP: { symbol: '£', locale: 'en-GB', code: 'GBP' },
  JPY: { symbol: '¥', locale: 'ja-JP', code: 'JPY' },
  CLP: { symbol: '$', locale: 'es-CL', code: 'CLP' },
  ARS: { symbol: '$', locale: 'es-AR', code: 'ARS' },
  MXN: { symbol: '$', locale: 'es-MX', code: 'MXN' },
  COP: { symbol: '$', locale: 'es-CO', code: 'COP' },
};

/**
 * Formatea un número como moneda basándose en el código de moneda de la empresa
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options: { decimals?: number; includeSymbol?: boolean } = {}
): string {
  const { decimals = 2, includeSymbol = true } = options;
  
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.USD;
  
  try {
    const formatted = new Intl.NumberFormat(config.locale, {
      style: includeSymbol ? 'currency' : 'decimal',
      currency: config.code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
    
    return formatted;
  } catch (error) {
    // Fallback si hay error en el formato
    return includeSymbol 
      ? `${config.symbol}${amount.toFixed(decimals)}`
      : amount.toFixed(decimals);
  }
}

/**
 * Obtiene el símbolo de moneda
 */
export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  return CURRENCY_CONFIG[currencyCode]?.symbol || '$';
}
