/**
 * Stops whatever is listening on the lab port (Windows: old Node still serving outdated HTML).
 * Run: node scripts/stop-listener.js
 */
const os = require("os");
const { execFileSync } = require("child_process");

const port = Number(process.env.PORT) || 3648;

if (os.platform() !== "win32") {
  console.log("stop-listener: use npx kill-port", port, "on this OS.");
  process.exit(0);
}

const script = [
  `$c = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;`,
  `if ($null -ne $c) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Output ('Stopped process on port ' + ${port}) }`,
  `else { Write-Output ('No listener on port ' + ${port}) }`,
].join(" ");

try {
  execFileSync("powershell", ["-NoProfile", "-Command", script], { stdio: "inherit" });
} catch {
  // ignore
}
