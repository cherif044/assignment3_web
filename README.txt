Cherif Mikhail - Portfolio Website (Design of Web-Based Systems, Assignment 3)
==============================================================================

Live website: see link.txt

This is my Assignment 2 CV turned into a single-page portfolio. All the CV
content from Assignment 2 is kept (education, experience, skills, projects,
certifications, contact) and four live APIs were added.


APIs USED (all free and public, no API keys needed)
---------------------------------------------------
1. GitHub REST API          https://api.github.com/users/cherif044/repos
   Projects section -> "From my GitHub": my public repositories (name,
   description, language, stars, last update), a search box, language
   filter, sorting, "Show more", and a chart of the languages I use most.

2. Open-Meteo API           https://open-meteo.com
   Live dashboard -> Weather: search any city (Open-Meteo geocoding finds it),
   then show the temperature, condition, icon, feels-like, humidity, wind and
   a 3-day forecast. The card colour changes with the weather and day/night.

3. DummyJSON Quotes API     https://dummyjson.com/quotes/random
   Live dashboard -> Quote: a random motivational quote with New quote,
   Copy and Share buttons.

4. Hacker News Search API (Algolia)   https://hn.algolia.com/api
   Live dashboard -> Latest tech news: newest popular headlines for the
   chosen topic (AI, Web Dev, Databases, Security).

Because none of the APIs need a key, nothing has to be configured.
Just open index.html through a web server or visit the live link.


FILES
-----
index.html   Page structure (single-page app with sections)
styles.css   All styling, dark mode, responsive layout and print layout
api.js       Talks to the four APIs (fetch + async/await). No page code here.
widgets.js   Draws the live sections: loading placeholders, errors, results
script.js    Page interactions from Assignment 2 plus the new navigation
images/      Profile picture
link.txt     Live website URL


JAVASCRIPT REQUIREMENTS
-----------------------
- fetch with async/await: every request goes through fetchJSON() in api.js.
- Loading state: grey "skeleton" placeholders appear while data loads.
- Errors: a clear message and a "Try again" button for no internet,
  timeouts (10 seconds), "city not found", rate limits and server errors.
- Each API loads independently, so if one fails the others still work.
- The DOM is updated dynamically with the API data.


EXTRA FEATURES
--------------
For everyone:
- Sticky navigation bar that highlights the current section, plus a
  menu button on phones
- Animated title that types out different roles
- "Live" badges on every section that uses real-time data
- Weather card that changes colour with the sky
- Language chart built from my GitHub repositories
- Sections fade in while scrolling, a reading progress bar, back-to-top button
- "Download CV (PDF)" button that prints a clean CV-only version
- "How this site works" section explaining the live data in plain words
- Contact form that opens your email app with the message already written
- Dark mode

Technical:
- Separation of concerns: data (api.js), rendering (widgets.js), UI (script.js)
- Request timeout with AbortController
- GitHub responses cached in sessionStorage for 10 minutes (GitHub allows
  60 requests per hour without a key)
- localStorage remembers dark mode, last city, news topic and added skills
- All API text is escaped before being shown (protects against HTML injection)
- Accessibility: skip link, aria-live regions, keyboard tabs (arrow keys),
  focus outlines, and animations turn off with "reduce motion"


RUNNING IT LOCALLY
------------------
Open a terminal in this folder and run:
    python3 -m http.server 8000
Then visit http://localhost:8000
