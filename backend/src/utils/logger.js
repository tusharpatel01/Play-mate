const fs = require("fs");
const path = require("path");

// ─── Console logger with levels ──────────────────────────
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = {
  error: "\x1b[31m", // red
  warn:  "\x1b[33m", // yellow
  info:  "\x1b[36m", // cyan
  debug: "\x1b[90m", // grey
  reset: "\x1b[0m",
};

const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

const logger = {
  error: (msg, meta) => log("error", msg, meta),
  warn:  (msg, meta) => log("warn",  msg, meta),
  info:  (msg, meta) => log("info",  msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};

function log(level, msg, meta) {
  if (LEVELS[level] > currentLevel) return;
  const ts = new Date().toISOString();
  const color = COLORS[level];
  const prefix = `${color}[${level.toUpperCase()}]${COLORS.reset} ${ts}`;
  if (meta) {
    console.log(`${prefix} ${msg}`, meta);
  } else {
    console.log(`${prefix} ${msg}`);
  }
}

module.exports = logger;
