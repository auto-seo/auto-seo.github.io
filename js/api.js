// ============================================
// AutoSEO Engine - API Client
// ============================================

class AutoSEOApi {
  constructor() {
    this.baseUrl = localStorage.getItem("autoseo_api_url") || "";
    this.apiKey = localStorage.getItem("autoseo_api_key") || "";
  }

  configure(baseUrl, apiKey) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    localStorage.setItem("autoseo_api_url", this.baseUrl);
    localStorage.setItem("autoseo_api_key", this.apiKey);
  }

  isConfigured() {
    return this.baseUrl && this.apiKey;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }
    return data;
  }

  // --- Health ---
  async health() {
    const response = await fetch(`${this.baseUrl}/api/health`);
    return response.json();
  }

  // --- Keywords ---
  async collectKeywords(seeds, subreddits = []) {
    return this.request("/api/keywords/collect", {
      method: "POST",
      body: JSON.stringify({ seeds, subreddits }),
    });
  }

  async getKeywords(unused = false, limit = 50) {
    return this.request(
      `/api/keywords?unused=${unused}&limit=${limit}`
    );
  }

  async generateLongTail(keyword) {
    return this.request("/api/keywords/longtail", {
      method: "POST",
      body: JSON.stringify({ keyword }),
    });
  }

  // --- Content ---
  async generateContent(keyword, siteId, tier = "main") {
    return this.request("/api/content/generate", {
      method: "POST",
      body: JSON.stringify({ keyword, siteId, tier }),
    });
  }

  async getContent(siteId = "") {
    const params = siteId ? `?siteId=${siteId}` : "";
    return this.request(`/api/content${params}`);
  }

  async getContentById(id) {
    return this.request(`/api/content/${id}`);
  }

  async createVariations(contentId, variations) {
    return this.request("/api/content/vary", {
      method: "POST",
      body: JSON.stringify({ contentId, variations }),
    });
  }

  async rewriteContent(contentId) {
    return this.request("/api/content/rewrite", {
      method: "POST",
      body: JSON.stringify({ contentId }),
    });
  }

  async publishContent(contentId) {
    return this.request("/api/content/publish", {
      method: "POST",
      body: JSON.stringify({ contentId }),
    });
  }

  async refreshLinks(siteId) {
    return this.request("/api/content/refresh-links", {
      method: "POST",
      body: JSON.stringify({ siteId }),
    });
  }

  // --- Backlinks ---
  async generateBacklinks(contentId, mainSiteUrl) {
    return this.request("/api/backlinks/generate", {
      method: "POST",
      body: JSON.stringify({ contentId, mainSiteUrl }),
    });
  }

  async getBacklinks(contentId = "") {
    const params = contentId ? `?contentId=${contentId}` : "";
    return this.request(`/api/backlinks${params}`);
  }

  async getBacklinkStats() {
    return this.request("/api/backlinks/stats");
  }

  async getRedditSnippet(contentId) {
    return this.request("/api/backlinks/snippets/reddit", {
      method: "POST",
      body: JSON.stringify({ contentId }),
    });
  }

  async getQuoraSnippet(contentId) {
    return this.request("/api/backlinks/snippets/quora", {
      method: "POST",
      body: JSON.stringify({ contentId }),
    });
  }

  // --- Analytics ---
  async getAnalyticsSummary(siteId = "") {
    return this.request(
      `/api/analytics/summary?siteId=${siteId}`
    );
  }

  async getPageViews(slug, days = 30) {
    return this.request(
      `/api/analytics/views/${slug}?days=${days}`
    );
  }

  async getTopPerformers(siteId = "", limit = 10) {
    return this.request(
      `/api/analytics/top-performers?siteId=${siteId}&limit=${limit}`
    );
  }

  async getLowPerformers(siteId = "") {
    return this.request(
      `/api/analytics/low-performers?siteId=${siteId}`
    );
  }

  async getPipelineResults() {
    return this.request("/api/analytics/pipeline");
  }

  // --- Sites ---
  async createSite(name, domain, niche, repoUrl, tier = "main") {
    return this.request("/api/sites", {
      method: "POST",
      body: JSON.stringify({ name, domain, niche, repoUrl, tier }),
    });
  }

  async getSites() {
    return this.request("/api/sites");
  }

  async updateSite(id, updates) {
    return this.request(`/api/sites/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteSite(id) {
    return this.request(`/api/sites/${id}`, {
      method: "DELETE",
    });
  }

  // --- Pipeline ---
  async runPipeline(siteId, seeds = [], options = {}) {
    return this.request("/api/pipeline/run", {
      method: "POST",
      body: JSON.stringify({
        siteId,
        seeds,
        maxPosts: options.maxPosts || 3,
        generateBacklinks: options.generateBacklinks !== false,
        createVariations: options.createVariations !== false,
      }),
    });
  }

  async rewriteLowPerformers(siteId, limit = 3) {
    return this.request("/api/pipeline/rewrite-low", {
      method: "POST",
      body: JSON.stringify({ siteId, limit }),
    });
  }
}

// Global instance
window.api = new AutoSEOApi();
