import { Router } from "express";
import { sendEmail } from "../services/gmail.js";
import { requireUser } from "../middleware/requireUser.js";

const router = Router();

/**
 * POST /api/email/send
 * body: { to, subject, body }
 * Envoie l'email de candidature déjà généré/édité côté frontend (drafts existants du CRM).
 */
router.post("/send", requireUser, async (req, res) => {
  const { to, subject, body } = req.body || {};

  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Champs requis: to, subject, body." });
  }

  try {
    const result = await sendEmail(req.userId, { to, subject, body });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[email/send] erreur:", err.message);
    const isNotConnected = err.message.includes("Aucun compte Gmail");
    res.status(isNotConnected ? 401 : 502).json({ error: err.message });
  }
});

export default router;
