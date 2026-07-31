import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CloudRain, Search, Wind, Droplets, Sun, Compass, MapPin, RefreshCw, AlertTriangle, Eye, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';
import api from '../services/api';

const Weather = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('Salem');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [recentSearches, setRecentSearches] = useState(['Salem', 'Thanjavur', 'Coimbatore']);

  const tnCities = [
    'Salem', 'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 
    'Thanjavur', 'Erode', 'Tirunelveli', 'Vellore', 'Namakkal', 
    'Dharmapuri', 'Tiruppur'
  ];

  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem('recent_tn_weather_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) {
      console.warn('Could not load recent searches:', e);
    }
  };

  const saveRecentSearch = (city) => {
    if (!city) return;
    const cleaned = city.trim();
    const updated = [cleaned, ...recentSearches.filter(s => s.toLowerCase() !== cleaned.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('recent_tn_weather_searches', JSON.stringify(updated));
    } catch (e) {}
  };

  const fetchWeatherByCity = async (cityName = 'Salem') => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const resp = await api.get(`/weather/search?place=${encodeURIComponent(cityName)}`);
      if (resp.data && resp.data.success) {
        setWeatherData(resp.data.data);
        if (resp.data.notice) setNotice(resp.data.notice);
        saveRecentSearch(resp.data.data?.placeName || cityName);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to query regional weather forecast.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeatherByCity(searchQuery.trim());
    }
  };

  const handleCityClick = (cityName) => {
    setSearchQuery(cityName);
    fetchWeatherByCity(cityName);
  };

  // Detect farmer coordinates via native GPS geolocation
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('GPS Geo-location is not supported by your current browser.');
      return;
    }

    setLocLoading(true);
    setError('');
    setNotice('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const resp = await api.get(`/weather/coordinates?lat=${latitude}&lon=${longitude}`);
          if (resp.data && resp.data.success) {
            setWeatherData(resp.data.data);
            setSearchQuery(resp.data.data?.placeName || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            if (resp.data.notice) setNotice(resp.data.notice);
          }
        } catch (err) {
          setError(err.userMessage || 'Could not fetch weather for your GPS coordinates.');
        } finally {
          setLocLoading(false);
        }
      },
      (geoErr) => {
        setLocLoading(false);
        setError('Location permission denied or GPS unavailable. Using district name search instead.');
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    loadRecentSearches();
    fetchWeatherByCity('Salem');
  }, []);

  return (
    <div className="main-content" style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="dash-card-icon" style={{ marginBottom: 0 }}>
          <CloudRain size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#064e3b', marginBottom: '0.25rem' }}>{t('weather')}</h1>
          <p style={{ color: '#64748b' }}>Localized OpenWeather district tracking and 10-minute caching for Tamil Nadu farmers.</p>
        </div>
      </div>

      {/* Quick City Selection Pills */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', tracking: '0.5px', marginBottom: '0.6rem' }}>
          🌿 Quick Tamil Nadu District Selection:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tnCities.map((city) => (
            <button
              key={city}
              onClick={() => handleCityClick(city)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                border: weatherData?.placeName?.toLowerCase() === city.toLowerCase() ? '1.5px solid #059669' : '1px solid #cbd5e1',
                backgroundColor: weatherData?.placeName?.toLowerCase() === city.toLowerCase() ? '#dcfce7' : '#ffffff',
                color: weatherData?.placeName?.toLowerCase() === city.toLowerCase() ? '#065f46' : '#334155',
                fontWeight: weatherData?.placeName?.toLowerCase() === city.toLowerCase() ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar & Geolocation Controls */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <input 
            type="text"
            className="form-input"
            placeholder="Search Tamil Nadu Town, Village or District (e.g., Thanjavur, Pollachi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '1rem', border: '1px solid #cbd5e1' }}
          />
        </div>
        <button type="submit" disabled={loading || locLoading} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 1 auto' }}>
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
          <span>{loading ? 'Searching...' : 'Check Weather'}</span>
        </button>

        <button 
          type="button"
          onClick={handleCurrentLocation}
          disabled={loading || locLoading}
          className="btn btn-outline"
          style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 1 auto', backgroundColor: '#f1f5f9' }}
          title="Use GPS Coordinates"
        >
          {locLoading ? <RefreshCw size={18} className="animate-spin" /> : <MapPin size={18} color="#2563eb" />}
          <span>{locLoading ? 'Locating GPS...' : '📍 Use Current Coordinates'}</span>
        </button>
      </form>

      {/* Alert Notices */}
      {error && (
        <div style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
          <AlertTriangle size={22} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.92rem', fontWeight: 500 }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, color: '#f59e0b' }} />
          <span>{notice}</span>
        </div>
      )}

      {/* Weather Dashboard Card */}
      {weatherData ? (
        <div>
          <div className="card" style={{ marginBottom: '2.5rem', background: 'linear-gradient(135deg, #064e3b, #047857)', color: 'white', padding: '2.25rem', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    backgroundColor: weatherData.isLiveWeather ? '#dcfce7' : '#fef3c7', 
                    color: weatherData.isLiveWeather ? '#065f46' : '#92400e', 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    {weatherData.isLiveWeather ? (
                      <>
                        <CheckCircle size={14} /> Live OpenWeather Feed (10-Min Cache)
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} /> Simulated Demo Preview (API Key Not Addded)
                      </>
                    )}
                  </span>

                  <span style={{ color: '#a7f3d0', fontSize: '0.85rem' }}>
                    Lat: {Number(weatherData.latitude).toFixed(2)}° | Lon: {Number(weatherData.longitude).toFixed(2)}°
                  </span>
                </div>

                <h2 style={{ fontSize: '2.75rem', color: 'white', marginTop: '1rem', marginBottom: '0.25rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                  {weatherData.placeName}, {weatherData.districtOrState}
                </h2>
                <p style={{ fontSize: '1.25rem', color: '#a7f3d0', margin: 0, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{weatherData.weatherDescription}</span>
                </p>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {weatherData.weatherIcon && (
                    <img src={weatherData.weatherIcon} alt="Weather icon" style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
                  )}
                  <div style={{ fontSize: '4.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                    {weatherData.currentTemperatureCelsius}°C
                  </div>
                </div>

                <p style={{ color: '#d1fae5', margin: '0.5rem 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 500 }}>
                  Feels like: <strong>{weatherData.feelsLikeTemperature}°C</strong>
                </p>
                <div style={{ display: 'flex', gap: '0.85rem', color: '#a7f3d0', fontSize: '0.9rem', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowDown size={14} /> Min: {weatherData.minimumTemperature}°C
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowUp size={14} /> Max: {weatherData.maximumTemperature}°C
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#6ee7b7', marginTop: '0.5rem' }}>
                  Updated: {weatherData.lastUpdatedTime}
                </span>
              </div>
            </div>

            {/* Environmental Agricultural Parameter Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px' }}>
                <Droplets size={32} color="#6ee7b7" />
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 600 }}>Relative Humidity</div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{weatherData.humidity}%</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px' }}>
                <Wind size={32} color="#6ee7b7" />
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 600 }}>Wind Velocity</div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{weatherData.windSpeed} km/h</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px' }}>
                <Compass size={32} color="#6ee7b7" />
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 600 }}>Air Pressure</div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{weatherData.atmosphericPressure} hPa</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px' }}>
                <Eye size={32} color="#6ee7b7" />
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 600 }}>Visibility Range</div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{weatherData.visibilityKm || 10} km</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px', gridColumn: 'span 2 / auto' }}>
                <Sun size={32} color="#fde047" />
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 600 }}>Solar Cycle (Sunrise & Sunset)</div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span>🌅 {weatherData.sunriseTime}</span>
                    <span>🌇 {weatherData.sunsetTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Grid */}
          <h3 style={{ fontSize: '1.6rem', color: '#064e3b', marginBottom: '1.25rem', fontWeight: 700 }}>
            🌾 Upcoming Agricultural Forecast Trends
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {(weatherData.forecastList || []).map((fc, index) => (
              <div key={index} className="card" style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ffffff', transition: 'transform 0.15s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{fc.time || fc.day || 'Later'}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{fc.date || 'Today'}</span>
                </div>

                <div style={{ margin: '0.75rem 0' }}>
                  {fc.icon ? (
                    <img src={fc.icon} alt={fc.condition} style={{ width: '64px', height: '64px', margin: '0 auto' }} />
                  ) : (
                    <CloudRain size={40} color="#059669" style={{ margin: '0.5rem auto' }} />
                  )}
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#064e3b', margin: '0.25rem 0' }}>
                    {fc.temperatureCelsius || fc.temp || '30°C'}{typeof fc.temperatureCelsius === 'number' ? '°C' : ''}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', fontWeight: 600, color: '#047857', fontSize: '0.9rem' }}>
                  {fc.condition || 'Scattered Clouds'}
                </div>
              </div>
            ))}
          </div>

          {/* Farmer Advisory Note based on humidity/temp */}
          <div style={{ marginTop: '2.5rem', padding: '1.5rem', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #6ee7b7', color: '#065f46' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🚜 Farmer Micro-Climate Advisory
            </h4>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
              {weatherData.humidity > 75 ? (
                <span>High relative humidity ({weatherData.humidity}%) recorded. Fungal disease incidence in tomatoes and banana groves may increase. Avoid overhead spray irrigation and ensure clean ground drainage in your fields.</span>
              ) : weatherData.currentTemperatureCelsius > 35 ? (
                <span>High regional thermal stress ({weatherData.currentTemperatureCelsius}°C). Schedule crop irrigation strictly during early morning (5:30 AM - 7:30 AM) or late evening hours to prevent rapid topsoil transpiration loss.</span>
              ) : (
                <span>Favorable agricultural growing conditions across {weatherData.placeName}. Excellent weather window for fertilizer dressing and intercultural farm operations.</span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <CloudRain size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
          <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Querying regional agricultural weather...</p>
        </div>
      )}

      {/* Recent searches history footer */}
      {recentSearches && recentSearches.length > 0 && (
        <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>Recent Farmers' Locations:</span>
          {recentSearches.map((rec, i) => (
            <button
              key={i}
              onClick={() => handleCityClick(rec)}
              style={{ background: 'transparent', border: 'none', color: '#059669', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              📍 {rec}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Weather;
