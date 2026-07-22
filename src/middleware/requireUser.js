/**
 * ⚠️ Placeholder d'authentification.
 * Pour le MVP, le frontend envoie l'identifiant utilisateur Dossier dans le header
 * `x-user-id` (ex: l'id généré à l'onboarding). Ça permet de développer et tester
 * le flux Gmail + offres sans construire un système d'auth complet tout de suite.
 *
 * Avant une vraie mise en production : remplacer par une session/JWT vérifiée
 * côté serveur (ex: cookies signés, ou réutiliser l'auth de ton onboarding actuel).
 */
export function requireUser(req, res, next) {
  const userId = req.header("x-user-id");
  if (!userId) {
    return res.status(401).json({ error: "Header x-user-id manquant." });
  }
  req.userId = userId;
  next();
}
