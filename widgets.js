// The live sections: each one asks api.js for data and draws it on the page

// ---------- Shared helpers ----------

// Read and save small preferences; storage can be blocked, so never let it crash the page
const storage = {
    get(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // Not saved, which only means it is forgotten on reload
        }
    },
};

// API text goes through this before it reaches innerHTML
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

function timeAgo(date) {
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    const steps = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const [unit, size] of steps) {
        const amount = Math.floor(seconds / size);
        if (amount >= 1) return `${amount} ${unit}${amount > 1 ? "s" : ""} ago`;
    }
    return "just now";
}

// Grey placeholder shapes while data is on its way
function showLoading(container, { rows = 3, label = "Loading…" } = {}) {
    container.setAttribute("aria-busy", "true");
    container.innerHTML = `
        <p class="visually-hidden">${label}</p>
        ${Array.from({ length: rows }, () => `<div class="skeleton"></div>`).join("")}
    `;
}

// A friendly message plus a button to try again
function showError(container, message, retry) {
    container.removeAttribute("aria-busy");
    container.innerHTML = `
        <div class="error-box" role="alert">
            <p><strong>Something went wrong.</strong> ${escapeHTML(message)}</p>
            <button type="button" class="button button-ghost">Try again</button>
        </div>
    `;
    container.querySelector("button").addEventListener("click", retry);
}

