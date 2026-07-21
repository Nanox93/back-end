import "dotenv/config";
import express from "express";
import cors from "cors";

import offresRoutes from "./src/routes/offres.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import emailRoutes from "./src/routes/email.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/offres", offresRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur inattendue." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Dossier backend démarré sur http://localhost:${PORT}`);
});
