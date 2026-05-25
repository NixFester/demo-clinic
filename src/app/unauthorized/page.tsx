"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <ShieldX className="h-16 w-16 text-red-400" />
      <h1 className="text-2xl font-bold text-gray-800">Akses Ditolak</h1>
      <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      <Button onClick={() => signOut({ callbackUrl: "/login" })} variant="outline">
        Kembali ke Login
      </Button>
    </div>
  );
}
