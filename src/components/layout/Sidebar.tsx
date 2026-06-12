"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Briefcase,
  Package,
  CalendarDays,
  FileText,
  ClipboardList,
  Receipt,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Heart,
  ShoppingCart,
  Tag,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function getNavItems(role: string): NavItem[] {
  if (role === "admin" || role === "superadmin") {
    return [
      { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/admin/laporan", label: "Laporan", icon: <BarChart3 className="h-4 w-4" /> },
      { href: "/admin/pengguna", label: "Pengguna", icon: <Users className="h-4 w-4" /> },
      { href: "/admin/dokter", label: "Dokter", icon: <Stethoscope className="h-4 w-4" /> },
      { href: "/admin/spesialisasi", label: "Spesialisasi", icon: <Stethoscope className="h-4 w-4" /> },
      { href: "/admin/layanan", label: "Layanan", icon: <Briefcase className="h-4 w-4" /> },
      { href: "/admin/produk", label: "Produk", icon: <Package className="h-4 w-4" /> },
      { href: "/admin/jadwal-dokter", label: "Jadwal Dokter", icon: <CalendarDays className="h-4 w-4" /> },
      { href: "/admin/diagnosa", label: "Diagnosa ICD-10", icon: <FileText className="h-4 w-4" /> },
      { href: "/admin/pasien", label: "Pasien", icon: <Heart className="h-4 w-4" /> },
      { href: "/admin/antrian", label: "Antrian", icon: <ClipboardList className="h-4 w-4" /> },
      { href: "/admin/rme", label: "Rekam Medis", icon: <FileText className="h-4 w-4" /> },
      { href: "/admin/kasir", label: "Kasir", icon: <Receipt className="h-4 w-4" /> },
      { href: "/admin/pendaftaran/buat", label: "Pendaftaran", icon: <FileText className="h-4 w-4" /> },
      { href: "/admin/followup", label: "Follow Up WA", icon: <MessageSquare className="h-4 w-4" /> },
      { href: "/admin/pengaturan", label: "Pengaturan", icon: <Settings className="h-4 w-4" /> },
      
    ];
  }
  if (role === "dokter") {
    return [
      { href: "/dokter/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/dokter/antrian", label: "Antrian Saya", icon: <ClipboardList className="h-4 w-4" /> },
      { href: "/dokter/jadwal", label: "Jadwal Saya", icon: <Clock className="h-4 w-4" /> },
    ];
  }
  if (role === "kasir") {
    return [
      { href: "/kasir/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/kasir/laporan", label: "Laporan Pembayaran", icon: <Receipt className="h-4 w-4" /> },
    ];
  }
  // karyawan
  return [
    { href: "/karyawan/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/karyawan/antrian", label: "Antrian", icon: <ClipboardList className="h-4 w-4" /> },
    { href: "/karyawan/pendaftaran/buat", label: "Pendaftaran", icon: <FileText className="h-4 w-4" /> },
    { href: "/karyawan/pasien", label: "Pasien", icon: <Heart className="h-4 w-4" /> },
    { href: "/karyawan/kasir", label: "Kasir", icon: <Receipt className="h-4 w-4" /> },
    { href: "/karyawan/followup", label: "Follow Up WA", icon: <MessageSquare className="h-4 w-4" /> },
    { href: "/karyawan/katalog/produk", label: "Katalog Produk", icon: <ShoppingCart className="h-4 w-4" /> },
    { href: "/karyawan/katalog/layanan", label: "Katalog Layanan", icon: <Tag className="h-4 w-4" /> },
    { href: "/karyawan/katalog/jadwal", label: "Jadwal Dokter", icon: <CalendarDays className="h-4 w-4" /> },
    { href: "/karyawan/laporan", label: "Laporan", icon: <BarChart3 className="h-4 w-4" /> },
  ];
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!session) return null;

  const role = session.user.role;
  const items = getNavItems(role);

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-gray-50 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-emerald-600" />
            <span className="font-bold text-emerald-700 text-sm">SIMKlinik</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User info */}
      <div className="p-3">
        {!collapsed && (
          <div className="mb-2">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-gray-500">{getRoleLabel(role)}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn("w-full", !collapsed && "justify-start")}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Keluar</span>}
        </Button>
      </div>
    </div>
  );
}
