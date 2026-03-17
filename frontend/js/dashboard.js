// ============================================
// AutoSEO Engine - Dashboard
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const app = new Dashboard();
  app.init();
});

class Dashboard {
  constructor() {
    this.currentSiteId = "";
    this.toastContainer = null;
  }

  init() {
    this.createToastContainer();

    if (!window.api.isConfigured()) {
      this.showSetupModal();
    } else {
      this.loadDashboard();
    }

    this.bindEvents();
  }

  createToastContainer() {
    this.toastContainer = document.createElement("div");
    this.toastContainer.className = "toast-container";
    document.body.appendChild(this.toastContainer);
  }

  toast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  bindEvents() {
    // Setup form
    document.getElementById("setup-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = document.getElementById("api-url").value.trim();
      const key = document.getElementById("api-key").value.trim();

      if (url && key) {
        window.api.configure(url, key);
        document.getElementById("setup-modal").style.display = "none";
        this.loadDashboard();
        this.toast("Connected successfully!", "success");
      }
    });

    // Settings button
    document.getElementById("btn-settings")?.addEventListener("click", () => {
      this.showSetupModal();
    });

    // Pipeline button
    document.getElementById("btn-run-pipeline")?.addEventListener("click", () => {
      this.showPipelineModal();
    });

    // Collect keywords button
    document.getElementById("btn-collect-keywords")?.addEventListener("click", () => {
      this.showKeywordModal();
    });

    // Add site button
    document.getElementById("btn-add-site")?.addEventListener("click", () => {
      this.showAddSiteModal();
    });

