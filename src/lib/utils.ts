import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Normalize Indonesian WA number: 08xx → 628xx */
export function normalizeWANumber(number: string): string {
  let n = number.replace(/[\s\-\.\(\)]/g, "");
  if (n.startsWith("08")) n = "62" + n.slice(1);
  if (n.startsWith("+")) n = n.slice(1);
  return n;
}

/** Generate wa.me link */
export function generateWALink(number: string, message: string): string {
  return `https://wa.me/${normalizeWANumber(number)}?text=${encodeURIComponent(message)}`;
}

/** Format currency Rupiah */
export function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/** Format date Indonesian */
export function formatTanggal(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Format date short */
export function formatTanggalShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Status badge colors */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    menunggu: "bg-yellow-100 text-yellow-800 border-yellow-300",
    belum_bayar: "bg-yellow-100 text-yellow-800 border-yellow-300",
    draft: "bg-gray-100 text-gray-800 border-gray-300",
    dipanggil: "bg-blue-100 text-blue-800 border-blue-300",
    selesai: "bg-green-100 text-green-800 border-green-300",
    lunas: "bg-green-100 text-green-800 border-green-300",
    final: "bg-green-100 text-green-800 border-green-300",
    batal: "bg-red-100 text-red-800 border-red-300",
  };
  return map[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

/** Get role label in Indonesian */
export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    superadmin: "Super Admin",
    admin: "Admin",
    dokter: "Dokter",
    karyawan: "Karyawan",
  };
  return map[role] || role;
}

/** Get day label */
export function getHariLabel(hari: string): string {
  const map: Record<string, string> = {
    senin: "Senin",
    selasa: "Selasa",
    rabu: "Rabu",
    kamis: "Kamis",
    jumat: "Jumat",
    sabtu: "Sabtu",
  };
  return map[hari] || hari;
}

/** Get kunjungan label */
export function getKunjunganLabel(jenis: string): string {
  const map: Record<string, string> = {
    baru: "Baru",
    lama: "Lama",
    kontrol: "Kontrol",
  };
  return map[jenis] || jenis;
}

/** Get payment method label */
export function getMetodeBayarLabel(metode: string): string {
  const map: Record<string, string> = {
    tunai: "Tunai",
    transfer: "Transfer",
    qris: "QRIS",
    debit: "Debit",
  };
  return map[metode] || metode;
}
