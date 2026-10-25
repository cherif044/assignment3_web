Assignment 3 - Portfolio Website
Cherif Mikhail

Live link: https://assignment3web-eta.vercel.app

I turned my CV from assignment 2 into a one page portfolio. Everything from
assignment 2 is still there, and I added live data from 4 APIs. None of them
need an API key so there is nothing to set up.

APIs I used:
1. GitHub API - shows my public repos in the Projects section, with search,
   filter by language, sorting and a small chart of the languages I use.
2. Open-Meteo - weather for any city you search, with a 3 day forecast.
3. DummyJSON Quotes - random quote with a button to get a new one.
4. Hacker News (Algolia) - latest tech news, you can switch between topics.

Each one shows a loading placeholder while it loads, and if something fails
(no internet, city not found, etc.) it shows a message and a Try again button.

Files:
- index.html, styles.css
- api.js: the fetch code for the 4 APIs
- widgets.js: shows the API data on the page
- script.js: the rest of the page (menu, dark mode, forms, etc.)
- Cherif-Mikhail-CV.pdf: the file the Download CV button downloads
- images/, link.txt

Extra things I added:
- Navigation bar that follows you while scrolling, and a menu on phones
- Dark mode that stays on after you refresh
- Download CV as PDF
- Contact form opens your email app with the message ready
- Small animations when scrolling and a back to top button
- The site remembers the last city and news topic you picked
- A "How this site works" section that explains the live data