let toastTimer;
function showToast(message) {
    const toast = document.querySelector("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

// ---------- API 1: GitHub ----------

const LANGUAGE_COLORS = {
    "C++": "#f34b7d", Python: "#3572a5", JavaScript: "#e3b341", TypeScript: "#3178c6",
    HTML: "#e34c26", CSS: "#563d7c", Verilog: "#b2b7f8", MATLAB: "#e16737",
    Java: "#b07219", C: "#555555", SQL: "#e38c00", Other: "#8b98a5",
};

const github = {
    repos: [],
    shown: 6,

    async load() {
        const reposBox = document.querySelector("#github-repos");
        const languagesBox = document.querySelector("#github-languages");
        showLoading(reposBox, { rows: 4, label: "Loading repositories…" });
        showLoading(languagesBox, { rows: 4, label: "Loading languages…" });
        document.querySelector("#repo-more").hidden = true;
        document.querySelector("#repo-count").textContent = "";

        try {
            const [profile, repos] = await Promise.all([api.getGitHubProfile(), api.getGitHubRepos()]);
            // Hide forks and empty experiments so the list shows real work
            this.repos = repos.filter((repo) => !repo.fork && (repo.language || repo.description));
            this.profileUrl = profile.html_url;
            this.renderLanguages(languagesBox);
            this.fillLanguageFilter();
            this.render();
            document.querySelector("#stat-repos").textContent = profile.public_repos;
        } catch (error) {
            showError(reposBox, error.message, () => this.load());
            languagesBox.removeAttribute("aria-busy");
            languagesBox.innerHTML = `<p class="muted">Languages will appear once GitHub loads.</p>`;
        }
    },

    languageTotals() {
        const totals = {};
        this.repos.forEach((repo) => {
            if (repo.language) totals[repo.language] = (totals[repo.language] || 0) + 1;
        });
        return Object.entries(totals).sort((a, b) => b[1] - a[1]);
    },

    // A simple bar chart: how many of my repos use each language
    renderLanguages(container) {
        const totals = this.languageTotals();
        const count = totals.reduce((sum, [, n]) => sum + n, 0);
        const top = totals.slice(0, 5);
        const rest = totals.slice(5).reduce((sum, [, n]) => sum + n, 0);
        if (rest) top.push(["Other", rest]);

        document.querySelector("#stat-languages").textContent = totals.length;
        container.removeAttribute("aria-busy");
        container.innerHTML = `
            <ul class="lang-bars">
                ${top.map(([language, n]) => {
                    const percent = Math.round((n / count) * 100);
                    const color = LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other;
                    return `
                        <li>
                            <div class="lang-label"><span>${escapeHTML(language)}</span><span>${percent}%</span></div>
                            <div class="lang-track"><span style="width:${percent}%; background:${color}"></span></div>
                        </li>`;
                }).join("")}
            </ul>
            <p class="muted small">Based on ${count} repositories</p>
        `;
    },

    fillLanguageFilter() {
        const select = document.querySelector("#repo-language");
        select.length = 1;
        this.languageTotals().forEach(([language]) => select.add(new Option(language, language)));
    },

    filtered() {
        const search = document.querySelector("#repo-search").value.trim().toLowerCase();
        const language = document.querySelector("#repo-language").value;
        const sort = document.querySelector("#repo-sort").value;

        const list = this.repos.filter((repo) =>
            (!language || repo.language === language) &&
            (!search || `${repo.name} ${repo.description || ""}`.toLowerCase().includes(search)));

        const sorters = {
            updated: (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at),
            stars: (a, b) => b.stargazers_count - a.stargazers_count,
            name: (a, b) => a.name.localeCompare(b.name),
        };
        return list.sort(sorters[sort]);
    },

    render() {
        const box = document.querySelector("#github-repos");
        const list = this.filtered();
        const visible = list.slice(0, this.shown);
        box.removeAttribute("aria-busy");

        if (list.length === 0) {
            box.innerHTML = `<p class="muted">No repositories match that search.</p>`;
        } else {
            box.innerHTML = visible.map((repo) => `
                <a class="repo-card" href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener">
                    <h4>${escapeHTML(repo.name.replace(/[-_]+/g, " "))}</h4>
                    <p>${escapeHTML(repo.description || "No description yet.")}</p>
                    <div class="repo-meta">
                        ${repo.language ? `<span><i class="dot" style="background:${LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.Other}"></i>${escapeHTML(repo.language)}</span>` : ""}
                        <span>★ ${repo.stargazers_count}</span>
                        <span>Updated ${timeAgo(new Date(repo.pushed_at))}</span>
                    </div>
                </a>
            `).join("");
        }

        document.querySelector("#repo-count").innerHTML =
            `Showing ${visible.length} of ${list.length} · <a href="${escapeHTML(this.profileUrl)}" target="_blank" rel="noopener">View all on GitHub</a>`;
        document.querySelector("#repo-more").hidden = visible.length >= list.length;
    },

    init() {
        const rerender = () => {
            this.shown = 6;
            this.render();
        };
        document.querySelector("#repo-search").addEventListener("input", rerender);
        document.querySelector("#repo-language").addEventListener("change", rerender);
        document.querySelector("#repo-sort").addEventListener("change", rerender);
        document.querySelector("#repo-more").addEventListener("click", () => {
            this.shown += 6;
            this.render();
        });
        this.load();
    },
};

// ---------- API 2: Weather ----------

// Open-Meteo sends a WMO weather code; this turns it into words, an icon and a card colour
const WEATHER_CODES = {
    0: ["Clear sky", "☀️", "🌙", "clear"],
    1: ["Mainly clear", "🌤️", "🌙", "clear"],
    2: ["Partly cloudy", "⛅", "☁️", "cloudy"],
    3: ["Overcast", "☁️", "☁️", "cloudy"],
    45: ["Fog", "🌫️", "🌫️", "fog"],
    48: ["Freezing fog", "🌫️", "🌫️", "fog"],
    51: ["Light drizzle", "🌦️", "🌧️", "rain"],
    53: ["Drizzle", "🌦️", "🌧️", "rain"],
    55: ["Heavy drizzle", "🌧️", "🌧️", "rain"],
    61: ["Light rain", "🌦️", "🌧️", "rain"],
    63: ["Rain", "🌧️", "🌧️", "rain"],
    65: ["Heavy rain", "🌧️", "🌧️", "rain"],
    71: ["Light snow", "🌨️", "🌨️", "snow"],
    73: ["Snow", "🌨️", "🌨️", "snow"],
    75: ["Heavy snow", "❄️", "❄️", "snow"],
    80: ["Rain showers", "🌦️", "🌧️", "rain"],
    81: ["Rain showers", "🌧️", "🌧️", "rain"],
    82: ["Violent showers", "⛈️", "⛈️", "storm"],
    95: ["Thunderstorm", "⛈️", "⛈️", "storm"],
    96: ["Thunderstorm with hail", "⛈️", "⛈️", "storm"],
    99: ["Thunderstorm with hail", "⛈️", "⛈️", "storm"],
};

function describeWeather(code, isDay = true) {
    const [label, dayIcon, nightIcon, sky] = WEATHER_CODES[code] || ["Unknown", "🌡️", "🌡️", "cloudy"];
    return { label, icon: isDay ? dayIcon : nightIcon, sky: sky === "clear" ? (isDay ? "clear-day" : "clear-night") : sky };
}

const weather = {
    async load(cityName) {
        const card = document.querySelector("#weather-section");
        const box = document.querySelector("#weather-output");
        showLoading(box, { rows: 3, label: `Loading the weather for ${cityName}…` });

        try {
            const city = await api.findCity(cityName);
            const data = await api.getWeather(city.latitude, city.longitude);
            const now = data.current;
            const today = describeWeather(now.weather_code, now.is_day === 1);
            card.dataset.sky = today.sky;
            storage.set("lastCity", city.name);

            const days = data.daily.time.slice(1, 4).map((day, i) => {
                const info = describeWeather(data.daily.weather_code[i + 1]);
                const name = new Date(`${day}T12:00`).toLocaleDateString("en-US", { weekday: "short" });
                return `
                    <li>
                        <span>${name}</span>
                        <span class="forecast-icon" role="img" aria-label="${info.label}">${info.icon}</span>
                        <span>${Math.round(data.daily.temperature_2m_max[i + 1])}° / ${Math.round(data.daily.temperature_2m_min[i + 1])}°</span>
                    </li>`;
            }).join("");

            box.removeAttribute("aria-busy");
            box.innerHTML = `
                <div class="weather-now">
                    <span class="weather-icon" role="img" aria-label="${today.label}">${today.icon}</span>
                    <div>
                        <p class="weather-place">${escapeHTML(city.name)}${city.country ? `, ${escapeHTML(city.country)}` : ""}</p>
                        <p class="weather-temp">${Math.round(now.temperature_2m)}°C</p>
                        <p class="weather-label">${today.label}</p>
                    </div>
                </div>
                <ul class="weather-facts">
                    <li><span>Feels like</span><strong>${Math.round(now.apparent_temperature)}°C</strong></li>
                    <li><span>Humidity</span><strong>${now.relative_humidity_2m}%</strong></li>
                    <li><span>Wind</span><strong>${Math.round(now.wind_speed_10m)} km/h</strong></li>
                </ul>
                <ul class="forecast">${days}</ul>
                <p class="updated">Local time there: ${now.time.slice(11)} · Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            `;
        } catch (error) {
            showError(box, error.message, () => this.load(cityName));
        }
    },

    init() {
        const form = document.querySelector("#weather-form");
        const input = document.querySelector("#city-input");
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const city = input.value.trim();
            if (!city) {
                input.focus();
                return;
            }
            this.load(city);
            form.reset();
        });
        document.querySelectorAll(".city-chips .chip").forEach((chip) => {
            chip.addEventListener("click", () => this.load(chip.dataset.city));
        });
        this.load(storage.get("lastCity", "Cairo"));
    },
};

