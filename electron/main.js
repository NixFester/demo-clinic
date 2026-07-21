const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let serverProcess;

function getAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.unref();
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        resolve(getAvailablePort(startPort + 1));
      } else {
        reject(e);
      }
    });
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

function waitForServer(url) {
  return new Promise((resolve) => {
    const checkServer = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          resolve();
        } else {
          setTimeout(checkServer, 200);
        }
      }).on('error', () => {
        setTimeout(checkServer, 200);
      });
    };
    checkServer();
  });
}

async function createWindow() {
  const PORT = await getAvailablePort(3000);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Aplikasi Demo Clinic',
    show: false, // Hide until loaded
  });

  const serverPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');
  const serverDir = path.join(app.getAppPath(), '.next', 'standalone');

  let envVars = {};
  try {
    const envPath = path.join(app.getAppPath(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });
  } catch (e) {
    console.log('No .env file found or failed to read.');
  }

  const serverUrl = `http://127.0.0.1:${PORT}`;

  try {
    serverProcess = fork(serverPath, [], {
      env: {
        ...process.env,
        ...envVars,
        PORT: PORT,
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        NEXTAUTH_URL: serverUrl
      },
      cwd: serverDir,
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Next.js]: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Next.js Error]: ${data}`);
    });
    
    // Wait for the server to become available
    await waitForServer(serverUrl);

    // Open in default browser automatically
    shell.openExternal(serverUrl);

    // Show a simple message in the Electron window
    const htmlContent = `
      <html>
        <body style="font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f3f4f6; color: #1f2937;">
          <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center;">
            <h2 style="margin-top: 0;">Server Lokal Berjalan Aktif</h2>
            <p>Aplikasi telah dibuka secara otomatis di browser default Anda.</p>
            <p style="background: #eff6ff; padding: 10px; border-radius: 4px; border: 1px solid #bfdbfe;">
              <a href="${serverUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${serverUrl}</a>
            </p>
            <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0;">
              Biarkan jendela ini tetap terbuka. Tutup jendela ini untuk mematikan server.
            </p>
          </div>
        </body>
      </html>
    `;
    
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

  } catch (error) {
    dialog.showErrorBox('Server Error', `Gagal memulai server lokal:\n${error.message}`);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
