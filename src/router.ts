import type { AppState } from './types';
import { Dashboard } from './components/Dashboard';
import { MealsPage } from './components/MealsPage';
import { WeightPage } from './components/WeightPage';

export class Router {
  private state: AppState;
  private container: HTMLElement;

  constructor() {
    this.state = {
      currentPage: 'dashboard',
      currentDate: new Date().toISOString().split('T')[0],
      mealsData: null,
      weightData: null
    };
    
    this.container = document.getElementById('app')!;
    this.init();
  }

  private init() {
    this.render();
    this.setupNavigation();
    
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });
  }

  private setupNavigation() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('[data-route]')) {
        e.preventDefault();
        const route = target.getAttribute('data-route') as AppState['currentPage'];
        this.navigateTo(route);
      }
    });
  }

  public navigateTo(page: AppState['currentPage']) {
    this.state.currentPage = page;
    history.pushState({ page }, '', `#${page}`);
    this.render();
  }

  private handleRouteChange() {
    const hash = window.location.hash.slice(1) as AppState['currentPage'];
    if (['dashboard', 'meals', 'weight'].includes(hash)) {
      this.state.currentPage = hash;
      this.render();
    }
  }

  private render() {
    // Clean up any existing charts before re-rendering
    this.cleanupCurrentPage();
    
    const nav = this.createNavigation();
    let content = '';

    switch (this.state.currentPage) {
      case 'dashboard':
        content = Dashboard.render(this.state);
        break;
      case 'meals':
        content = MealsPage.render(this.state);
        break;
      case 'weight':
        content = WeightPage.render(this.state);
        break;
    }

    this.container.innerHTML = `
      ${nav}
      <main class="main-content">
        ${content}
      </main>
    `;

    // Initialize component-specific JavaScript
    this.initializeCurrentPage();
  }

  private cleanupCurrentPage() {
    // Clean up resources from the current page before switching
    if (this.state.currentPage === 'dashboard') {
      Dashboard.cleanup();
    }
  }

  private createNavigation(): string {
    const isActive = (page: string) => this.state.currentPage === page ? 'active' : '';
    
    return `
      <nav class="navbar">
        <div class="nav-container">
          <h1 class="nav-title">Sqirvy Health</h1>
          <ul class="nav-links">
            <li><a href="#dashboard" data-route="dashboard" class="${isActive('dashboard')}">Dashboard</a></li>
            <li><a href="#meals" data-route="meals" class="${isActive('meals')}">Meals</a></li>
            <li><a href="#weight" data-route="weight" class="${isActive('weight')}">Weight</a></li>
          </ul>
        </div>
      </nav>
    `;
  }

  private initializeCurrentPage() {
    switch (this.state.currentPage) {
      case 'dashboard':
        Dashboard.init(this.state);
        break;
      case 'meals':
        MealsPage.init(this.state);
        break;
      case 'weight':
        WeightPage.init(this.state);
        break;
    }
  }

  public updateState(updates: Partial<AppState>) {
    this.state = { ...this.state, ...updates };
    this.render();
  }

  public getState(): AppState {
    return { ...this.state };
  }
}