export class LoadingManager {
  private static activeLoaders = new Set<string>();

  static show(target: string | HTMLElement, text: string = 'Loading...') {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) return;

    const loaderId = typeof target === 'string' ? target : 'element-' + Date.now();
    this.activeLoaders.add(loaderId);

    // Create loader
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">${text}</div>
      </div>
    `;

    // Add to element
    element.style.position = 'relative';
    element.appendChild(loader);

    return loaderId;
  }

  static hide(target: string | HTMLElement) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) return;

    const loader = element.querySelector('.loading-overlay');
    if (loader) {
      loader.remove();
    }

    const loaderId = typeof target === 'string' ? target : 'element-' + Date.now();
    this.activeLoaders.delete(loaderId);
  }

  static showGlobal(text: string = 'Loading...') {
    const existing = document.getElementById('global-loader');
    if (existing) return;

    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'global-loading-overlay';
    loader.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">${text}</div>
      </div>
    `;

    document.body.appendChild(loader);
  }

  static hideGlobal() {
    const loader = document.getElementById('global-loader');
    if (loader) {
      loader.remove();
    }
  }
}