// ---------- API 3: Quotes ----------

const quotes = {
    current: null,

    async load() {
        const box = document.querySelector("#quote-output");
        const button = document.querySelector("#quote-new");
        button.disabled = true;
        showLoading(box, { rows: 2, label: "Loading a quote…" });

        try {
            this.current = await api.getRandomQuote();
            box.removeAttribute("aria-busy");
            box.innerHTML = `
                <blockquote class="quote fade-in">
                    <p>“${escapeHTML(this.current.quote)}”</p>
                    <footer>— ${escapeHTML(this.current.author)}</footer>
                </blockquote>
            `;
        } catch (error) {
            this.current = null;
            showError(box, error.message, () => this.load());
        } finally {
            button.disabled = false;
        }
    },

    text() {
        return this.current ? `“${this.current.quote}” — ${this.current.author}` : "";
    },

    async copy() {
        if (!this.current) return;
        try {
            await navigator.clipboard.writeText(this.text());
            showToast("Quote copied to your clipboard");
        } catch (error) {
            showToast("Copying isn't allowed in this browser");
        }
    },

    async share() {
        if (!this.current) return;
        if (navigator.share) {
            try {
                await navigator.share({ text: this.text() });
            } catch (error) {
                // The visitor closed the share sheet
            }
        } else {
            this.copy();
        }
    },

    init() {
        document.querySelector("#quote-new").addEventListener("click", () => this.load());
        document.querySelector("#quote-copy").addEventListener("click", () => this.copy());
        document.querySelector("#quote-share").addEventListener("click", () => this.share());
        this.load();
    },
};

// ---------- API 4: News ----------

const news = {
    async load(topic) {
        const box = document.querySelector("#news-output");
        showLoading(box, { rows: 4, label: "Loading headlines…" });

        try {
            const stories = await api.getNews(topic);
            box.removeAttribute("aria-busy");
            if (stories.length === 0) {
                box.innerHTML = `<p class="muted">No recent stories on this topic. Try another tab.</p>`;
                return;
            }
            box.innerHTML = stories.map((story) => {
                const link = story.url || `https://news.ycombinator.com/item?id=${story.objectID}`;
                const site = story.url ? new URL(story.url).hostname.replace(/^www\./, "") : "news.ycombinator.com";
                return `
                    <article class="news-item fade-in">
                        <a href="${escapeHTML(link)}" target="_blank" rel="noopener">${escapeHTML(story.title)}</a>
                        <p class="news-meta">
                            <span>${escapeHTML(site)}</span>
                            <span>▲ ${story.points} points</span>
                            <span>💬 ${story.num_comments || 0}</span>
                            <span>${timeAgo(new Date(story.created_at_i * 1000))}</span>
                        </p>
                    </article>`;
            }).join("");
        } catch (error) {
            showError(box, error.message, () => this.load(topic));
        }
    },

    select(tab) {
        document.querySelectorAll("#news-section .tab").forEach((other) => {
            const active = other === tab;
            other.setAttribute("aria-selected", String(active));
            other.tabIndex = active ? 0 : -1;
        });
        storage.set("newsTopic", tab.dataset.topic);
        this.load(tab.dataset.topic);
    },

    init() {
        const tabs = [...document.querySelectorAll("#news-section .tab")];
        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => this.select(tab));
            // Arrow keys move between tabs, like a native tab control
            tab.addEventListener("keydown", (event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                const step = event.key === "ArrowRight" ? 1 : -1;
                const next = tabs[(index + step + tabs.length) % tabs.length];
                next.focus();
                this.select(next);
            });
        });
        const saved = tabs.find((tab) => tab.dataset.topic === storage.get("newsTopic"));
        this.select(saved || tabs[0]);
    },
};

// Each widget starts on its own, so one slow or broken API never holds up the rest
document.addEventListener("DOMContentLoaded", () => {
    github.init();
    weather.init();
    quotes.init();
    news.init();
});
