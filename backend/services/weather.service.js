import axios from 'axios';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

/**
 * Fetch weather forecast for coordinates
 * Falls back to free Open-Meteo API if OpenWeatherMap key is placeholder/missing
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<Object>}
 */
export const getWeatherForecast = async (lat, lon) => {
  const isKeyConfigured = WEATHER_API_KEY && WEATHER_API_KEY !== 'your-weather-api-key';

  try {
    if (isKeyConfigured) {
      // Use OpenWeatherMap
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
      const response = await axios.get(url);
      return {
        source: 'OpenWeatherMap',
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        condition: response.data.weather[0]?.main || 'Clear',
        description: response.data.weather[0]?.description || 'clear sky',
      };
    } else {
      // Fallback: Use free Open-Meteo API (requires no keys)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const response = await axios.get(url);
      const current = response.data.current_weather;
      return {
        source: 'Open-Meteo (Free Fallback)',
        temperature: current.temperature,
        humidity: null, // Open-Meteo current_weather endpoint doesn't include humidity directly
        windSpeed: current.windspeed,
        condition: decodeWmoCode(current.weathercode),
        description: `wmo code ${current.weathercode}`,
      };
    }
  } catch (error) {
    console.error('Weather service request error:', error.message);
    // Hardcoded fallback data in case of complete network error
    return {
      source: 'Mock Fallback (Offline)',
      temperature: 22,
      humidity: 60,
      windSpeed: 3.5,
      condition: 'Cloudy',
      description: 'overcast clouds',
    };
  }
};

// Helper WMO weather codes decoder
function decodeWmoCode(code) {
  if (code === 0) return 'Clear';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}
