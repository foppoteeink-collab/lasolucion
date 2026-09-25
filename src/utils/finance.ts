export interface CurrencyOption {
  symbol: string;
  code: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { symbol: '$', code: 'USD', name: 'Dólar ($)' },
  { symbol: '€', code: 'EUR', name: 'Euro (€)' },
  { symbol: '₡', code: 'CRC', name: 'Colón (₡)' },
  { symbol: 'MXN $', code: 'MXN', name: 'Peso Mexicano (MXN $)' },
  { symbol: 'COP $', code: 'COP', name: 'Peso Colombiano (COP $)' },
  { symbol: 'CLP $', code: 'CLP', name: 'Peso Chileno (CLP $)' },
  { symbol: 'S/', code: 'PEN', name: 'Sol Peruano (S/)' },
  { symbol: 'R$', code: 'BRL', name: 'Real (R$)' },
  { symbol: '£', code: 'GBP', name: 'Libra (£)' },
];

export const FINANCE_INCOME_CATEGORIES = [
  'Trabajo / Clientes',
  'Ventas',
  'Nómina / Salario',
  'Inversiones / Rendimiento',
  'Otros Ingresos'
];

export const FINANCE_EXPENSE_CATEGORIES = [
  'Alimentación / Comida',
  'Vivienda / Servicios',
  'Inversión / Herramientas',
  'Operaciones / Transporte',
  'Salud / Bienestar',
  'Ocio / Personal',
  'Otros Gastos'
];

const CURRENCY_KEY = 'taskquest_currency_symbol';
const SAVINGS_TARGET_KEY = 'taskquest_savings_target';

export function getSavedSavingsTarget(): number {
  try {
    const val = localStorage.getItem(SAVINGS_TARGET_KEY);
    return val ? Number(val) : 20;
  } catch {
    return 20;
  }
}

export function setSavedSavingsTarget(percent: number): void {
  try {
    localStorage.setItem(SAVINGS_TARGET_KEY, String(percent));
    window.dispatchEvent(new CustomEvent('taskquest:savings-target-change', { detail: percent }));
  } catch {
    // Ignore storage errors
  }
}

export function getSavedCurrencySymbol(): string {
  try {
    return localStorage.getItem(CURRENCY_KEY) || '$';
  } catch {
    return '$';
  }
}

export function setSavedCurrencySymbol(symbol: string): void {
  try {
    localStorage.setItem(CURRENCY_KEY, symbol);
    window.dispatchEvent(new CustomEvent('taskquest:currency-change', { detail: symbol }));
  } catch {
    // Ignore storage errors
  }
}

export function formatMoney(amount: number, symbol: string = '$'): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('es-ES', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}
