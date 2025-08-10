export class NotificationManager {
  private static container: HTMLElement | null = null;

  static init() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  }

  static show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 4000) {
    this.init();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = this.getIcon(type);
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close">&times;</button>
      </div>
    `;
    
    // Add to container
    this.container!.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('notification-show'), 10);
    
    // Auto dismiss
    const timeoutId = setTimeout(() => this.dismiss(notification), duration);
    
    // Manual dismiss
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn?.addEventListener('click', () => {
      clearTimeout(timeoutId);
      this.dismiss(notification);
    });
    
    return notification;
  }

  static success(message: string, duration?: number) {
    return this.show(message, 'success', duration);
  }

  static error(message: string, duration?: number) {
    return this.show(message, 'error', duration || 6000); // Longer for errors
  }

  static warning(message: string, duration?: number) {
    return this.show(message, 'warning', duration);
  }

  static info(message: string, duration?: number) {
    return this.show(message, 'info', duration);
  }

  private static dismiss(notification: HTMLElement) {
    notification.classList.add('notification-hide');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  private static getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  }
}