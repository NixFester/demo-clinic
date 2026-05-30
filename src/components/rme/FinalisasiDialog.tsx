'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, FileCheck, Loader2 } from 'lucide-react';

interface FinalisasiDialogProps {
  open:        boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm:   () => void;
  loading:     boolean;
}

export function FinalisasiDialog({ open, onOpenChange, onConfirm, loading }: FinalisasiDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Finalisasi RME</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin memfinalisasi RME ini? Setelah difinalisasi, data tidak dapat diubah kembali.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Pastikan semua data SOAP, diagnosa, tindakan, dan resep sudah lengkap sebelum finalisasi.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <FileCheck className="h-4 w-4 mr-2" />}
            Ya, Finalisasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
