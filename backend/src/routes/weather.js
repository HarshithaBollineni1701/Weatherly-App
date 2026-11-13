import { Router } from 'express';
import { getWeather, resolveLocation } from '../services/weatherService.js';
const router = Router();
router.get('/', async (req, res, next) => {
  try {
    let location;
    if (req.query.latitude !== undefined && req.query.longitude !== undefined) {
      const latitude = Number(req.query.latitude); const longitude = Number(req.query.longitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return res.status(400).json({ error: 'Enter valid latitude and longitude coordinates.' });
      location = { latitude, longitude, name: String(req.query.name || 'Selected location'), admin1: String(req.query.admin1 || ''), country: String(req.query.country || '') };
    } else location = await resolveLocation(req.query.q);
    res.json(await getWeather(location));
  } catch (error) { next(error); }
});
export default router;
