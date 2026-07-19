'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { ClipboardList, Phone, RefreshCw } from 'lucide-react';

interface AntrianItem {
  id: number;
  no_antrian: number;
  status: string;
  keluhan_utama: string;
  jenis_kunjungan: string;
  nama_pasien: string;
  no_rekam_medis: string;
  nama_dokter: string;
  nama_layanan: string;
  id_rme: number | null;
  status_rme: string | null;
}

interface AntrianTableProps {
  role: string;
  idDokter?: string;
  onCallNext?: (id: number) => void;
}

export function AntrianTable({ role, idDokter, onCallNext }: AntrianTableProps) {
  const [data, setData] = useState<AntrianItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (idDokter) params.set('id_dokter', idDokter);
      const res = await fetch(`/api/antrian?${params}`);
      const result = await res.json();
      setData(result.data || []);
    } catch (error) {
      console.error('[AntrianTable] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [idDokter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await fetch(`/api/antrian/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (error) {
      console.error('[AntrianTable] Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Memuat data antrian...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Tidak ada antrian hari ini</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">No. Antrian</TableHead>
            <TableHead>Pasien</TableHead>
            <TableHead>Dokter</TableHead>
            <TableHead>Layanan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>RME</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono font-bold text-lg">{item.no_antrian}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{item.nama_pasien}</p>
                </div>
              </TableCell>
              <TableCell>{item.nama_dokter}</TableCell>
              <TableCell>{item.nama_layanan}</TableCell>
              <TableCell><StatusBadge status={item.status} /></TableCell>
              <TableCell>
                {item.id_rme ? <StatusBadge status={item.status_rme || 'draft'} /> : <span className="text-gray-400 text-sm">-</span>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {item.status === 'menunggu' && (role === 'admin' || role === 'karyawan' || role === 'superadmin') && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item.id, 'dipanggil')}>
                      <Phone className="h-3 w-3 mr-1" />
                      Panggil
                    </Button>
                  )}
                  {item.status === 'dipanggil' && role === 'dokter' && (
                    <Button size="sm" variant="outline" onClick={() => onCallNext?.(item.id)}>
                      Mulai Periksa
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
