import fetch from "node-fetch";

const BASE_URL = process.env.ALTERNANCE_API_BASE_URL || "https://api.apprentissage.beta.gouv.fr";
const TOKEN = process.env.ALTERNANCE_API_TOKEN;

// ✅ Endpoint confirmé fonctionnel (testé avec un jeton réel, réponse 200 OK
// avec la structure jobs[].identifier / .workplace attendue par normalizeOffres ci-dessous).
const SEARCH_PATH = "/api/job/v1/search";

/**
 * Recherche des offres d'alternance.
 * @param {Object} params
 * @param {string} [params.romes] - Codes ROME séparés par virgule (ex: "M1805,M1806")
 * @param {number} [params.latitude]
 * @param {number} [params.longitude]
 * @param {number} [params.radius] - Rayon en km (10 | 30 | 60 | 100)
 * @param {string} [params.diploma] - Niveau de diplôme visé
 * @param {("apprentissage"|"professionnalisation")} [params.contractType]
 */
export async function searchOffres(params = {}) {
  if (!TOKEN) {
    throw new Error(
      "ALTERNANCE_API_TOKEN manquant. Inscris-toi sur api.apprentissage.beta.gouv.fr et récupère un jeton."
    );
  }

  const query = new URLSearchParams();
  if (params.romes) query.set("romes", params.romes);
  if (params.latitude) query.set("latitude", params.latitude);
  if (params.longitude) query.set("longitude", params.longitude);
  if (params.radius) query.set("radius", params.radius);
  if (params.diploma) query.set("target_diploma_level", params.diploma);
  if (params.contractType) query.set("contract_type", params.contractType);

  const url = `${BASE_URL}${SEARCH_PATH}?${query.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Erreur API La bonne alternance (${response.status}): ${body || response.statusText}`
    );
  }

  const data = await response.json();
  return normalizeOffres(data);
}

/**
 * Normalise la réponse brute vers un format stable utilisé par le frontend Dossier,
 * indépendant de la structure exacte renvoyée par l'API externe.
 */
function normalizeOffres(raw) {
  const items = raw?.jobs || raw?.results || raw?.data || (Array.isArray(raw) ? raw : []);

  return items.map((item) => ({
    id: item?.identifier?.id || item?.id,
    source: item?.identifier?.partner_label || item?.source || "La bonne alternance",
    titre: item?.offer?.title || item?.title,
    description: item?.offer?.description || item?.description,
    entreprise: item?.workplace?.name || item?.workplace?.legal_name || item?.company?.name,
    lieu: item?.workplace?.location?.address || item?.location,
    typeContrat: item?.contract?.type || item?.contractType,
    dateDebut: item?.contract?.start || item?.startDate,
    niveauDiplome: item?.offer?.target_diploma || item?.diploma,
    postulerUrl: item?.apply?.url || item?.applyUrl,
    postulerEmailId: item?.apply?.recipient_id || null,
    dateCreation: item?.publication?.creation || item?.createdAt,
    dateExpiration: item?.publication?.expiration || item?.expiresAt,
  }));
}
