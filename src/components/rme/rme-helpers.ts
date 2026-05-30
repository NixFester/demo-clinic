// ─── Shared helpers, types & constants for RME pages ────────────────────────

export const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(v);

const STATUS_CLASS: Record<string, string> = {
  menunggu:  'bg-yellow-100 text-yellow-800 border-yellow-300',
  dipanggil: 'bg-blue-100   text-blue-800   border-blue-300',
  selesai:   'bg-green-100  text-green-800  border-green-300',
  batal:     'bg-red-100    text-red-800    border-red-300',
  draft:     'bg-gray-100   text-gray-800   border-gray-300',
  final:     'bg-green-100  text-green-800  border-green-300',
};

const STATUS_LABEL: Record<string, string> = {
  menunggu:  'Menunggu',
  dipanggil: 'Dipanggil',
  selesai:   'Selesai',
  batal:     'Batal',
  draft:     'Draft',
  final:     'Final',
};

export const statusBadgeClass  = (s: string) => STATUS_CLASS[s]  ?? 'bg-gray-100 text-gray-800 border-gray-300';
export const statusLabel       = (s: string) => STATUS_LABEL[s]  ?? s;

// ─── Shared data types ───────────────────────────────────────────────────────

export interface SoapFields {
  subjektif: string;
  objektif: string;
  assesment: string;
  plan: string;
  kondisi_masuk: string;
  kondisi_keluar: string;
  instruksi_tindak_lanjut: string;
}

export const SOAP_EMPTY: SoapFields = {
  subjektif: '', objektif: '', assesment: '', plan: '',
  kondisi_masuk: '', kondisi_keluar: '', instruksi_tindak_lanjut: '',
};