    // Refresh button
    document.getElementById("btn-refresh")?.addEventListener("click", () => {
      this.loadDashboard();
    });
  }

  showSetupModal() {
    document.getElementById("setup-modal").style.display = "flex";
    document.getElementById("api-url").value = window.api.baseUrl || "";
    document.getElementById("api-key").value = window.api.apiKey || "";
  }

  async loadDashboard() {
    try {
      // Check health
      await window.api.health();

      // Load sites first
      const sitesData = await window.api.getSites();
      this.renderSites(sitesData.data.sites);

      if (sitesData.data.sites.length > 0) {
        this.currentSiteId = sitesData.data.sites[0].id;
      }

      // Load analytics summary
      const summary = await window.api.getAnalyticsSummary(this.currentSiteId);
      this.renderStats(summary.data);

      // Load recent content
      const content = await window.api.getContent(this.currentSiteId);
      this.renderContent(content.data.posts);

      // Load backlink stats
      const blStats = await window.api.getBacklinkStats();
      this.renderBacklinkStats(blStats.data);

      // Load pipeline history
      const pipeline = await window.api.getPipelineResults();
      this.renderPipelineHistory(pipeline.data.results);
    } catch (error) {
      this.toast(`Failed to load: ${error.message}`, "error");
    }
  }

  renderStats(data) {
    const container = document.getElementById("stats-grid");
    if (!container) return;

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${data.totalKeywords}</div>
        <div class="stat-label">Total Keywords</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${data.totalKeywords ? (data.usedKeywords / data.totalKeywords * 100) : 0}%"></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.publishedPosts}</div>
        <div class="stat-label">Published Posts</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${data.totalPosts ? (data.publishedPosts / data.totalPosts * 100) : 0}%"></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.liveBacklinks}</div>
        <div class="stat-label">Live Backlinks</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${data.totalBacklinks ? (data.liveBacklinks / data.totalBacklinks * 100) : 0}%"></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.totalPosts}</div>
        <div class="stat-label">Total Content</div>
      </div>
    `;
  }

  renderSites(sites) {
    const container = document.getElementById("sites-list");
    if (!container) return;

    if (sites.length === 0) {
      container.innerHTML = `<div class="empty-state"><h3>No sites configured</h3><p>Add your first site to start.</p></div>`;
      return;
    }

    container.innerHTML = sites
      .map(
        (s) => `
      <div class="card" style="cursor: pointer;" data-site-id="${s.id}">
        <div class="card-header">
          <span class="card-title">${this.escapeHtml(s.name)}</span>
          <span class="badge badge-${s.active ? "success" : "danger"}">${s.active ? "Active" : "Inactive"}</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.85rem;">${this.escapeHtml(s.domain)} &bull; ${this.escapeHtml(s.niche)} &bull; ${this.escapeHtml(s.tier)}</p>
      </div>
    `
      )
      .join("");

    container.querySelectorAll("[data-site-id]").forEach((el) => {
      el.addEventListener("click", () => {
        this.currentSiteId = el.dataset.siteId;
        this.loadDashboard();
        this.toast(`Switched to ${el.querySelector(".card-title").textContent}`);
      });
    });
  }

  renderContent(posts) {
    const container = document.getElementById("content-table");
    if (!container) return;

    if (posts.length === 0) {
      container.innerHTML = `<div class="empty-state"><h3>No content yet</h3><p>Run the pipeline to generate articles.</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Keyword</th>
              <th>Status</th>
              <th>Tier</th>
              <th>Words</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${posts
              .map(
                (p) => `
              <tr>
                <td>${this.escapeHtml(p.title)}</td>
                <td style="color: var(--text-secondary);">${this.escapeHtml(p.keyword)}</td>
                <td><span class="badge badge-${p.status === "published" ? "success" : "warning"}">${p.status}</span></td>
                <td><span class="badge badge-info">${p.tier}</span></td>
                <td>${p.wordCount}</td>
                <td style="color: var(--text-muted); font-size: 0.8rem;">${new Date(p.createdAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="dashboard.viewContent('${p.id}')">View</button>
                  ${p.status === "draft" ? `<button class="btn btn-sm btn-primary" onclick="dashboard.publish('${p.id}')">Publish</button>` : ""}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  renderBacklinkStats(data) {
    const container = document.getElementById("backlink-stats");
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-3">
        <div class="stat-card">
          <div class="stat-value" style="color: var(--success);">${data.live}</div>
          <div class="stat-label">Live</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: var(--warning);">${data.pending}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: var(--danger);">${data.dead}</div>
          <div class="stat-label">Dead</div>
        </div>
      </div>
      <div style="margin-top: 16px;">
        <p style="color: var(--text-secondary); font-size: 0.85rem;">
          <strong>By Platform:</strong> ${Object.entries(data.byPlatform || {}).map(([k, v]) => `${k}: ${v}`).join(" &bull; ") || "None"}
        </p>
        <p style="color: var(--text-secondary); font-size: 0.85rem;">
          <strong>By Tier:</strong> ${Object.entries(data.byTier || {}).map(([k, v]) => `${k}: ${v}`).join(" &bull; ") || "None"}
        </p>
      </div>
    `;
  }

  renderPipelineHistory(results) {
    const container = document.getElementById("pipeline-history");
    if (!container) return;

    if (!results || results.length === 0) {
      container.innerHTML = `<div class="empty-state"><h3>No pipeline runs yet</h3></div>`;
      return;
    }

    container.innerHTML = `
      <div class="activity-log">
        ${results
          .map(
            (r) => `
          <div class="log-entry">
            <span class="log-time">${new Date(r.timestamp).toLocaleString()}</span>
            <span class="log-message">
              <span class="badge badge-${r.success ? "success" : "danger"}">${r.success ? "Success" : "Errors"}</span>
              Keywords: ${r.keywordsCollected} &bull;
              Posts: ${r.postsGenerated} &bull;
              Backlinks: ${r.backlinksCreated} &bull;
              Duration: ${(r.duration / 1000).toFixed(1)}s
              ${r.errors.length > 0 ? `<br><small style="color: var(--danger);">${this.escapeHtml(r.errors[0])}</small>` : ""}
            </span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  async showPipelineModal() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal">
        <h2>Run Pipeline</h2>
        <form id="pipeline-form">
          <div class="form-group">
            <label class="form-label">Seed Keywords (comma-separated)</label>
            <input type="text" class="form-input" id="pipeline-seeds" placeholder="ai tools, make money online, best software" required>
          </div>
          <div class="form-group">
            <label class="form-label">Max Posts</label>
            <select class="form-select" id="pipeline-max-posts">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3" selected>3</option>
              <option value="5">5</option>
            </select>
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="pipeline-backlinks" checked> Generate Backlinks
            </label>
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="pipeline-variations" checked> Create Variations
            </label>
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Run Pipeline</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("pipeline-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const seeds = document.getElementById("pipeline-seeds").value.split(",").map((s) => s.trim()).filter(Boolean);
      const maxPosts = parseInt(document.getElementById("pipeline-max-posts").value, 10);
      const generateBacklinks = document.getElementById("pipeline-backlinks").checked;
      const createVariations = document.getElementById("pipeline-variations").checked;

      modal.remove();
      this.toast("Pipeline started...", "info");

      try {
        const result = await window.api.runPipeline(this.currentSiteId, seeds, {
          maxPosts,
          generateBacklinks,
          createVariations,
        });
        this.toast(
          `Pipeline complete! Posts: ${result.data.postsGenerated}, Backlinks: ${result.data.backlinksCreated}`,
          "success"
        );
        this.loadDashboard();
      } catch (error) {
        this.toast(`Pipeline failed: ${error.message}`, "error");
      }
    });
  }

  showKeywordModal() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal">
        <h2>Collect Keywords</h2>
        <form id="keyword-form">
          <div class="form-group">
            <label class="form-label">Seed Keywords (comma-separated)</label>
            <input type="text" class="form-input" id="kw-seeds" placeholder="ai tools, make money, best apps" required>
          </div>
          <div class="form-group">
            <label class="form-label">Subreddits (optional, comma-separated)</label>
            <input type="text" class="form-input" id="kw-subreddits" placeholder="technology, programming, seo">
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Collect</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("keyword-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const seeds = document.getElementById("kw-seeds").value.split(",").map((s) => s.trim()).filter(Boolean);
      const subreddits = document.getElementById("kw-subreddits").value.split(",").map((s) => s.trim()).filter(Boolean);

      modal.remove();
      this.toast("Collecting keywords...", "info");

      try {
        const result = await window.api.collectKeywords(seeds, subreddits);
        this.toast(`Collected ${result.data.collected} new keywords!`, "success");
        this.loadDashboard();
      } catch (error) {
        this.toast(`Collection failed: ${error.message}`, "error");
      }
    });
  }

  showAddSiteModal() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal">
        <h2>Add New Site</h2>
        <form id="site-form">
          <div class="form-group">
            <label class="form-label">Site Name</label>
            <input type="text" class="form-input" id="site-name" placeholder="My AI Blog" required>
          </div>
          <div class="form-group">
            <label class="form-label">Domain</label>
            <input type="text" class="form-input" id="site-domain" placeholder="username.github.io" required>
          </div>
          <div class="form-group">
            <label class="form-label">Niche</label>
            <input type="text" class="form-input" id="site-niche" placeholder="AI & Technology" required>
          </div>
          <div class="form-group">
            <label class="form-label">GitHub Repo URL</label>
            <input type="text" class="form-input" id="site-repo" placeholder="https://github.com/user/repo" required>
          </div>
          <div class="form-group">
            <label class="form-label">Tier</label>
            <select class="form-select" id="site-tier">
              <option value="main">Main Site</option>
              <option value="tier1">Tier 1 (High Quality)</option>
              <option value="tier2">Tier 2 (Volume)</option>
              <option value="tier3">Tier 3 (Document/Links)</option>
            </select>
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Site</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("site-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("site-name").value.trim();
      const domain = document.getElementById("site-domain").value.trim();
      const niche = document.getElementById("site-niche").value.trim();
      const repoUrl = document.getElementById("site-repo").value.trim();
      const tier = document.getElementById("site-tier").value;

      modal.remove();

      try {
        await window.api.createSite(name, domain, niche, repoUrl, tier);
        this.toast("Site added successfully!", "success");
        this.loadDashboard();
      } catch (error) {
        this.toast(`Failed to add site: ${error.message}`, "error");
      }
    });
  }

  async viewContent(id) {
    try {
      const result = await window.api.getContentById(id);
      const content = result.data;

      const modal = document.createElement("div");
      modal.className = "modal-overlay";
      modal.innerHTML = `
        <div class="modal" style="max-width: 800px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2>${this.escapeHtml(content.title)}</h2>
            <button class="btn btn-sm btn-secondary" onclick="this.closest('.modal-overlay').remove()">&times;</button>
          </div>
          <div class="post-meta" style="margin-bottom: 16px;">
            <span class="badge badge-${content.status === "published" ? "success" : "warning"}">${content.status}</span>
            <span class="badge badge-info">${content.tier}</span>
            <span style="color: var(--text-muted);">${content.meta.wordCount} words &bull; ${content.meta.readingTime} min read</span>
          </div>
          <div style="margin-bottom: 16px;">
            <strong style="font-size: 0.85rem; color: var(--text-secondary);">Tags:</strong>
            ${content.meta.tags.map((t) => `<span class="tag">${this.escapeHtml(t)}</span>`).join(" ")}
          </div>
          <div style="background: var(--bg-secondary); padding: 20px; border-radius: var(--radius-sm); max-height: 400px; overflow-y: auto; font-size: 0.9rem; white-space: pre-wrap; line-height: 1.6;">${this.escapeHtml(content.content)}</div>
          <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
            <button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText(${JSON.stringify(JSON.stringify(content.content))}).then(() => dashboard.toast('Copied!', 'success'))">Copy Markdown</button>
            <button class="btn btn-sm btn-primary" onclick="dashboard.generateVariations('${content.id}'); this.closest('.modal-overlay').remove()">Generate Variations</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (error) {
      this.toast(`Failed to load content: ${error.message}`, "error");
    }
  }

  async publish(id) {
    try {
      await window.api.publishContent(id);
      this.toast("Content published!", "success");
      this.loadDashboard();
    } catch (error) {
      this.toast(`Publish failed: ${error.message}`, "error");
    }
  }

  async generateVariations(id) {
    this.toast("Generating content variations...", "info");
    try {
      const result = await window.api.createVariations(id, [
        { type: "summary", platform: "reddit" },
        { type: "qa", platform: "quora" },
        { type: "tutorial", platform: "dev.to" },
      ]);
      this.toast(
        `Created ${result.data.total} variations!`,
        "success"
      );
    } catch (error) {
      this.toast(`Variation failed: ${error.message}`, "error");
    }
  }

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}

// Global reference for inline event handlers
window.dashboard = null;
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new Dashboard();
});
