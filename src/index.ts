import "dotenv/config";
import { createApp } from "./presentation/createApp.js";

const app = createApp();
const PORT = Number(process.env["PORT"] ?? 3001);

app.listen(PORT, () => {
  console.log(`api-kytalist listening on http://localhost:${PORT}`);
});
