"use client";

import { useEffect, useState } from "react";
import SetupConfigForm from "../SetupConfigForm";
import { loadConfig } from "@/lib/config-store";
import { initializeApiInterceptor } from "@/lib/api-interceptor";

export default function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    loadConfig().then((cfg) => {
      if (cfg.bridge_url && cfg.nextauth_url) {
        initializeApiInterceptor(cfg.bridge_url, cfg.nextauth_url);
        setConfigReady(true);
      }
    });
  }, []);

  if (!configReady) {
    return <SetupConfigForm onComplete={() => window.location.reload()} />;
  }

  return <>{children}</>;
}
