import { Router } from "express";
import { searchOffres } from "../services/alternanceApi.js";

const router = Router();

/**
 * GET /api/offres?romes=M1805&latitude=48.85&longitude=2.35&radius=30&diploma=6&contractType=apprentissage
 */
router.get("/", async (req, res) => {
  try {
    const { romes, latitude, longitude, radius, diploma, contractType } = req.query;

    const offres = await searchOffres({
      romes,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      radius: radius ? Number(radius) : undefined,
      diploma,
      contractType,
    });

    res.json({ count: offres.length, offres });
  } catch (err) {
    console.error("[offres] erreur:", err.message);
    res.status(502).json({ error: err.message });
  }
});

export default router;
