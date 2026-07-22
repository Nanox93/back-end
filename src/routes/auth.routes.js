import { Router } from "express";
import { getGoogleAuthUrl, handleGoogleCallback, isGmailConnected } from "../services/gmail.js";
import { clearGoogleTokens } from "../services/tokenStore.js";
import { requireUser } from "../middleware/requireUser.js";

const router = Router();

/**
 * GET /api/auth/google?userId=xxx
 * Renvoie l'URL vers laquelle rediriger l'utilisateur pour connecter Gmail.
 * (le frontend fait window.location.href = data.url)
 */
router.get("/google", (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "userId manquant." });

  const url = getGoogleAuthUrl(userId); // on réutilise `state` pour transporter l'userId
  res.json({ url });
});

/**
 * GET /api/auth/google/callback
 * Google redirige ici après consentement de l'utilisateur.
 */
router.get("/google/callback", async (req, res) => {
  const { code, state: userId, error } = req.query;
  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";

  if (error) {
    return res.redirect(`${frontend}/parametres?gmail=refuse`);
  }

  try {
    await handleGoogleCallback(userId, code);
    res.redirect(`${frontend}/parametres?gmail=connecte`);
  } catch (err) {
    console.error("[auth/google/callback] erreur:", err.message);
    res.redirect(`${frontend}/parametres?gmail=erreur`);
  }
});

/**
 * GET /api/auth/google/status
 * Le frontend l'appelle pour savoir si l'utilisateur a déjà connecté Gmail.
 */
router.get("/google/status", requireUser, async (req, res) => {
  const connected = await isGmailConnected(req.userId);
  res.json({ connected });
});

/**
 * POST /api/auth/google/disconnect
 */
router.post("/google/disconnect", requireUser, async (req, res) => {
  await clearGoogleTokens(req.userId);
  res.json({ ok: true });
});

export default router;
