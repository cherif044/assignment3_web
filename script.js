// A few little things to make the CV easier to use
document.addEventListener("DOMContentLoaded", () => {
    const welcome = document.querySelector("#welcome-message");
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    welcome.textContent = `${greeting}, and welcome to my portfolio!`;

    // Let people switch between the two themes
    const themeButton = document.querySelector("#theme-toggle");
    themeButton.addEventListener("click", () => {
        const dark = document.body.classList.toggle("dark-mode");
        themeButton.textContent = dark ? "Switch to light mode" : "Switch to dark mode";
        themeButton.setAttribute("aria-pressed", String(dark));
    });

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
    skillForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.querySelector("#skill-input");
        const feedback = document.querySelector("#skill-feedback");
        const skill = input.value.trim();
        const existing = [...document.querySelectorAll(".skills-list li")]
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

        const item = document.createElement("li");
        item.textContent = skill;
        document.querySelector(".skills-list").append(item);
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

    // Check the form and tell the visitor what needs fixing
    const contactForm = document.querySelector("#contact-form");
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = document.querySelector("#contact-name");
        const email = document.querySelector("#contact-email");
        const message = document.querySelector("#contact-message");
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

        feedback.textContent = "Thanks! Your message is ready. Please email me directly using the address above.";
        feedback.className = "form-feedback success";
        contactForm.reset();
    });
});
