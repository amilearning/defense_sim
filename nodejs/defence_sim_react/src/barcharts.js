import React, { Component } from 'react';
import Chart from 'chart.js/auto';

class HorizontalBarPlot extends Component {
  constructor(props) {
    super(props);
    this.chartRef = React.createRef();
    this.chartInstance = null;
  }

  componentDidMount() {
    this.buildChart();
  }

  componentDidUpdate() {
    this.buildChart();
  }

  componentWillUnmount() {
    // Destroy the chart instance when the component unmounts
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
  buildChart() {
    const { defenseAreas, probabilities } = this.props;
  
    if (!defenseAreas || !probabilities || probabilities.length === 0) {
      console.error('Invalid data for bar plot.');
      return;
    }
  
    const ctx = this.chartRef.current.getContext('2d');
    const areaIds = defenseAreas.map(defenseArea => defenseArea._id);
    
    // Destroy the previous chart instance if it exists
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  
    // Create a new chart instance with animation disabled
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: areaIds,
        datasets: [{
          label: 'Probability of being attacked',
          data: probabilities,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1.0)',
          borderWidth: 2
        }]
      },
      options: {
        indexAxis: 'x',
        scales: {
          x: {
            beginAtZero: true
          }
        },
        animation: {
          duration: 0 // Set duration to 0 to disable animation
        }
      }
    });
  }

  // buildChartanimated() {
  //   const { defenseAreas, probabilities } = this.props;

  //   if (!defenseAreas || !probabilities || probabilities.length === 0) {
  //     console.error('Invalid data for bar plot.');
  //     return;
  //   }

  //   const ctx = this.chartRef.current.getContext('2d');
  //   const areaIds = defenseAreas.map(defenseArea => defenseArea._id);
    
  //   // Destroy the previous chart instance if it exists
  //   if (this.chartInstance) {
  //     this.chartInstance.destroy();
  //   }

  //   // Create a new chart instance
  //   this.chartInstance = new Chart(ctx, {
  //     type: 'bar',
  //     data: {
  //       labels: areaIds,
  //       datasets: [{
  //         label: 'Probability of being attacked',
  //         data: probabilities,
  //         backgroundColor: 'rgba(54, 162, 235, 1.0)',
  //         borderColor: 'rgba(54, 162, 235, 1)',
  //         borderWidth: 2
  //       }]
  //     },
  //     options: {
  //       indexAxis: 'x',
  //       scales: {
  //         x: {
  //           beginAtZero: true
  //         }
  //       }
  //     }
  //   });
  // }

  render() {
    return <canvas ref={this.chartRef} />;
  }
}

export default HorizontalBarPlot;