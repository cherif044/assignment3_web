// All the talking to outside services happens here. Nothing in this file touches the page.
const api = (() => {
    const GITHUB_USER = "cherif044";
    const TIMEOUT_MS = 10000;

    // One helper for every request: timeout, readable errors and optional caching
    async function fetchJSON(url, { cacheKey, cacheMinutes = 0 } = {}) {
        if (cacheKey) {
            const cached = readCache(cacheKey, cacheMinutes);
            if (cached) return cached;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        let response;
        try {
            response = await fetch(url, { signal: controller.signal });
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("The request took too long. Please check your connection and try again.");
            }
            throw new Error("Could not reach the server. Please check your internet connection.");
        } finally {
            clearTimeout(timer);
        }

        if (!response.ok) {
            if (response.status === 403 || response.status === 429) {
                throw new Error("Too many requests right now. Please wait a minute and try again.");
            }
            if (response.status === 404) {
                throw new Error("We couldn't find that. Please check the spelling and try again.");
            }
            throw new Error(`The server answered with an error (${response.status}). Please try again.`);
        }

        const data = await response.json();
        if (cacheKey) writeCache(cacheKey, data);
        return data;
    }

    // sessionStorage can be blocked (private mode), so the cache quietly gives up if it is
    function readCache(key, minutes) {
        try {
            const entry = JSON.parse(sessionStorage.getItem(key));
            if (entry && Date.now() - entry.savedAt < minutes * 60000) return entry.data;
        } catch (error) {
            // No cache available, so we just fetch again
        }
        return null;
    }

    function writeCache(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
        } catch (error) {
            // Storage full or blocked, which is fine
        }
    }

    // API 1: GitHub — profile and public repositories
    function getGitHubProfile() {
        return fetchJSON(`https://api.github.com/users/${GITHUB_USER}`, {
            cacheKey: "gh-profile",
            cacheMinutes: 10,
        });
    }

    function getGitHubRepos() {
        return fetchJSON(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, {
            cacheKey: "gh-repos",
            cacheMinutes: 10,
        });
    }

    // API 2: Open-Meteo — turn a city name into coordinates, then get its weather
    async function findCity(name) {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`;
        const data = await fetchJSON(url);
        if (!data.results || data.results.length === 0) {
            throw new Error(`We couldn't find a city called "${name}". Try another spelling.`);
        }
        return data.results[0];
    }

    function getWeather(latitude, longitude) {
        const params = new URLSearchParams({
            latitude,
            longitude,
            current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
            daily: "weather_code,temperature_2m_max,temperature_2m_min",
            timezone: "auto",
            forecast_days: "4",
        });
        return fetchJSON(`https://api.open-meteo.com/v1/forecast?${params}`);
    }

    // API 3: DummyJSON — a random quote (the timestamp stops the browser reusing an old one)
    function getRandomQuote() {
        return fetchJSON(`https://dummyjson.com/quotes/random?t=${Date.now()}`);
    }

    // API 4: Hacker News (Algolia) — newest popular stories with the topic in the title
    async function getNews(topic) {
        const params = new URLSearchParams({
            query: topic,
            tags: "story",
            restrictSearchableAttributes: "title",
            numericFilters: "points>10",
            hitsPerPage: "8",
        });
        const data = await fetchJSON(`https://hn.algolia.com/api/v1/search_by_date?${params}`);
        return data.hits;
    }

    return { getGitHubProfile, getGitHubRepos, findCity, getWeather, getRandomQuote, getNews };
})();
