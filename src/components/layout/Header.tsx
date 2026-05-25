"use client";

import { useSession } from "next-auth/react";
import { getRoleLabel } from "@/lib/utils";
import { Heart } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        <Heart className="h-5 w-5 text-emerald-600" />
        <h1 className="text-lg font-semibold text-gray-800">
          Sistem Informasi Manajemen Klinik
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{session.user.name}</p>
          <p className="text-xs text-gray-500">{getRoleLabel(session.user.role)}</p>
        </div>
      </div>
    </header>
  );
}
