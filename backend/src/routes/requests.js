import { Router } from 'express';
import { allRequests, createRequest, removeRequest, updateRequest } from '../database.js';
const router = Router();
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
function validate(body) {
  const location = String(body.location || '').trim(); const startDate = String(body.startDate || ''); const endDate = String(body.endDate || '');
  if (!location) return 'Location is required.';
  if (!validDate(startDate) || !validDate(endDate)) return 'Enter valid start and end dates.';
  if (endDate < startDate) return 'End date cannot be before start date.';
  if (Math.ceil((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) > 30) return 'Date range cannot exceed 31 days.';
  return null;
}
router.get('/', (_req, res) => res.json({ requests: allRequests() }));
router.post('/', (req, res) => { const error = validate(req.body); if (error) return res.status(400).json({ error }); res.status(201).json({ request: createRequest({ ...req.body, location: req.body.location.trim() }) }); });
router.put('/:id', (req, res) => { const error = validate(req.body); if (error) return res.status(400).json({ error }); const updated = updateRequest(req.params.id, { ...req.body, location: req.body.location.trim() }); if (!updated) return res.status(404).json({ error: 'Saved search not found.' }); res.json({ request: updated }); });
router.delete('/:id', (req, res) => { const exists = allRequests().some(item => item.id === Number(req.params.id)); if (!exists) return res.status(404).json({ error: 'Saved search not found.' }); removeRequest(req.params.id); res.json({ success: true }); });
export default router;
