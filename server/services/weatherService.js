const axios = require('axios');
const { config } = require('../config/env');

// In-memory cache object storing weather queries for ~10 minutes (600,000 ms)
const weatherCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Weather Service for Tamil Nadu farmers using OpenWeather API
 */
class WeatherService {
  constructor() {
    this.apiKey = config.weather.apiKey;
    this.isConnected = false;
  }

  /**
   * Validate the API key using the official OpenWeather Current Weather API
   */
  async verifyConnection() {
    if (!this.apiKey) {
      this.isConnected = false;
      return false;
    }
    try {
      const testUrl = `http://api.openweathermap.org/data/2.5/weather?q=Chennai,IN&appid=${this.apiKey}`;
      const response = await axios.get(testUrl, { timeout: 5000 });
      if (response.status === 200) {
        this.isConnected = true;
        return true;
      }
    } catch (error) {
      console.error('⚠️ [OpenWeather Validation Error]:', error.response?.data?.message || error.message);
      this.isConnected = false;
      return false;
    }
    this.isConnected = false;
    return false;
  }

  /**
 * Normalize raw OpenWeather response into standardized clean structure
 */
  normalizeWeatherData(weather, forecastList = [], locationMeta = {}) {
    const indiaTimeOptions = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const indiaTimeWithSecondsOptions = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };

