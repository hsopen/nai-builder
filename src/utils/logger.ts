import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

// 公共日志格式
const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

// 控制台格式（带颜色）
const consoleFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  colorize(),
  logFormat
);

// 文件格式（无颜色）
const fileFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  logFormat
);

// 基础 logger
export const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: fileFormat
    })
  ]
});
