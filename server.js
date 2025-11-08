import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Servir la carpeta dist (generada por Vite)
app.use(express.static(path.join(__dirname, "dist")));

// Todas las rutas deben redirigir al index.html para SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log("Server running on port", port);
});