    const indiaDateOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    return {
      placeName: locationMeta.name || weather.name || 'Salem',
      districtOrState: locationMeta.state || 'Tamil Nadu',
      country: locationMeta.country || weather.sys?.country || 'IN',

      latitude:
        weather.coord?.lat ??
        locationMeta.lat ??
        11.6643,

      longitude:
        weather.coord?.lon ??
        locationMeta.lon ??
        78.146,

      currentTemperatureCelsius: Math.round(
        weather.main?.temp ?? 29
      ),

      feelsLikeTemperature: Math.round(
        weather.main?.feels_like ?? 32
      ),

      minimumTemperature: Math.round(
        weather.main?.temp_min ?? 26
      ),

      maximumTemperature: Math.round(
        weather.main?.temp_max ?? 34
      ),

      weatherCondition:
        weather.weather?.[0]?.main || 'Clouds',

      weatherDescription:
        weather.weather?.[0]?.description || 'scattered clouds',

      weatherIcon: `https://openweathermap.org/img/wn/${weather.weather?.[0]?.icon || '02d'
        }@2x.png`,

      humidity:
        weather.main?.humidity ?? 68,

      windSpeed: Math.round(
        (weather.wind?.speed ?? 3.5) * 3.6
      ),

      atmosphericPressure:
        weather.main?.pressure ?? 1012,

      visibilityKm: Math.round(
        (weather.visibility ?? 10000) / 1000
      ),

      sunriseTime: weather.sys?.sunrise
        ? new Date(
          weather.sys.sunrise * 1000
        ).toLocaleTimeString(
          'en-IN',
          indiaTimeOptions
        )
        : '06:12 AM',

      sunsetTime: weather.sys?.sunset
        ? new Date(
          weather.sys.sunset * 1000
        ).toLocaleTimeString(
          'en-IN',
          indiaTimeOptions
        )
        : '06:34 PM',

      lastUpdatedTime: new Date().toLocaleTimeString(
        'en-IN',
        indiaTimeWithSecondsOptions
      ),

      isLiveWeather: Boolean(this.apiKey),

      forecastList: forecastList
        .slice(0, 8)
        .map((item) => ({
          time: new Date(
            item.dt * 1000
          ).toLocaleTimeString(
            'en-IN',
            indiaTimeOptions
          ),

          date: new Date(
            item.dt * 1000
          ).toLocaleDateString(
            'en-IN',
            indiaDateOptions
          ),

          temperatureCelsius: Math.round(
            item.main?.temp ?? 29
          ),

          condition:
            item.weather?.[0]?.main || 'Clouds',

          icon: `https://openweathermap.org/img/wn/${item.weather?.[0]?.icon || '02d'
            }@2x.png`
        }))
    };
  }

  /**
   * Get weather by location place name, prioritizing Tamil Nadu, India
   */
  async getWeatherByPlace(place = 'Salem') {
    const cacheKey = `place_${place.toLowerCase().trim()}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return { success: true, fromCache: true, data: cached.data };
    }

    if (!this.apiKey) {
      return {
        success: true,
        isLiveWeather: false,
        notice: 'OpenWeather API is not configured. Displaying simulated regional weather preview.',
        data: this.getFallbackWeather(place)
      };
    }

    try {
      // Step 1: Geocode location preferring Tamil Nadu / India results
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(place)},IN&limit=5&appid=${this.apiKey}`;
      const geoResp = await axios.get(geoUrl, { timeout: 6000 });
      let locationMeta = {};

      if (geoResp.data && geoResp.data.length > 0) {
        // Prioritize result located in Tamil Nadu state
        const tnMatch = geoResp.data.find(l => l.state && l.state.toLowerCase().includes('tamil'));
        locationMeta = tnMatch || geoResp.data[0];
      } else {
        // Fallback geocode without IN restriction if local name not directly indexed
        const globalGeoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(place)}&limit=1&appid=${this.apiKey}`;
        const globalResp = await axios.get(globalGeoUrl, { timeout: 5000 });
        if (globalResp.data && globalResp.data.length > 0) {
          locationMeta = globalResp.data[0];
        } else {
          throw new Error('Requested place or district could not be found in geocoding service.');
        }
      }

      const { lat, lon } = locationMeta;
      return await this.getWeatherByCoordinates(lat, lon, locationMeta, cacheKey);

    } catch (error) {
      console.error(`⚠️ [Weather API Error for ${place}]:`, error.message);
      return {
        success: true,
        isLiveWeather: false,
        notice: `Could not fetch live weather (${error.message}). Displaying recent baseline forecast.`,
        data: this.getFallbackWeather(place)
      };
    }
  }

  /**
   * Get weather directly by Latitude and Longitude coordinates
   */
  async getWeatherByCoordinates(lat, lon, locationMeta = {}, customCacheKey = null) {
    const cacheKey = customCacheKey || `coords_${Number(lat).toFixed(3)}_${Number(lon).toFixed(3)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return { success: true, fromCache: true, data: cached.data };
    }

    if (!this.apiKey) {
      return {
        success: true,
        isLiveWeather: false,
        notice: 'OpenWeather API is not configured. Displaying simulated coordinate weather preview.',
        data: this.getFallbackWeather(locationMeta.name || 'Current Location')
      };
    }

    try {
      const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
      const forecastUrl = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;

      const [weatherResp, forecastResp] = await Promise.all([
        axios.get(weatherUrl, { timeout: 6000 }),
        axios.get(forecastUrl, { timeout: 6000 }).catch(() => ({ data: { list: [] } }))
      ]);

      const normalizedData = this.normalizeWeatherData(
        weatherResp.data,
        forecastResp.data?.list || [],
        locationMeta
      );

      // Cache normalized outcome for 10 minutes
      weatherCache.set(cacheKey, { timestamp: Date.now(), data: normalizedData });

      return { success: true, fromCache: false, isLiveWeather: true, data: normalizedData };

    } catch (error) {
      console.error(`⚠️ [Weather Coordinate Query Error]:`, error.message);
      return {
        success: true,
        isLiveWeather: false,
        notice: `Coordinate query failed (${error.message}). Returning estimated regional forecast.`,
        data: this.getFallbackWeather(locationMeta.name || 'Salem, Tamil Nadu')
      };
    }
  }

  /**
   * Regional weather fallback without claiming live accuracy
   */
  getFallbackWeather(placeName = 'Salem') {
    return {
      placeName: placeName,
      districtOrState: 'Tamil Nadu',
      country: 'IN',
      latitude: 11.6643,
      longitude: 78.146,
      currentTemperatureCelsius: 29,
      feelsLikeTemperature: 32,
      minimumTemperature: 25,
      maximumTemperature: 34,
      weatherCondition: 'Clouds',
      weatherDescription: 'scattered clouds (demo preview)',
      weatherIcon: 'https://openweathermap.org/img/wn/02d@2x.png',
      humidity: 70,
      windSpeed: 14, // km/h
      atmosphericPressure: 1011,
      visibilityKm: 10,
      sunriseTime: '06:10 AM',
      sunsetTime: '06:36 PM',
      lastUpdatedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Offline Preview)',
      isLiveWeather: false,
      forecastList: [
        { time: '12:00 PM', date: 'Today', temperatureCelsius: 31, condition: 'Clear', icon: 'https://openweathermap.org/img/wn/01d@2x.png' },
        { time: '03:00 PM', date: 'Today', temperatureCelsius: 33, condition: 'Clouds', icon: 'https://openweathermap.org/img/wn/02d@2x.png' },
        { time: '06:00 PM', date: 'Today', temperatureCelsius: 28, condition: 'Rain', icon: 'https://openweathermap.org/img/wn/10d@2x.png' },
        { time: '09:00 PM', date: 'Today', temperatureCelsius: 26, condition: 'Clouds', icon: 'https://openweathermap.org/img/wn/03n@2x.png' }
      ]
    };
  }
}

module.exports = new WeatherService();
