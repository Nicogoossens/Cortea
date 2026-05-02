import { Router } from "express";
import { getVenues, type VenueCategory } from "../data/venues";

const router = Router();

router.get("/venues", (req, res) => {
  const region = typeof req.query.region === "string" ? req.query.region.toUpperCase() : undefined;
  const category = typeof req.query.category === "string" ? req.query.category as VenueCategory : undefined;

  const VALID_CATEGORIES: VenueCategory[] = ["shops", "dining", "activities", "accommodations", "transport"];
  if (category && !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
    return;
  }

  const venues = getVenues(region, category);
  res.json({ venues });
});

export default router;
