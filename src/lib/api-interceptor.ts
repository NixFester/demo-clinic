export function initializeApiInterceptor(bridgeUrl: string, nextAuthUrl: string) {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = "";
    if (typeof input === "string") url = input;
    else if (input instanceof URL) url = input.href;
    else url = input.url;

    // Route to NextAuth external server
    if (url.includes("/api/auth/")) {
      const authUrl = nextAuthUrl.replace(/\/$/, "") + url.substring(url.indexOf("/api/auth/"));
      return originalFetch(authUrl, init);
    }

    // Intercept API calls
    if (url.includes("/api/")) {
      const method = init?.method || "GET";
      const urlObj = new URL(url, window.location.origin);
      const path = urlObj.pathname;
      const searchParams = Object.fromEntries(urlObj.searchParams.entries());
      
      let body: any = {};
      if (init?.body && typeof init.body === "string") {
        try {
          body = JSON.parse(init.body);
        } catch (e) {}
      }

      let action = "";
      let data: any = { ...searchParams, ...body };

      // Simple router logic mimicking Next.js API routes
      
      // Master Data CRUD
      const masterMatch = path.match(/^\/api\/master\/([a-zA-Z0-9-]+)(\/(\d+))?(\/(toggle))?$/);
      if (masterMatch) {
        const entity = masterMatch[1].replace("-", "_"); // e.g. paket-layanan -> paket_layanan
        const id = masterMatch[3];
        const subAction = masterMatch[5];

        if (subAction === "toggle") {
          action = `${entity}.toggleAktif`;
          data.id = parseInt(id);
        } else if (id) {
          data.id = parseInt(id);
          if (method === "GET") action = `${entity}.show`;
          if (method === "PUT") action = `${entity}.update`;
          if (method === "DELETE") action = `${entity}.delete`;
        } else {
          if (method === "GET") action = `${entity}.index`;
          if (method === "POST") action = `${entity}.store`;
        }
      } 
      // Antrian
      else if (path.startsWith("/api/antrian")) {
        const match = path.match(/^\/api\/antrian\/(\d+)\/status$/);
        if (match && method === "PUT") {
          action = "pendaftaran.updateStatus";
          data.id = parseInt(match[1]);
        } else {
          action = "antrian.hari_ini";
        }
      }
      // Invoice
      else if (path.startsWith("/api/invoice")) {
        const match = path.match(/^\/api\/invoice\/(\d+)(\/(batal|diskon))?$/);
        if (match) {
          const id = match[1];
          const sub = match[3];
          data.id = parseInt(id);
          if (sub === "batal") action = "invoice.batal";
          else if (sub === "diskon") action = "invoice.applyDiskon";
          else action = "invoice.show";
        } else {
          if (method === "GET") action = "invoice.index";
          if (method === "POST") action = "invoice.generateMissing"; // Or generate based on body
        }
      }
      // Pendaftaran
      else if (path.startsWith("/api/pendaftaran")) {
        const match = path.match(/^\/api\/pendaftaran\/(\d+)\/batal$/);
        if (match) {
          action = "pendaftaran.batal";
          data.id = parseInt(match[1]);
        } else if (path === "/api/pendaftaran/belum-bayar") {
          action = "pendaftaran.belumBayar";
        } else if (path === "/api/pendaftaran/lunas") {
          action = "pendaftaran.lunas";
        } else {
          if (method === "GET") action = "pendaftaran.index";
          if (method === "POST") action = "pendaftaran.store";
        }
      }
      // Pasien
      else if (path.startsWith("/api/pasien")) {
        const match = path.match(/^\/api\/pasien\/(\d+)$/);
        if (match) {
          data.id = parseInt(match[1]);
          if (method === "GET") action = "pasien.show"; // And riwayat, simplified here
          if (method === "PUT") action = "pasien.update";
        } else {
          if (method === "GET") action = "pasien.index";
          if (method === "POST") action = "pasien.store";
        }
      }
      // Laporan
      else if (path.startsWith("/api/laporan/")) {
        const type = path.split("/")[3];
        action = `laporan.${type}`;
      }
      // Pembayaran
      else if (path === "/api/pembayaran") {
        action = "pembayaran.store";
      }
      // Pengaturan
      else if (path === "/api/pengaturan") {
        if (method === "GET") action = "pengaturan.get";
        if (method === "POST" || method === "PUT") action = "pengaturan.update";
      }
      // Followup
      else if (path.startsWith("/api/followup")) {
        const match = path.match(/^\/api\/followup\/(\d+)\/terkirim$/);
        if (match) {
          action = "followup.tandaiTerkirim";
          data.id = parseInt(match[1]);
        } else {
          if (method === "GET") action = "followup.index";
          if (method === "POST") action = "followup.store";
        }
      }
      // RME
      else if (path.startsWith("/api/rme")) {
        // ... (complex RME mappings)
        if (path.includes("latestByPatient")) {
          action = "rme.latestByPatient";
        } else {
           const match = path.match(/^\/api\/rme\/(\d+)(\/(finalisasi|resep|tindakan))?(\/(\d+))?$/);
           if (match) {
             const rmeId = match[1];
             const type = match[3];
             const itemId = match[5];
             
             data.id = parseInt(rmeId);
             data.id_rme = parseInt(rmeId);

             if (type === "finalisasi") action = "rme.finalisasi";
             else if (type === "resep") {
               if (itemId) {
                 action = "resep.deleteItem";
                 data.id = parseInt(itemId);
               } else {
                 if (method === "GET") action = "resep.getByRme";
                 if (method === "POST") action = "resep.storeItem";
               }
             } else if (type === "tindakan") {
               if (itemId) {
                 action = "tindakan.delete";
                 data.id = parseInt(itemId);
               } else {
                 if (method === "POST") action = "tindakan.store";
               }
             } else {
               if (method === "GET") action = "rme.getOrCreate";
               if (method === "PUT") action = "rme.update";
             }
           } else {
             if (method === "GET") action = "rme.index";
             if (method === "POST") action = "rme.store";
           }
        }
      }
      
      // Fallback
      if (!action) {
        console.warn("[API Interceptor] Unmapped route:", path, method);
        // Maybe try a direct fetch if unmapped, or return 404
        return originalFetch(input, init);
      }

      console.log(`[API Interceptor] Mapping ${method} ${path} -> ${action}`);

      // Forward to Bridge URL
      const bridgePayload = { action, data };
      return originalFetch(bridgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // X-Bridge-Secret is required by the backend, need to handle this
          // The client shouldn't ideally know the secret, but for this migration:
          "X-Bridge-Secret": localStorage.getItem("BRIDGE_SECRET") || "simklinik_secret_key_2024", 
        },
        body: JSON.stringify(bridgePayload)
      }).then(async (res) => {
        // The frontend expects Next.js API format which often is just the bridge result
        // Some Next.js APIs wrap it or unwrap it, we simulate the standard response
        if (!res.ok) return res;
        const json = await res.json();
        return new Response(JSON.stringify(json), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      });
    }

    return originalFetch(input, init);
  };
}
