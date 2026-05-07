import { loadEnv } from "../src/infrastructure/loadEnv.js";

loadEnv();
process.env["NODE_ENV"] = "test";
process.env["LOG_LEVEL"] = process.env["LOG_LEVEL"] ?? "silent";
