// A few little things to make the portfolio easier to use
// (storage and showToast come from widgets.js, which loads first)
document.addEventListener("DOMContentLoaded", () => {
    // Only hide things for the fade-in when JavaScript is running to show them again
    document.documentElement.classList.add("js");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const welcome = document.querySelector("#welcome-message");
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    welcome.textContent = `${greeting}, and welcome to my portfolio!`;
    document.querySelector("#year").textContent = new Date().getFullYear();

    // Let people switch between the two themes, and remember their choice
    const themeButton = document.querySelector("#theme-toggle");
    const setTheme = (dark) => {
        document.body.classList.toggle("dark-mode", dark);
        themeButton.textContent = dark ? "Switch to light mode" : "Switch to dark mode";
        themeButton.setAttribute("aria-pressed", String(dark));
    };
    setTheme(storage.get("darkMode", window.matchMedia("(prefers-color-scheme: dark)").matches));
    themeButton.addEventListener("click", () => {
        const dark = !document.body.classList.contains("dark-mode");
        setTheme(dark);
        storage.set("darkMode", dark);
    });

    // Phone menu
    const menuButton = document.querySelector("#menu-toggle");
    const navLinks = document.querySelector("#nav-links");
    const setMenu = (open) => {
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.querySelector(".visually-hidden").textContent = open ? "Close menu" : "Open menu";
        navLinks.classList.toggle("open", open);
    };
    menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
    navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenu(false);
    });

    // Highlight the menu link for the section on screen
    const links = [...navLinks.querySelectorAll("a")];
    const watched = links.map((link) => document.querySelector(link.getAttribute("href")));
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
        });
    }, { rootMargin: "-45% 0px -50% 0px" });
    watched.forEach((section) => sectionObserver.observe(section));

    // Fade sections in as they scroll into view
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach((item) => {
        if (reduceMotion) item.classList.add("visible");
        else revealObserver.observe(item);
    });

    // Reading progress bar and the back-to-top button
    const progressBar = document.querySelector("#scroll-progress-bar");
    const backToTop = document.querySelector("#back-to-top");
    const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
        backToTop.hidden = window.scrollY < 600;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

    // The little line under my title that types out different roles
    const typed = document.querySelector("#typed-role");
    const roles = ["Web Developer", "Database Designer", "Automation Builder", "Problem Solver"];
    if (!reduceMotion) {
        let roleIndex = 0;
        let letters = roles[0].length;
        let deleting = true;
        const tick = () => {
            const role = roles[roleIndex];
            letters += deleting ? -1 : 1;
            typed.textContent = role.slice(0, letters);
            let delay = deleting ? 45 : 90;
            if (!deleting && letters === role.length) {
                deleting = true;
                delay = 1800;
            } else if (deleting && letters === 0) {
                deleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                delay = 300;
            }
            setTimeout(tick, delay);
        };
        setTimeout(tick, 2000);
    }

    // Show or tuck away these sections when needed
    document.querySelectorAll(".section-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const content = document.getElementById(button.getAttribute("aria-controls"));
            const expanded = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", String(!expanded));
            button.textContent = expanded ? "Show" : "Hide";
            content.hidden = expanded;
        });
    });

    // Add a skill to the list without refreshing the page
    const skillForm = document.querySelector("#skill-form");
    const skillsList = document.querySelector(".skills-list");
    const addSkillItem = (skill) => {
        const item = document.createElement("li");
        item.textContent = skill;
        item.className = "added";
        skillsList.append(item);
    };
    const savedSkills = storage.get("addedSkills", []);
    savedSkills.forEach(addSkillItem);

    skillForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.querySelector("#skill-input");
        const feedback = document.querySelector("#skill-feedback");
        const skill = input.value.trim();
        const existing = [...skillsList.querySelectorAll("li")]
            .some((item) => item.textContent.toLowerCase() === skill.toLowerCase());

        if (!skill) {
            feedback.textContent = "Please enter a skill.";
            feedback.className = "form-feedback error";
            input.focus();
            return;
        }
        if (existing) {
            feedback.textContent = "That skill is already listed.";
            feedback.className = "form-feedback error";
            input.focus();
            return;
        }

        addSkillItem(skill);
        savedSkills.push(skill);
        storage.set("addedSkills", savedSkills);
        feedback.textContent = `${skill} added to the skills list.`;
        feedback.className = "form-feedback success";
        skillForm.reset();
        input.focus();
    });

    // Show a bit more about a project when someone asks
    document.querySelectorAll(".project-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const details = button.nextElementSibling;
            const expanded = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", String(!expanded));
            button.textContent = expanded ? "Show project details" : "Hide project details";
            details.hidden = expanded;
        });
    });

    // Live character count for the message box
    const message = document.querySelector("#contact-message");
    const messageCount = document.querySelector("#message-count");
    message.addEventListener("input", () => {
        messageCount.textContent = message.value.length;
    });

    // Check the form, then open the visitor's email app with everything filled in
    const contactForm = document.querySelector("#contact-form");
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = document.querySelector("#contact-name");
        const email = document.querySelector("#contact-email");
        const feedback = document.querySelector("#contact-feedback");
        const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());

        if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
            feedback.textContent = "Please complete all three fields.";
            feedback.className = "form-feedback error";
            return;
        }
        if (!emailIsValid) {
            feedback.textContent = "Please enter a valid email address.";
            feedback.className = "form-feedback error";
            email.focus();
            return;
        }

        const subject = encodeURIComponent(`Portfolio message from ${name.value.trim()}`);
        const body = encodeURIComponent(`${message.value.trim()}\n\n— ${name.value.trim()} (${email.value.trim()})`);
        window.location.href = `mailto:cherifsameh@aucegypt.edu?subject=${subject}&body=${body}`;

        feedback.textContent = "Thanks! Your email app should open with the message ready to send.";
        feedback.className = "form-feedback success";
        contactForm.reset();
        messageCount.textContent = "0";
    });
});
