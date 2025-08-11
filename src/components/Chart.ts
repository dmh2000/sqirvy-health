import { Chart as ChartJS, registerables } from 'chart.js';
import type { MealsData, WeightData } from '../types';

// Register Chart.js components
ChartJS.register(...registerables);

export class ChartComponent {
  private static chartInstances: Map<string, ChartJS> = new Map();

  static createCaloriesChart(canvasId: string, mealsData: MealsData, currentDate: string) {
    // Destroy existing chart if it exists
    const existingChart = this.chartInstances.get(canvasId);
    if (existingChart) {
      existingChart.destroy();
    }

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    // Get last 14 days of data
    const last14Days = this.getLast14Days(currentDate);
    const caloriesData = this.getCaloriesDataForDays(mealsData, last14Days);

    const chart = new ChartJS(canvas, {
      type: 'line',
      data: {
        labels: last14Days.map(date => this.formatDateForChart(date)),
        datasets: [
          {
            label: 'Daily Calories',
            data: caloriesData,
            borderColor: '#2196f3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#2196f3',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '14-Day Calorie Intake',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#666',
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              color: '#666',
              font: {
                size: 11
              },
              callback: function(value) {
                return value + ' kcal';
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    this.chartInstances.set(canvasId, chart);
  }

  static createWeightChart(canvasId: string, weightData: WeightData, currentDate: string) {
    // Destroy existing chart if it exists
    const existingChart = this.chartInstances.get(canvasId);
    if (existingChart) {
      existingChart.destroy();
    }

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    // Get last 14 days of data
    const last14Days = this.getLast14Days(currentDate);
    const actualWeights = this.getWeightDataForDays(weightData, last14Days);
    const goalWeights = new Array(14).fill(weightData.weight.goal);

    const chart = new ChartJS(canvas, {
      type: 'line',
      data: {
        labels: last14Days.map(date => this.formatDateForChart(date)),
        datasets: [
          {
            label: 'Actual Weight',
            data: actualWeights,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#4caf50',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Goal Weight',
            data: goalWeights,
            borderColor: '#f44336',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: '#f44336'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '14-Day Weight Progress',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#666',
              font: {
                size: 12
              },
              usePointStyle: true,
              padding: 20
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#666',
              font: {
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              color: '#666',
              font: {
                size: 11
              },
              callback: function(value) {
                return value + ' lbs';
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    this.chartInstances.set(canvasId, chart);
  }

  private static getLast14Days(currentDate: string): string[] {
    const dates: string[] = [];
    const [year, month, day] = currentDate.split('-').map(Number);
    const current = new Date(year, month - 1, day); // Create date in local timezone
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(current);
      date.setDate(current.getDate() - i);
      // Format date using local time instead of UTC
      const localYear = date.getFullYear();
      const localMonth = String(date.getMonth() + 1).padStart(2, '0');
      const localDay = String(date.getDate()).padStart(2, '0');
      dates.push(`${localYear}-${localMonth}-${localDay}`);
    }
    
    return dates;
  }

  private static formatDateForChart(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private static getCaloriesDataForDays(mealsData: MealsData, days: string[]): number[] {
    return days.map(date => {
      const dayMeal = mealsData.meals.find(meal => meal.date === date);
      return dayMeal?.totalKcal || 0;
    });
  }

  private static getWeightDataForDays(weightData: WeightData, days: string[]): (number | null)[] {
    return days.map(date => {
      const weightEntry = weightData.weight.daily.find(entry => entry.date === date);
      return weightEntry?.weight || null;
    });
  }

  static destroyChart(canvasId: string) {
    const chart = this.chartInstances.get(canvasId);
    if (chart) {
      chart.destroy();
      this.chartInstances.delete(canvasId);
    }
  }

  static destroyAllCharts() {
    this.chartInstances.forEach(chart => chart.destroy());
    this.chartInstances.clear();
  }
}