import { loadEnv } from "./infrastructure/loadEnv.js";
import { createApp } from "./presentation/createApp.js";

loadEnv();

const app = createApp();

export default app;
