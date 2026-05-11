// Startet Web-Server + ngrok in EINEM Terminal mit dem offiziellen v3 SDK.
// Stoppen: Ctrl+C
import "dotenv/config";
import { spawn } from "node:child_process";
import http from "node:http";
import ngrok from "@ngrok/ngrok";

const c = {
  reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m",
  blue: "\x1b[94m", green: "\x1b[92m", yellow: "\x1b[93m",
  cyan: "\x1b[96m", red: "\x1b[91m", magenta: "\x1b[95m",
  bg_green: "\x1b[42m",
};

console.log(`
${c.bold}${c.cyan}â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘      WERBEVIDEO GENERATOR â€” gestartet      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${c.reset}

${c.dim}Lokal:    http://localhost:8080${c.reset}
${c.dim}Stoppen:  Ctrl+C${c.reset}
`);

const fmt = (label, color) => (chunk) => {
  const stamp = new Date().toLocaleTimeString("de-DE");
  for (const line of chunk.toString().split(/\r?\n/)) {
    if (!line.trim()) continue;
    process.stdout.write(`${c.dim}${stamp}${c.reset} ${color}[${label.padEnd(6)}]${c.reset} ${line}\n`);
  }
};

// â”€â”€ 1. Web-Server starten â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log(`${c.cyan}[start] Web-Server startenâ€¦${c.reset}`);
const server = spawn("npm", ["run", "web"], { shell: true, cwd: process.cwd() });
const out = fmt("server", c.blue);
server.stdout.on("data", out);
server.stderr.on("data", out);

// â”€â”€ 2. Warten bis Server bereit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
await new Promise((resolve) => {
  const tick = () => {
    const req = http.get("http://localhost:8080/", { timeout: 1000 }, (res) => {
      res.resume(); resolve();
    });
    req.on("error", () => setTimeout(tick, 500));
    req.on("timeout", () => { req.destroy(); setTimeout(tick, 500); });
  };
  tick();
});
console.log(`${c.green}[start] Server bereit auf http://localhost:8080${c.reset}`);

// â”€â”€ 3. ngrok-Tunnel via offiziellem SDK â”€â”€â”€â”€â”€â”€â”€â”€
const token = process.env.NGROK_AUTHTOKEN;
if (!token) {
  console.error(`${c.red}[ngrok ] NGROK_AUTHTOKEN fehlt in .env${c.reset}`);
  server.kill(); process.exit(1);
}

console.log(`${c.cyan}[start] ngrok-Tunnel startenâ€¦${c.reset}`);

let listener;
let publicUrl;
try {
  listener = await ngrok.forward({
    addr: 8080,
    authtoken: token,
  });
  publicUrl = listener.url();
} catch (e) {
  console.error(`${c.red}[ngrok ] Fehler: ${e.message}${c.reset}`);
  if (e.errorCode) console.error(`${c.red}[ngrok ] Code: ${e.errorCode}${c.reset}`);
  server.kill(); process.exit(1);
}

console.log(`
${c.bold}${c.bg_green}                                                    ${c.reset}
${c.bold}${c.bg_green}   OEFFENTLICHE URL FUER DEINE CHEFIN:              ${c.reset}
${c.bold}${c.bg_green}                                                    ${c.reset}
${c.bold}${c.green}   ${publicUrl}${c.reset}
${c.bold}${c.bg_green}                                                    ${c.reset}
${c.dim}   Diese URL kopieren und per WhatsApp/Mail senden${c.reset}
`);

// â”€â”€ Cleanup â”€â”€
const shutdown = async () => {
  console.log(`\n${c.yellow}[stop] Beende Server + ngrokâ€¦${c.reset}`);
  try { await listener?.close(); } catch {}
  try { server.kill("SIGTERM"); } catch {}
  setTimeout(() => process.exit(0), 1000);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.on("close", (code) => {
  console.log(`${c.red}[server] beendet (code ${code})${c.reset}`);
  shutdown();
});

