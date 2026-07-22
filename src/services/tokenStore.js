import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "..", "data", "db.json");

const adapter = new JSONFile(file);
const db = new Low(adapter, { users: {} });

async function init() {
  await db.read();
  db.data ||= { users: {} };
  await db.write();
}
await init();

/** Enregistre les tokens OAuth Google d'un utilisateur */
export async function saveGoogleTokens(userId, tokens) {
  await db.read();
  db.data.users[userId] = {
    ...(db.data.users[userId] || {}),
    google: tokens,
  };
  await db.write();
}

/** Récupère les tokens OAuth Google d'un utilisateur */
export async function getGoogleTokens(userId) {
  await db.read();
  return db.data.users[userId]?.google || null;
}

/** Supprime la connexion Gmail d'un utilisateur (déconnexion) */
export async function clearGoogleTokens(userId) {
  await db.read();
  if (db.data.users[userId]) {
    delete db.data.users[userId].google;
    await db.write();
  }
}
