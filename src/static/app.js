document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const teacherRequired = document.getElementById("teacher-required");
  const messageDiv = document.getElementById("message");
  const loginToggle = document.getElementById("login-toggle");
  const loginForm = document.getElementById("login-form");
  const teacherSession = document.getElementById("teacher-session");
  const teacherSessionLabel = document.getElementById("teacher-session-label");
  const logoutButton = document.getElementById("logout-button");
  let isTeacher = false;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  function updateAuthenticationUI(username = "") {
    loginToggle.classList.toggle("hidden", isTeacher);
    loginForm.classList.toggle("hidden", isTeacher || loginForm.dataset.open !== "true");
    teacherSession.classList.toggle("hidden", !isTeacher);
    signupForm.classList.toggle("hidden", !isTeacher);
    teacherRequired.classList.toggle("hidden", isTeacher);
    teacherSessionLabel.textContent = `Signed in as ${username}`;
    loginToggle.setAttribute("aria-expanded", String(!loginForm.classList.contains("hidden")));
  }

  async function fetchAuthentication() {
    try {
      const response = await fetch("/auth/me");
      const result = await response.json();
      isTeacher = response.ok && result.authenticated;
      updateAuthenticationUI(result.username || "");
    } catch (error) {
      isTeacher = false;
      updateAuthenticationUI();
      console.error("Error checking teacher session:", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.replaceChildren();
      activitySelect.replaceChildren(new Option("-- Select an activity --", ""));

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;
        const heading = document.createElement("h4");
        heading.textContent = name;
        const description = document.createElement("p");
        description.textContent = details.description;
        const schedule = document.createElement("p");
        schedule.textContent = `Schedule: ${details.schedule}`;
        const availability = document.createElement("p");
        availability.textContent = `Availability: ${spotsLeft} spots left`;
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants-container";
        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants:";
        participantsContainer.appendChild(participantsHeading);

        if (details.participants.length > 0) {
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const emailLabel = document.createElement("span");
            emailLabel.className = "participant-email";
            emailLabel.textContent = email;
            participant.appendChild(emailLabel);

            if (isTeacher) {
              const removeButton = document.createElement("button");
              removeButton.className = "delete-btn";
              removeButton.type = "button";
              removeButton.textContent = "Remove";
              removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
              removeButton.addEventListener("click", () => handleUnregister(name, email));
              participant.appendChild(removeButton);
            }
            participantsList.appendChild(participant);
          });
          participantsContainer.appendChild(participantsList);
        } else {
          const emptyState = document.createElement("p");
          emptyState.textContent = "No participants yet";
          participantsContainer.appendChild(emptyState);
        }

        activityCard.append(heading, description, schedule, availability, participantsContainer);

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  loginToggle.addEventListener("click", () => {
    loginForm.dataset.open = loginForm.dataset.open === "true" ? "false" : "true";
    updateAuthenticationUI();
    if (loginForm.dataset.open === "true") {
      document.getElementById("teacher-username").focus();
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("teacher-username").value;
    const password = document.getElementById("teacher-password").value;
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        showMessage(result.detail || "Unable to log in.", "error");
        return;
      }
      isTeacher = true;
      loginForm.reset();
      loginForm.dataset.open = "false";
      updateAuthenticationUI(result.username);
      await fetchActivities();
      showMessage("Teacher signed in.", "success");
    } catch (error) {
      showMessage("Unable to log in. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) {
        showMessage("Unable to log out. Please try again.", "error");
        return;
      }
      isTeacher = false;
      updateAuthenticationUI();
      await fetchActivities();
      showMessage("Teacher signed out.", "success");
    } catch (error) {
      showMessage("Unable to log out. Please try again.", "error");
      console.error("Error logging out:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  async function initialize() {
    await fetchAuthentication();
    await fetchActivities();
  }

  initialize();
});
