export function normalizeWANumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  // Convert 08xx to 628xx
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.substring(1);
  }
  // Convert +62 to 62
  if (cleaned.startsWith('+62')) {
    cleaned = '62' + cleaned.substring(3);
  }
  return cleaned;
}

export function generateWALink(phone: string, message?: string): string {
  const normalized = normalizeWANumber(phone);
  const base = `https://wa.me/${normalized}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function getIndonesianDay(dayName: string): string {
  const map: Record<string, string> = {
    Monday: 'senin',
    Tuesday: 'selasa',
    Wednesday: 'rabu',
    Thursday: 'kamis',
    Friday: 'jumat',
    Saturday: 'sabtu',
    Sunday: 'minggu',
  };
  return map[dayName] || dayName.toLowerCase();
}

export type UserRole = 'superadmin' | 'admin' | 'dokter' | 'karyawan' | 'kasir';

export function canAccessRoute(role: UserRole, route: string): boolean {
  if (role === 'superadmin') return true;

  if (route.startsWith('/admin')) {
    return role === 'admin';
  }
  if (route.startsWith('/dokter')) {
    return role === 'dokter';
  }
  if (route.startsWith('/karyawan')) {
    return role === 'karyawan';
  }
  if (route.startsWith('/kasir')) {
    return role === 'kasir';
  }
  return false;
}

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return '/admin/dashboard';
    case 'dokter':
      return '/dokter/dashboard';
    case 'karyawan':
      return '/karyawan/dashboard';
    case 'kasir':
      return '/kasir/dashboard';
    default:
      return '/login';
  }
}
