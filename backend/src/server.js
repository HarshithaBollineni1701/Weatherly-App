import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database.js';
import weatherRoutes from './routes/weather.js';
import requestRoutes from './routes/requests.js';

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Weatherly API' }));
app.use('/api/weather', weatherRoutes);
app.use('/api/requests', requestRoutes);
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: error.message || 'Unexpected server error.' }); });
const port = Number(process.env.PORT || 4000);
initializeDatabase().then(() => app.listen(port, () => console.log(`Weatherly API running at http://localhost:${port}`))).catch(error => { console.error('Could not initialize database:', error); process.exit(1); });
