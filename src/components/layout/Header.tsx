"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { getRoleLabel } from "@/lib/utils";

export default function Header() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        <Image src="/logo-elrhea.png" alt="Elrhea Clinic" width={40} height={40} className="object-contain" />
        <h1 className="text-xl font-bold text-emerald-700">
          Elrhea Clinic
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
