import './style.css'
import { Router } from './router'
import { NotificationManager } from './utils/notifications'

// Initialize the Sqirvy Health application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize notification system
  NotificationManager.init();
  
  // Initialize router
  new Router();
  
  // Add global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    NotificationManager.error('An unexpected error occurred. Please refresh the page.');
  });
  
  // Add global promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    NotificationManager.error('A network error occurred. Please check your connection.');
    event.preventDefault();
  });
});
