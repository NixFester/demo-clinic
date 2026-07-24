"use client";

import { useState, useEffect } from "react";
import { AppConfig, loadConfig, saveConfig } from "@/lib/config-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SetupConfigForm({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [bridgeUrl, setBridgeUrl] = useState("");
  const [nextauthUrl, setNextauthUrl] = useState("");
  const [bridgeSecret, setBridgeSecret] = useState("simklinik_secret_key_2024");

  useEffect(() => {
    loadConfig().then((cfg) => {
      if (cfg.bridge_url && cfg.nextauth_url) {
        // Config already exists and valid
        onComplete();
      } else {
        // Setup defaults from process.env if available
        setBridgeUrl(process.env.NEXT_PUBLIC_BRIDGE_URL || "http://localhost:8000/handler.php");
        setNextauthUrl(process.env.NEXT_PUBLIC_NEXTAUTH_URL || "http://localhost:3000");
        setBridgeSecret(process.env.NEXT_PUBLIC_BRIDGE_SECRET || "simklinik_secret_key_2024");
        setLoading(false);
      }
    });
  }, [onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveConfig({
      bridge_url: bridgeUrl,
      nextauth_url: nextauthUrl,
      bridge_secret: bridgeSecret
    });
    
    // Slight delay to ensure saving completes
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  if (loading) return null; // Or a spinner

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-emerald-500">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Konfigurasi Sistem</h1>
        <p className="text-sm text-gray-600 mb-6">
          Silakan lengkapi konfigurasi URL untuk menghubungkan aplikasi dengan server.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bridge URL (PHP)</label>
            <Input 
              type="url" 
              required 
              value={bridgeUrl} 
              onChange={e => setBridgeUrl(e.target.value)}
              placeholder="http://localhost:8000/handler.php"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">NextAuth URL</label>
            <Input 
              type="url" 
              required 
              value={nextauthUrl} 
              onChange={e => setNextauthUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </div>

          <div className="space-y-2 hidden">
            <label className="text-sm font-medium text-gray-700">Bridge Secret</label>
            <Input 
              type="password" 
              value={bridgeSecret} 
              onChange={e => setBridgeSecret(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </Button>
        </form>
      </div>
    </div>
  );
}
