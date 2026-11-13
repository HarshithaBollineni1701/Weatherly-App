# Weatherly — Weather Assessment

A responsive weather dashboard built with React, Vite, Express, SQLite (sql.js), and the Open-Meteo APIs.

## Features

- Search for a city or place (including both Bangalore and Bengaluru spellings).
- Current conditions and a five-day forecast.
- Browser geolocation with permission/error handling.
- Compare up to four destinations.
- Google Maps location embed.
- Save, view, edit, and delete location/date-range requests.
- Export saved requests to CSV and JSON.
- SQLite-backed persistence for saved requests.
- Responsive desktop, tablet, and mobile layouts.

## Requirements

- Node.js 20 or newer (Node 18.11+ should also work with `node --watch`).
- npm.
- Internet access for Open-Meteo weather/geocoding and Google Maps embed.

## Run locally

Open two terminals from the project root.

### Terminal 1 — backend

bash
cd backend
npm install
npm run dev

Backend health check: http://localhost:4000/api/health

### Terminal 2 — frontend

bash
cd frontend
npm install
npm run dev

Open http://localhost:5173 in Chrome.

## Notes

- The frontend imports its stylesheet directly in `frontend/src/main.jsx` (`import './styles.css'`).
- Saved requests are stored in `backend/weatherly.sqlite`, created automatically at first run.
- Open-Meteo is used without an API key. Weather data availability depends on the external service.
- Browser GPS requires permission. If permission is denied, city search remains available.
- The date-range records are saved plans/requests; they do not represent archived daily observations.
- Google Maps is embedded using its public search URL; no Google Maps API key is required for this basic embed.

## Project structure

text
weather-rebuild/
├── frontend/
│   ├── src/App.jsx
│   ├── src/main.jsx
│   ├── src/styles.css
│   ├── index.html
│   └── package.json
├── backend/
│   ├── src/database.js
│   ├── src/server.js
│   ├── src/routes/
│   ├── src/services/weatherService.js
│   └── package.json
└── README.md