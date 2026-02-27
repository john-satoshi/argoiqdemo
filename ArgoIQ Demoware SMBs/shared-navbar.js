export function renderSharedNavbar({
  mountId = "appNavbarMount",
  active = "dashboard",
  logoTriggerId = "",
  tone = "light",
} = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const dashboardClass = active === "dashboard" ? " is-active" : "";
  const feedsClass = active === "feeds" ? " is-active" : "";
  const insightClass = active === "insight" ? " is-active" : "";
  const logoIdAttr = logoTriggerId ? ` id="${logoTriggerId}"` : "";
  const toneClass = tone === "ink" ? " is-ink" : "";

  mount.className = `app-navbar dashboard-navbar${toneClass}`;
  mount.setAttribute("aria-label", "Main navigation");
  mount.innerHTML = `
    <div class="app-navbar-brand dashboard-brand"${logoIdAttr} aria-label="Argo IQ logo">
      <img src="./Assets/ArgoIQ-logo.svg" alt="ArgoIQ" class="logo-svg" />
    </div>
    <div class="app-navbar-items dashboard-nav-items" role="list">
      <button class="app-navbar-item dashboard-nav-item${dashboardClass}" id="navDashboard" type="button">Dashboard</button>
      <button class="app-navbar-item dashboard-nav-item${feedsClass}" id="navFeeds" type="button">Feeds</button>
      <button class="app-navbar-item dashboard-nav-item${insightClass}" id="navInsight" type="button">Insight</button>
    </div>
    <button class="app-navbar-avatar dashboard-avatar" type="button" aria-label="User profile">
      <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M8 8.2C9.43594 8.2 10.6 7.03594 10.6 5.6C10.6 4.16406 9.43594 3 8 3C6.56406 3 5.4 4.16406 5.4 5.6C5.4 7.03594 6.56406 8.2 8 8.2Z" fill="currentColor" />
        <path d="M8 1.2C4.24445 1.2 1.2 4.24445 1.2 8C1.2 11.7556 4.24445 14.8 8 14.8C11.7556 14.8 14.8 11.7556 14.8 8C14.8 4.24445 11.7556 1.2 8 1.2ZM8 2.4C10.8058 2.4 13.1 4.69423 13.1 7.5C13.1 8.87278 12.5482 10.1158 11.6556 11.0305C10.9155 10.0266 9.49908 9.35 8 9.35C6.50092 9.35 5.08453 10.0266 4.34445 11.0305C3.45177 10.1158 2.9 8.87278 2.9 7.5C2.9 4.69423 5.19423 2.4 8 2.4Z" fill="currentColor" />
      </svg>
    </button>
  `;
}
