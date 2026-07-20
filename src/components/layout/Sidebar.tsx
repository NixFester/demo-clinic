"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
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
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
      { href: "/admin/paket-layanan", label: "Paket Layanan", icon: <ShoppingCart className="h-4 w-4" /> },
      { href: "/admin/produk", label: "Produk", icon: <Package className="h-4 w-4" /> },
      { href: "/admin/jadwal-dokter", label: "Jadwal Dokter", icon: <CalendarDays className="h-4 w-4" /> },
      { href: "/admin/diagnosa", label: "Diagnosa ICD-10", icon: <FileText className="h-4 w-4" /> },
      { href: "/admin/pasien", label: "Pasien", icon: <Heart className="h-4 w-4" /> },
      { href: "/admin/antrian", label: "Antrian", icon: <ClipboardList className="h-4 w-4" /> },
      { href: "/admin/rme", label: "Rekam Medis", icon: <FileText className="h-4 w-4" /> },
      { href: "/admin/kasir", label: "Kasir", icon: <Receipt className="h-4 w-4" /> },
      { href: "/admin/pendaftaran/buat", label: "Pendaftaran", icon: <FileText className="h-4 w-4" /> },
      { href: "/admin/followup", label: "Follow Up WA", icon: <MessageSquare className="h-4 w-4" /> },
      
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
  const isMobile = useIsMobile();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showPahamOverlay, setShowPahamOverlay] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    try {
      const p = localStorage.getItem("paham");
      setShowPahamOverlay(p !== "true");
    } catch (e) {
      // ignore
    }
  }, [isMobile]);

  const handleDismissOverlay = () => {
    try {
      localStorage.setItem("paham", "true");
    } catch (e) {
      // ignore
    }
    setShowPahamOverlay(false);
  };

  if (!session) return null;

  const role = session.user.role;
  const items = getNavItems(role);
  if (isMobile) {
  return (
    <>
      {/* Floating hamburger button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            
            size="icon"
            className="fixed bottom-7 right-8 z-50 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-0">
          
          <SheetTitle className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Image src="/logo-elrhea.png" alt="Elrhea Clinic" width={36} height={36} className="object-contain" />
              <span className="font-bold text-emerald-700">Elrhea Clinic</span>
            </div>
          </SheetTitle>
          <SheetDescription className="pl-5 text-sm text-gray-500 m-0">
            Menu Navigasi Mobile
          </SheetDescription>
          <ScrollArea className="flex-1 py-2">
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
          </ScrollArea>

          {/* Mobile logout */}
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Keluar</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      {/* Mobile onboarding overlay: shows once until `paham=true` in localStorage */}
      {showPahamOverlay && (
        <div
          className="fixed inset-0 z-[60] md:hidden flex items-end justify-end p-6"
          onClick={handleDismissOverlay}
          role="button"
          aria-label="Dismiss onboarding"
        >
          <div className="absolute inset-0 bg-black/40" />

          <div className="absolute bottom-0 right-0 flex flex-col items-end">
            <div className="mb-14 mr-2">
              <div className="bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm">
                Ketuk tombol ini untuk membuka navigasi
              </div>
              <div className="w-3 h-3 bg-white rotate-45 mt-2 ml-auto" />
            </div>

            <span className="absolute bottom-6 right-6 w-12 h-12 rounded-full border-2 border-emerald-400 opacity-80 animate-pulse pointer-events-none" />
          </div>
        </div>
      )}
    </>
  );
}

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
            <Image src="/logo-elrhea.png" alt="Elrhea Clinic" width={32} height={32} className="object-contain" />
            <span className="font-bold text-emerald-700">Elrhea Clinic</span>
          </div>
        )}
        {collapsed && (
          <Image src="/logo-elrhea.png" alt="Elrhea Clinic" width={28} height={28} className="object-contain mx-auto" />
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
