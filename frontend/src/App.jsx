import { useEffect, useMemo, useState } from 'react';
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun,
  Sun, Search, MapPin, LocateFixed, RefreshCw, CalendarDays, Clock3, Thermometer,
  Wind, Droplets, Eye, Sunrise, Sunset, Plus, Trash2, Pencil, Download, Map,
  LayoutDashboard, Bookmark, GitCompareArrows, X, Check, AlertCircle, LoaderCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const DEFAULT_CITY = { name: 'Bengaluru', admin1: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' };
const weatherMeta = (code = 0) => {
  if (code === 0) return ['Clear sky', Sun];
  if ([1, 2].includes(code)) return ['Partly cloudy', CloudSun];
  if (code === 3) return ['Overcast', Cloud];
  if ([45, 48].includes(code)) return ['Foggy', CloudFog];
  if ([51, 53, 55, 56, 57].includes(code)) return ['Drizzle', CloudDrizzle];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['Rain showers', CloudRain];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ['Snow', CloudSnow];
  if ([95, 96, 99].includes(code)) return ['Thunderstorm', CloudLightning];
  return ['Cloudy', Cloud];
};
const dateLabel = (date, options) => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', options);
const prettyLocation = (loc) => [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function WeatherIcon({ code, size = 28 }) {
  const [label, Icon] = weatherMeta(code);
  return <Icon size={size} strokeWidth={1.7} aria-label={label} />;
}

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState([]);
  const [compare, setCompare] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ location: 'Bengaluru', startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), notes: '' });

  const loadWeather = async (place = DEFAULT_CITY) => {
    setLoading(true); setError(''); setNotice('');
    try {
      const params = new URLSearchParams(typeof place === 'string' ? { q: place } : { latitude: place.latitude, longitude: place.longitude, name: place.name || 'Your location', admin1: place.admin1 || '', country: place.country || '' });
      const data = await api(`/weather?${params}`);
      setWeather(data);
      setQuery(data.location.name);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const loadSaved = async () => {
    try { const data = await api('/requests'); setSaved(data.requests || []); }
    catch (err) { setError(err.message); }
  };

  useEffect(() => { loadWeather(); loadSaved(); }, []);

  const search = (event) => { event?.preventDefault(); if (query.trim()) loadWeather(query.trim()); };
  const useMyLocation = () => {
    setError('');
    if (!navigator.geolocation) { setError('Your browser does not support location access.'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => loadWeather({ latitude: coords.latitude, longitude: coords.longitude, name: 'Your location' }),
      (err) => { setLoading(false); setError(err.code === 1 ? 'Location permission was denied. Allow location access in your browser settings.' : 'Could not detect your location. Please search for a city instead.'); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const openNewRequest = () => { setEditing(null); setForm({ location: weather?.location?.name || 'Bengaluru', startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), notes: '' }); setModal(true); };
  const saveRequest = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form };
      if (editing) await api(`/requests/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api('/requests', { method: 'POST', body: JSON.stringify(payload) });
      setModal(false); setNotice(editing ? 'Saved search updated.' : 'Search saved successfully.'); await loadSaved();
    } catch (err) { setError(err.message); }
  };
  const editRequest = (item) => { setEditing(item); setForm({ location: item.location, startDate: item.startDate, endDate: item.endDate, notes: item.notes || '' }); setModal(true); };
  const deleteRequest = async (id) => { if (!window.confirm('Delete this saved search?')) return; try { await api(`/requests/${id}`, { method: 'DELETE' }); await loadSaved(); setNotice('Saved search deleted.'); } catch (err) { setError(err.message); } };

  const exportRecords = (format) => {
    const rows = saved;
    const content = format === 'json' ? JSON.stringify(rows, null, 2) : [ ['Location', 'Start date', 'End date', 'Notes'], ...rows.map(r => [r.location, r.startDate, r.endDate, r.notes || '']) ].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `weather-searches.${format}`; a.click(); URL.revokeObjectURL(url);
  };

  const toggleCompare = (loc) => setCompare(current => current.some(x => x.name === loc.name) ? current.filter(x => x.name !== loc.name) : current.length >= 4 ? current : [...current, loc]);
  const comparison = useMemo(() => compare, [compare]);
  const current = weather?.current;
  const daily = weather?.daily || [];
  const [condition] = weatherMeta(current?.weatherCode);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><CloudSun size={24}/></div><div><strong>weatherly</strong><span>WEATHER WORKSPACE</span></div></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="nav-list">
        <button className={activeTab === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('overview')}><LayoutDashboard size={18}/> Weather overview</button>
        <button className={activeTab === 'saved' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveTab('saved'); loadSaved(); }}><Bookmark size={18}/> Saved searches <span className="nav-count">{saved.length}</span></button>
        <button className={activeTab === 'compare' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('compare')}><GitCompareArrows size={18}/> Compare destinations</button>
      </nav>
      <div className="sidebar-bottom"><div className="profile-avatar">H</div><div className="profile-copy"><strong>Harshitha</strong><span>Weather App Project</span></div><span className="online-dot"/></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">PM Accelerator <span>/</span> Weather workspace</div><div className="topbar-right"><span className="live-indicator"><i/> Live weather data</span><span className="date-pill"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div></header>
      <div className="page-wrap">
        <section className="welcome-row"><div><div className="eyebrow">WEATHER INTELLIGENCE</div><h1>{activeTab === 'overview' ? 'Weather overview' : activeTab === 'saved' ? 'Saved searches' : 'Compare destinations'}</h1><p>{activeTab === 'overview' ? 'A clearer view of the weather, wherever your day takes you.' : activeTab === 'saved' ? 'Your saved locations and date-range plans, all in one place.' : 'Compare conditions across the places you are considering.'}</p></div><div className="welcome-sun"><Sun size={32}/></div></section>

        {error && <div className="alert error-alert"><AlertCircle size={18}/><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={16}/></button></div>}
        {notice && <div className="alert success-alert"><Check size={18}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}

        {activeTab === 'overview' && <>
          <section className="search-panel"><div className="search-copy"><span className="section-kicker">FIND A PLACE</span><h2>Where to next?</h2><p>Search a city or use your current location.</p></div><form className="search-form" onSubmit={search}><div className="search-input-wrap"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search city, e.g. Bengaluru" aria-label="Search city"/><button type="button" className="clear-search" onClick={() => setQuery('')} aria-label="Clear search"><X size={16}/></button></div><button className="btn-primary" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17}/> : <Search size={17}/>} Search</button><button className="btn-secondary" type="button" onClick={useMyLocation} disabled={loading}><LocateFixed size={17}/> Use my location</button></form></section>
          {loading && <div className="loading-line"><LoaderCircle className="spin" size={18}/> Loading weather data…</div>}
          {weather && current && <>
            <section className="weather-grid"><article className="current-card"><div className="card-topline"><span className="section-kicker light">CURRENT CONDITIONS</span><button className="icon-button light-button" onClick={() => loadWeather({ latitude: weather.location.latitude, longitude: weather.location.longitude, name: weather.location.name, admin1: weather.location.admin1, country: weather.location.country })} aria-label="Refresh weather"><RefreshCw size={17}/></button></div><div className="location-line"><MapPin size={17}/><span>{prettyLocation(weather.location)}</span></div><div className="current-main"><div><div className="temperature">{Math.round(current.temperature)}<sup>°C</sup></div><div className="condition-name">{condition}</div><div className="feels">Feels like {Math.round(current.apparentTemperature)}°C</div></div><div className="hero-weather-icon"><WeatherIcon code={current.weatherCode} size={88}/></div></div><div className="current-divider"/><div className="current-footer"><span><Clock3 size={15}/> Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span><span>{weather.location.timezone || 'Local time'}</span></div></article>
            <article className="highlow-card"><div className="section-kicker">TODAY'S OUTLOOK</div><h3>Plan your day</h3><div className="highlow-values"><div><span>HIGH</span><strong>{Math.round(daily[0]?.max ?? current.temperature)}°</strong></div><div className="highlow-separator"/><div><span>LOW</span><strong>{Math.round(daily[0]?.min ?? current.temperature)}°</strong></div></div><div className="metric-list"><div><span><Wind size={17}/> Wind</span><strong>{Math.round(current.windSpeed)} km/h</strong></div><div><span><Droplets size={17}/> Humidity</span><strong>{current.humidity}%</strong></div><div><span><Thermometer size={17}/> Feels like</span><strong>{Math.round(current.apparentTemperature)}°C</strong></div></div></article></section>
            <section className="section-block"><div className="section-heading"><div><span className="section-kicker">COMING UP</span><h2>5-day forecast</h2></div><span className="muted-note">Daily conditions</span></div><div className="forecast-grid">{daily.slice(0, 5).map((day, i) => { const [label] = weatherMeta(day.weatherCode); return <article className={`forecast-card ${i === 0 ? 'today' : ''}`} key={day.date}><span className="forecast-day">{i === 0 ? 'Today' : dateLabel(day.date, { weekday: 'short' })}</span><span className="forecast-date">{dateLabel(day.date, { day: 'numeric', month: 'short' })}</span><div className="forecast-icon"><WeatherIcon code={day.weatherCode} size={31}/></div><span className="forecast-condition">{label}</span><div className="forecast-temps"><strong>{Math.round(day.max)}°</strong><span>{Math.round(day.min)}°</span></div></article>; })}</div></section>
            <section className="bottom-grid"><article className="map-card"><div className="section-heading compact"><div><span className="section-kicker">EXPLORE AREA</span><h2>Location map</h2></div><Map size={19}/></div><iframe title="Location map" loading="lazy" src={`https://www.google.com/maps?q=${weather.location.latitude},${weather.location.longitude}&z=11&output=embed`} referrerPolicy="no-referrer-when-downgrade"/></article><article className="save-card"><div className="save-icon"><Bookmark size={20}/></div><span className="section-kicker">KEEP IT HANDY</span><h2>Save this search</h2><p>Keep a location and date range together for your next trip or weather check.</p><button className="btn-primary full-btn" onClick={openNewRequest}><Plus size={17}/> Save location & dates</button></article></section>
          </>}
          {!weather && !loading && !error && <div className="empty-state">Search for a city to see current weather and the five-day forecast.</div>}
        </>}

        {activeTab === 'saved' && <section className="content-card"><div className="section-heading"><div><span className="section-kicker">YOUR COLLECTION</span><h2>Saved weather searches</h2></div><div className="button-row"><button className="btn-secondary" onClick={() => exportRecords('csv')} disabled={!saved.length}><Download size={16}/> CSV</button><button className="btn-secondary" onClick={() => exportRecords('json')} disabled={!saved.length}><Download size={16}/> JSON</button><button className="btn-primary" onClick={openNewRequest}><Plus size={17}/> New search</button></div></div>{saved.length ? <div className="saved-list">{saved.map(item => <article className="saved-item" key={item.id}><div className="saved-place-icon"><MapPin size={20}/></div><div className="saved-details"><strong>{item.location}</strong><span>{dateLabel(item.startDate, { day: 'numeric', month: 'short', year: 'numeric' })} – {dateLabel(item.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>{item.notes && <p>{item.notes}</p>}</div><div className="saved-actions"><button className="icon-button" onClick={() => editRequest(item)} aria-label="Edit saved search"><Pencil size={17}/></button><button className="icon-button danger" onClick={() => deleteRequest(item.id)} aria-label="Delete saved search"><Trash2 size={17}/></button></div></article>)}</div> : <div className="empty-state"><Bookmark size={28}/><strong>No saved searches yet</strong><span>Save a city and date range from the weather overview.</span><button className="btn-primary" onClick={openNewRequest}><Plus size={17}/> Create saved search</button></div>}</section>}

        {activeTab === 'compare' && <section className="content-card"><div className="section-heading"><div><span className="section-kicker">DESTINATION PLANNER</span><h2>Compare destinations</h2><p className="subtext">Add up to four destinations to compare their current conditions.</p></div><button className="btn-secondary" onClick={() => setCompare([])} disabled={!compare.length}><X size={16}/> Clear all</button></div><form className="compare-add" onSubmit={async e => { e.preventDefault(); const value = e.currentTarget.elements.city.value.trim(); if (!value) return; try { const data = await api(`/weather?q=${encodeURIComponent(value)}`); toggleCompare(data.location); e.currentTarget.reset(); } catch (err) { setError(err.message); } }}><div className="search-input-wrap"><Search size={18}/><input name="city" placeholder="Add a city, e.g. Chennai" aria-label="Add destination"/></div><button className="btn-primary" type="submit"><Plus size={17}/> Add destination</button></form>{comparison.length ? <div className="compare-grid">{comparison.map(loc => <CompareCard key={loc.name} location={loc} onRemove={() => toggleCompare(loc)}/>)}</div> : <div className="empty-state"><GitCompareArrows size={28}/><strong>No destinations selected</strong><span>Add cities above to compare current weather.</span></div>}</section>}
        <footer className="footer-note">Built for the PM Accelerator technical assessment <span>•</span> Weather data by Open-Meteo</footer>
      </div>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><form className="modal" onSubmit={saveRequest}><div className="modal-head"><div><span className="section-kicker">WEATHER PLANNER</span><h2>{editing ? 'Edit saved search' : 'Save a weather search'}</h2></div><button type="button" className="icon-button" onClick={() => setModal(false)} aria-label="Close"><X size={19}/></button></div><label>Location<input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bengaluru"/></label><div className="form-dates"><label>Start date<input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}/></label><label>End date<input required type="date" min={form.startDate} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}/></label></div><label>Notes <span className="optional">(optional)</span><textarea rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Add a note for this plan…"/></label><div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" type="submit"><Check size={17}/>{editing ? 'Update search' : 'Save search'}</button></div></form></div>}
  </div>;
}

function CompareCard({ location, onRemove }) {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, name: location.name, admin1: location.admin1 || '', country: location.country || '' }); fetch(`${API}/weather?${params}`).then(r => r.json()).then(d => { if (!d.current) throw new Error(d.error || 'Weather unavailable'); setData(d); }).catch(e => setError(e.message)); }, [location]);
  return <article className="compare-card"><div className="compare-card-top"><div><span className="section-kicker">DESTINATION</span><h3>{location.name}</h3><span className="compare-region">{[location.admin1, location.country].filter(Boolean).join(', ')}</span></div><button className="icon-button danger" onClick={onRemove} aria-label={`Remove ${location.name}`}><X size={18}/></button></div>{data ? <><div className="compare-weather"><WeatherIcon code={data.current.weatherCode} size={43}/><strong>{Math.round(data.current.temperature)}°C</strong></div><p>{weatherMeta(data.current.weatherCode)[0]}</p><div className="compare-stats"><span><Wind size={15}/> {Math.round(data.current.windSpeed)} km/h</span><span><Droplets size={15}/> {data.current.humidity}%</span></div></> : <div className="compare-loading">{error || 'Loading weather…'}</div>}</article>;
}

export default App;
