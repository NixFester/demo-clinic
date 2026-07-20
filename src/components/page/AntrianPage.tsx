"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Phone,
  PhoneCall,
  XCircle,
  FileText,
  RefreshCw,
  Loader2,
  ClipboardList,
  Plus,
  Package,
  UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { AntrianItem } from "@/types/api-items";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  menunggu: "bg-yellow-100 text-yellow-800 border-yellow-300",
  dipanggil: "bg-blue-100   text-blue-800   border-blue-300",
  selesai: "bg-green-100  text-green-800  border-green-300",
  batal: "bg-red-100    text-red-800    border-red-300",
  draft: "bg-gray-100   text-gray-800   border-gray-300",
  final: "bg-green-100  text-green-800  border-green-300",
  paket: "bg-purple-100 text-purple-800 border-purple-300",
};

const STATUS_LABEL: Record<string, string> = {
  menunggu: "Menunggu",
  dipanggil: "Dipanggil",
  selesai: "Selesai",
  batal: "Batal",
  draft: "Draft",
  final: "Final",
  paket: "Paket",
};

function StatusChip({ status, isPaket }: { status: string, isPaket?: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        STATUS_STYLE[status] ?? "bg-gray-100 text-gray-800 border-gray-300"
      }
    >
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function isAdmin(role: string) {
  return role === "admin" || role === "superadmin";
}
function isStaff(role: string) {
  return role === "karyawan" || isAdmin(role);
}
function isDokter(role: string) {
  return role === "dokter";
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AntrianPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { data: session } = useSession();
  const role: string =
    (session?.user as unknown as { role?: string })?.role ?? "";

  const [data, setData] = useState<AntrianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Siapkan Obat Dialog ─────────────────────────────────────────────────
  const [obatDialogOpen, setObatDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AntrianItem | null>(null);
  const [resepList, setResepList] = useState<Record<string, unknown>[]>([]);
  const [loadingResep, setLoadingResep] = useState(false);

  const openSiapkanObat = async (item: AntrianItem) => {
    setSelectedItem(item);
    setObatDialogOpen(true);
    setLoadingResep(true);
    setResepList([]);

    if (item.id_rme) {
      try {
        const res = await fetch(`/api/rme/${item.id_rme}/resep`);
        const result = await res.json();
        // Handle both array response and wrapped response
        const data = Array.isArray(result) ? result : result.data;
        if (data && data.length > 0) {
          setResepList(data);
        }
      } catch (err) {
        console.error("Error fetching resep:", err);
        toast.error("Gagal memuat daftar obat");
      }
    }
    setLoadingResep(false);
  };

  const closeObatDialog = () => {
    setObatDialogOpen(false);
    setSelectedItem(null);
    setResepList([]);
  };

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/antrian");
      if (!res.ok) throw new Error("Gagal memuat data antrian");
      const result = await res.json();
      setData(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/antrian/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Gagal mengubah status");
      }
      const labels: Record<string, string> = {
        dipanggil: "Pasien berhasil dipanggil",
        selesai: "Antrian selesai",
        batal: "Antrian dibatalkan",
      };
      toast.success(labels[status] ?? "Status diperbarui");
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah status antrian",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handlePasienDatang = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/paket/${id}/kunjungan`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal memproses kunjungan paket');
      toast.success(result.message || 'Kunjungan berhasil dicatat');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses kunjungan paket');
    } finally {
      setBusyId(null);
    }
  };

  const goToRME = (id: string) => router.push(`/dokter/rme/buat/${parseInt(id)}`);

  const isVisitToday = (it: AntrianItem | null) => {
    if (!it) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return it.tanggal === todayStr || it.last_visit_date === todayStr;
  };

  // ── Row actions (role-aware) ──────────────────────────────────────────────

  function RowActions({ item }: { item: AntrianItem }) {
    const busy = busyId === item.id;
    const isTodayVisit = isVisitToday(item);

    return (
      <div className="flex items-center justify-end gap-2">
        {/* PANGGIL — admin / karyawan / dokter on 'menunggu' */}
        {item.status === "menunggu" && (isStaff(role) || isDokter(role)) && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => updateStatus(item.id, "dipanggil")}
          >
            {busy ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : isDokter(role) ? (
              <PhoneCall className="h-3 w-3 mr-1" />
            ) : (
              <Phone className="h-3 w-3 mr-1" />
            )}
            Panggil
          </Button>
        )}



        {/* BUAT RME — dokter OR karyawan on 'dipanggil' */}
        {item.status === "dipanggil" && (isDokter(role) || role === "karyawan") && (
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            onClick={() => goToRME(item.id_pendaftaran ?? item.id)}
          >
            <FileText className="h-3 w-3 mr-1" />
            Buat RME
          </Button>
        )}

        {/* BUAT RME — dokter only on 'dipanggil' */}
        {item.status === "dipanggil" && isDokter(role) && (
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            onClick={() => goToRME(item.id_pendaftaran ?? item.id)}
          >
            <FileText className="h-3 w-3 mr-1" />
            Buat RME
          </Button>
        )}

        {/* LIHAT RME — dokter only on 'selesai' */}
        {item.status === "selesai" && isDokter(role) && item.id_rme && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/dokter/rme/${item.id_pendaftaran ?? item.id}`)}
          >
            <FileText className="h-3 w-3 mr-1" />
            Lihat RME
          </Button>
        )}

        {/* SIAPKAN OBAT — karyawan on 'selesai' with RME or active package visit */}
        {item.status === "selesai" && role === "karyawan" && (item.id_rme || ((item.sisa_kunjungan ?? 0) > 0 && !isTodayVisit)) && (
          <Button
            size="sm"
            variant="outline"
            className="text-amber-700 border-amber-300 hover:bg-amber-50"
            onClick={() => openSiapkanObat(item)}
          >
            <Package className="h-3 w-3 mr-1" />
            Siapkan Obat
          </Button>
        )}

        {/* BATALKAN — admin / superadmin only */}
        {(item.status === "menunggu" || item.status === "dipanggil") &&
          isAdmin(role) && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={busy}
              onClick={() => {
                if (confirm("Batalkan antrian ini?"))
                  updateStatus(item.id, "batal");
              }}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Batalkan
            </Button>
          )}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const showRMEColumn = isAdmin(role);
  const showDokterCol = !isDokter(role); // doctor already knows who they are
  const showKeluhan = isDokter(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isDokter(role) ? "Antrian Saya Hari Ini" : "Antrian Hari Ini"}
          </h1>
          <p className="text-sm text-gray-500">Auto-refresh setiap 30 detik</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>

          {/* Karyawan shortcut */}
          {role === "karyawan" && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => router.push("/karyawan/pendaftaran/buat")}
            >
              <Plus className="h-4 w-4 mr-1" />
              Buat Pendaftaran
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isDokter(role) ? "Daftar Antrian" : "Antrian Aktif"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data antrian...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Tidak ada antrian hari ini</p>
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {data.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 bg-white space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <span className="font-mono font-bold text-xl">
                      {item.no_antrian}
                    </span>
                    <StatusChip status={item.status} isPaket={!!item.id_paket} />
                  </div>
                  <div>
                    <p className="font-medium">{item.nama_pasien}</p>
                  </div>
                  {!isDokter(role) && (
                    <p className="text-sm text-gray-600">{item.nama_dokter}</p>
                  )}
                  <p className="text-sm">{item.nama_layanan}</p>
                  {isDokter(role) && item.keluhan_utama && (
                    <p className="text-sm text-gray-600 truncate">
                      {item.keluhan_utama}
                    </p>
                  )}
                  {showRMEColumn && item.id_rme && (
                    <StatusBadge status={item.status_rme ?? "draft"} />
                  )}
                  <div className="pt-1 border-t">
                    <RowActions item={item} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">No. Antrian</TableHead>
                    <TableHead>Pasien</TableHead>
                    {showDokterCol && <TableHead>Dokter</TableHead>}
                    <TableHead>Layanan</TableHead>
                    {showKeluhan && <TableHead>Keluhan</TableHead>}
                    <TableHead>Status</TableHead>
                    {showRMEColumn && <TableHead>RME</TableHead>}
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-bold text-lg">
                        {item.no_antrian}
                      </TableCell>

                      <TableCell>
                        <p className="font-medium">{item.nama_pasien}</p>
                      </TableCell>

                      {showDokterCol && (
                        <TableCell>{item.nama_dokter}</TableCell>
                      )}
                      <TableCell>{item.nama_layanan}</TableCell>
                      {showKeluhan && (
                        <TableCell className="max-w-[200px] truncate">
                          {item.keluhan_utama ?? "-"}
                        </TableCell>
                      )}

                      <TableCell>
                        <StatusChip status={item.status} isPaket={!!item.id_paket} />
                      </TableCell>

                      {showRMEColumn && (
                        <TableCell>
                          {item.id_rme ? (
                            <StatusBadge status={item.status_rme ?? "draft"} />
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      )}

                      <TableCell className="text-right">
                        <RowActions item={item} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Siapkan Obat Dialog */}
      <Dialog open={obatDialogOpen} onOpenChange={setObatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              Siapkan Obat
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="font-medium">{selectedItem.nama_pasien}</p>
              </div>

              {loadingResep ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Memuat daftar obat...</span>
                </div>
              ) : resepList.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>Tidak ada obat yang diresepkan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Daftar Obat:</p>
                  <ul className="divide-y">
                    {resepList.map((obat, idx) => (
                      <li key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {(obat.nama_obat as string) || (obat.nama_produk as string) || `Obat ${idx + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {obat.qty as string} {obat.satuan as string} × {obat.dosis as string}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4 border-t pt-4">
                <Button variant="outline" onClick={closeObatDialog}>
                  Tutup
                </Button>
                {selectedItem.status === "selesai" && (selectedItem.sisa_kunjungan ?? 0) > 0 && !isVisitToday(selectedItem) && isStaff(role) && (
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={busyId === selectedItem.id}
                    onClick={() => {
                      handlePasienDatang(selectedItem.id_pendaftaran ?? selectedItem.id);
                      closeObatDialog();
                    }}
                  >
                    {busyId === selectedItem.id && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Obat Diterima
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
