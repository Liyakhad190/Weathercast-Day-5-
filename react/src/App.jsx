import { useEffect, useState } from "react";
import "./App.css";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function getCountryName(countryCode) {
  if (!countryCode) {
    return "";
  }
  return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) || countryCode;
}

function getAbsoluteHumidity(temperature, relativeHumidity) {
  const vaporPressure =
    (relativeHumidity / 100) *
    6.112 *
    Math.exp((17.67 * temperature) / (temperature + 243.5));

  return Number(
    (
      (216.74 * vaporPressure) / (temperature + 273.15)
    ).toFixed(1)
  );
}

const FINNISH_CITIES = [
  "Helsinki",
  "Espoo",
  "Tampere",
  "Vantaa",
  "Oulu",
  "Turku",
  "Jyväskylä",
  "Kuopio",
  "Lahti",
  "Pori",
  "Kouvola",
  "Joensuu",
  "Lappeenranta",
  "Hämeenlinna",
  "Vaasa",
  "Seinäjoki",
  "Rovaniemi",
  "Mikkeli",
  "Salo",
  "Kotka",
  "Porvoo",
  "Kokkola",
  "Hyvinkää",
  "Järvenpää",
  "Rauma",
];

function WeatherApp() {
  const [weatherData, setWeatherData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("Chennai");
  const [selectedLocation, setSelectedLocation] = useState({
    name: "Chennai",
    country: "IN",
    lat: 13.0827,
    lon: 80.2707,
  });
  const [locations, setLocations] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        if (!apiKey) {
          throw new Error("Weather API key is not configured");
        }

        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}&appid=${apiKey}&units=metric`,
          { signal: controller.signal }
        );

        const weather = await weatherResponse.json();
        if (!weatherResponse.ok) {
          throw new Error(weather.message || "Failed to fetch weather data");
        }

        const temperature = weather.main.temp;
        setWeatherData({
          name: selectedLocation.name,
          country: selectedLocation.country,
          temperature: Math.round(temperature),
          absoluteHumidity: getAbsoluteHumidity(temperature, weather.main.humidity),
          apparentTemperature: Math.round(weather.main.feels_like),
          windSpeed: weather.wind?.speed,
          pressure: weather.main.pressure,
          condition: weather.weather?.[0]?.description,
          icon: weather.weather?.[0]?.icon,
        });
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }
        setError(fetchError.message);
        setWeatherData(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchWeatherData();

    return () => {
      controller.abort();
    };
  }, [selectedLocation]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      return;
    }

    setLocations([]);
    setSearchError(null);
    setIsSearching(true);

    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) {
        throw new Error("Weather API key is not configured");
      }

      if (query.toLowerCase() === "finland") {
        setLocations(
          FINNISH_CITIES.map((name) => ({
            name,
            country: "FI",
            countryName: "Finland",
          }))
        );
        return;
      }

      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`
      );
      const results = await response.json();
      if (!response.ok) {
        throw new Error(results.message || "Could not search for that location");
      }
      if (!results.length) {
        throw new Error("No matching locations found. Try a city and country.");
      }

      setLocations(results);
    } catch (searchFailure) {
      setSearchError(searchFailure.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = async (location) => {
    setLocations([]);
    setSearchError(null);
    let resolvedLocation = location;

    if (typeof location.lat !== "number" || typeof location.lon !== "number") {
      setIsSearching(true);
      try {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(`${location.name},${location.country}`)}&limit=1&appid=${apiKey}`
        );
        const results = await response.json();
        if (!response.ok) {
          throw new Error(results.message || "Could not find that city");
        }
        if (!results.length) {
          throw new Error(`Could not find ${location.name} in ${location.countryName}.`);
        }
        resolvedLocation = results[0];
      } catch (locationFailure) {
        setSearchError(locationFailure.message);
        setIsSearching(false);
        return;
      }
      setIsSearching(false);
    }

    setSearchTerm(`${resolvedLocation.name}, ${resolvedLocation.country}`);
    setWeatherData(null);
    setLoading(true);
    setError(null);
    setSelectedLocation(resolvedLocation);
  };

  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="weather-app">
      <header className="topbar">
        <a className="brand" href="#" aria-label="WeatherForecast home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M8.2 21.8h14.2a5.2 5.2 0 0 0 .4-10.4 7.1 7.1 0 0 0-13.6 1.1 4.7 4.7 0 0 0-1 9.3Z" />
              <path d="M12 25.2h9M15 28h6" />
            </svg>
          </span>
          <span>WeatherForecast<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-note">
          <span className="live-dot" />
          <span>YOUR DAILY WEATHER</span>
        </div>
      </header>

      <main className="dashboard">
        <section className="welcome-row">
          <div className="welcome-copy">
            <p className="eyebrow">A LITTLE MORE IN TUNE</p>
            <h1>Weather for<br /><em>where you are.</em></h1>
            <p className="welcome-description">
              A clear view of today, so you can make the most of it.
            </p>
          </div>
          <form className="search-form" onSubmit={handleSearch} role="search">
            <label htmlFor="city-search">Find a place</label>
            <div className="search-control">
              <SearchIcon />
              <input
                id="city-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search city"
                autoComplete="off"
              />
              <button type="submit" disabled={!searchTerm.trim() || isSearching}>
                {isSearching ? "Searching…" : "Search"}
              </button>
            </div>
            {locations.length > 0 && (
              <div className="search-results" aria-label="Choose a location">
                <p className="results-heading">
                  {locations.length} {locations.length === 1 ? "LOCATION" : "LOCATIONS"} FOUND
                </p>
                {locations.map((location, index) => (
                  <button
                    className="location-result"
                    key={`${location.lat ?? location.name}-${location.lon ?? index}`}
                    type="button"
                    onClick={() => handleLocationSelect(location)}
                  >
                    <span>{location.name}</span>
                    <small>
                      {[location.state, location.countryName || getCountryName(location.country)]
                        .filter(Boolean)
                        .join(", ")}
                    </small>
                  </button>
                ))}
              </div>
            )}
            {searchError && (
              <p className="search-error" role="alert">{searchError}</p>
            )}
          </form>
        </section>

        <section className="weather-card" aria-live="polite">
          <div className="weather-card-top">
            <div>
              <p className="card-kicker">CURRENT CONDITIONS</p>
              <p className="weather-date">{today}</p>
            </div>
            <span className="location-pill">
              <span className="location-pin" aria-hidden="true">⌖</span>
              {weatherData
                ? `${weatherData.name}${weatherData.country ? `, ${getCountryName(weatherData.country)}` : ""}`
                : `${selectedLocation.name}, ${getCountryName(selectedLocation.country)}`}
            </span>
          </div>

          {loading && (
            <div className="status-message" role="status">
              <span className="loading-spinner" />
              <span>Finding your forecast…</span>
            </div>
          )}

          {!loading && error && (
            <div className="status-message error-message" role="alert">
              <span className="error-mark">!</span>
              <div>
                <strong>We couldn’t get the weather.</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!loading && weatherData && (
            <div className="weather-summary">
              <div className="temperature-block">
                <p className="condition-label">{weatherData.condition}</p>
                <div className="temperature">
                  {weatherData.temperature}<span>°C</span>
                </div>
                <p className="feels-like">
                  Feels like {weatherData.apparentTemperature}°C
                </p>
              </div>
              <div className="weather-visual">
                {weatherData.icon && (
                  <img
                    src={`https://openweathermap.org/img/wn/${weatherData.icon}@4x.png`}
                    alt={weatherData.condition || "Current weather"}
                  />
                )}
                <span>OUTSIDE, RIGHT NOW</span>
              </div>
            </div>
          )}
          {!loading && !error && !weatherData && (
            <div className="status-message">Search for a city to see its weather.</div>
          )}
          <div className="weather-card-footer">
            <span>TAKE A BREATH. CHECK THE SKY.</span>
            <span className="footer-sun" aria-hidden="true">✳</span>
          </div>
        </section>

        <section className="details-section" aria-label="Weather details">
          <div className="details-heading">
            <div>
              <p className="eyebrow">THE DETAILS</p>
              <h2>Today at a glance</h2>
            </div>
            <p className="details-caption">The little things that shape your day.</p>
          </div>
          <div className="metrics-grid">
            <article className="metric-card">
              <span className="metric-icon humidity-icon" aria-hidden="true">◌</span>
              <p>HUMIDITY</p>
              <strong>
                {weatherData ? (
                  <>{weatherData.absoluteHumidity} <small>g/m³</small></>
                ) : "—"}
              </strong>
              <span className="metric-note">Water vapour in the air</span>
            </article>
            <article className="metric-card">
              <span className="metric-icon wind-icon" aria-hidden="true">↗</span>
              <p>WIND SPEED</p>
              <strong>
                {weatherData?.windSpeed != null ? (
                  <>{weatherData.windSpeed} <small>m/s</small></>
                ) : "—"}
              </strong>
              <span className="metric-note">A breeze or a bluster</span>
            </article>
            <article className="metric-card">
              <span className="metric-icon pressure-icon" aria-hidden="true">◉</span>
              <p>PRESSURE</p>
              <strong>
                {weatherData ? <>{weatherData.pressure} <small>hPa</small></> : "—"}
              </strong>
              <span className="metric-note">Atmospheric pressure</span>
            </article>
          </div>
        </section>

        <footer className="page-footer">
          <span>MADE FOR SLOWER, BETTER MORNINGS</span>
          <span>Weather, with a little warmth <span aria-hidden="true">♥</span></span>
        </footer>
      </main>
    </div>
  );
}

export default WeatherApp;
