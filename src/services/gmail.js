import { google } from "googleapis";
import { saveGoogleTokens, getGoogleTokens } from "./tokenStore.js";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Construit l'URL vers laquelle rediriger l'utilisateur pour connecter son compte Gmail.
 * `state` sert à retrouver l'utilisateur Dossier au retour du callback.
 */
export function getGoogleAuthUrl(state) {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // nécessaire pour obtenir un refresh_token
    prompt: "consent", // force le refresh_token même si déjà autorisé avant
    scope: SCOPES,
    state,
  });
}

/**
 * Échange le code renvoyé par Google contre des tokens, et les sauvegarde pour l'utilisateur.
 */
export async function handleGoogleCallback(userId, code) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  await saveGoogleTokens(userId, tokens);
  return tokens;
}

/**
 * Renvoie un client OAuth2 authentifié pour un utilisateur donné, avec rafraîchissement
 * automatique du token si besoin (googleapis s'en charge et persiste le nouveau access_token).
 */
async function getAuthenticatedClient(userId) {
  const tokens = await getGoogleTokens(userId);
  if (!tokens) {
    throw new Error("Aucun compte Gmail connecté pour cet utilisateur.");
  }

  const client = createOAuthClient();
  client.setCredentials(tokens);

  client.on("tokens", async (newTokens) => {
    await saveGoogleTokens(userId, { ...tokens, ...newTokens });
  });

  return client;
}

/**
 * Envoie un email via l'API Gmail au nom de l'utilisateur connecté.
 */
export async function sendEmail(userId, { to, subject, body }) {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  const messageParts = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: =?utf-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`,
    "",
    body,
  ];
  const message = messageParts.join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });

  return { messageId: result.data.id, threadId: result.data.threadId };
}

export async function isGmailConnected(userId) {
  const tokens = await getGoogleTokens(userId);
  return Boolean(tokens?.refresh_token || tokens?.access_token);
}
