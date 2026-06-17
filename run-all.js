const { spawn, execSync } = require("child_process");
const path = require("path");

const isWindows = process.platform === "win32";
const npmCmd = "npm";
const RESERVED_PORTS = [5000, 3001, 8081];

const projects = [
  {
    name: "ADMIN",
    cwd: path.join(__dirname, "admin"),
    npmScript: "dev",
    args: [],
    color: "\x1b[36m",
    stdio: ["ignore", "pipe", "pipe"],
  },
  {
    name: "BACKEND",
    cwd: path.join(__dirname, "backend"),
    npmScript: "dev",
    args: [],
    color: "\x1b[32m",
    stdio: ["ignore", "pipe", "pipe"],
  },
  {
    name: "WEB",
    cwd: path.join(__dirname, "web"),
    npmScript: "dev",
    args: [],
    color: "\x1b[33m",
    stdio: ["ignore", "pipe", "pipe"],
  },
  {
    name: "MOBILE",
    cwd: path.join(__dirname, "mobile"),
    npmScript: "start",
    args: [],
    color: "\x1b[35m",
    stdio: "inherit",
  },
];

const RESET = "\x1b[0m";
const children = [];

function getListeningPidsOnWindows(port) {
  try {
    const output = execSync(
      `netstat -ano -p tcp | findstr LISTENING | findstr :${port}`,
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );

    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      const columns = line.trim().split(/\s+/);
      if (columns.length < 5) {
        continue;
      }

      const localAddress = columns[1];
      const pid = columns[4];
      if (localAddress.endsWith(`:${port}`) && pid) {
        pids.add(pid);
      }
    }
    return [...pids];
  } catch {
    return [];
  }
}

function freeReservedPorts() {
  if (!isWindows) {
    return;
  }

  for (const port of RESERVED_PORTS) {
    const pids = getListeningPidsOnWindows(port);
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, {
          stdio: ["ignore", "ignore", "ignore"],
        });
        console.log(`Freed port ${port} by stopping PID ${pid}`);
      } catch {
        console.log(`Could not stop PID ${pid} on port ${port}`);
      }
    }
  }
}

function clearConsole() {
  try {
    if (isWindows) {
      execSync("cls", { stdio: "inherit", shell: true });
      return;
    }
    execSync("clear", { stdio: "inherit", shell: true });
  } catch {
    // Fallback for environments where cls/clear is unavailable.
    process.stdout.write("\x1Bc");
  }
}

function log(name, color, message) {
  const lines = message.toString().split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    console.log(`${color}[${name}]${RESET} ${line}`);
  }
}

function startProject(project) {
  const executable = project.command || npmCmd;
  const commandArgs = project.command
    ? project.args
    : ["run", project.npmScript, ...project.args];

  const child = spawn(executable, commandArgs, {
    cwd: project.cwd,
    stdio: project.stdio,
    env: process.env,
    shell: isWindows,
  });

  child.on("error", (error) => {
    log(project.name, project.color, `Failed to start: ${error.message}`);
  });

  if (project.stdio !== "inherit") {
    child.stdout.on("data", (data) => log(project.name, project.color, data));
    child.stderr.on("data", (data) => log(project.name, project.color, data));
  }

  child.on("exit", (code) => {
    log(project.name, project.color, `Process exited with code ${code}`);
  });

  children.push(child);
}

clearConsole();
freeReservedPorts();

for (const project of projects) {
  startProject(project);
}

function shutdown() {
  console.log("\nShutting down all projects...");
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
