export interface AppConfig {
  bridge_url: string;
  nextauth_url: string;
  bridge_secret: string;
}

// Fallback for web mode
let memoryConfig: Partial<AppConfig> = {};

export async function loadConfig(): Promise<Partial<AppConfig>> {
  if (typeof window !== "undefined" && window.__TAURI__) {
    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = new Store('config.json');
      await store.load();
      
      const bridge_url = await store.get<string>('bridge_url');
      const nextauth_url = await store.get<string>('nextauth_url');
      const bridge_secret = await store.get<string>('bridge_secret');

      return {
        bridge_url: bridge_url || undefined,
        nextauth_url: nextauth_url || undefined,
        bridge_secret: bridge_secret || undefined,
      };
    } catch (e) {
      console.warn("Failed to load Tauri store, falling back to localStorage", e);
    }
  }

  // Web Fallback
  if (typeof window !== "undefined") {
    return {
      bridge_url: localStorage.getItem('bridge_url') || undefined,
      nextauth_url: localStorage.getItem('nextauth_url') || undefined,
      bridge_secret: localStorage.getItem('bridge_secret') || undefined,
    };
  }

  return memoryConfig;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  if (typeof window !== "undefined" && window.__TAURI__) {
    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = new Store('config.json');
      
      await store.set('bridge_url', config.bridge_url);
      await store.set('nextauth_url', config.nextauth_url);
      await store.set('bridge_secret', config.bridge_secret);
      
      await store.save();
      return;
    } catch (e) {
      console.warn("Failed to save Tauri store, falling back to localStorage", e);
    }
  }

  // Web Fallback
  if (typeof window !== "undefined") {
    localStorage.setItem('bridge_url', config.bridge_url);
    localStorage.setItem('nextauth_url', config.nextauth_url);
    localStorage.setItem('bridge_secret', config.bridge_secret);
  } else {
    memoryConfig = config;
  }
}
