import React, { Component } from 'react';
import Chart from 'chart.js/auto';

class BetaHorizontalBarPlot extends Component {
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
    const { defenseAreas, probabilities, target_idx } = this.props;
  
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
    
    const customColors = areaIds.map(areaId => {
      // Add your conditions to determine custom colors based on areaIds
      if (parseInt(areaId) === target_idx) {
        return 'rgba(255, 99, 132, 0.5)'; // Red color with transparency      
      } else {
        return 'rgba(0, 255, 0, 0.3)'; // Default color with transparency
      }
    });


    // Create a new chart instance with animation disabled
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: areaIds,
        datasets: [{
          label: 'Beta',
          data: probabilities,
          // backgroundColor: 'rgba(54, 162, 235, 0.5)',
          backgroundColor: customColors,
          borderColor: 'rgba(54, 162, 235, 1.0)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,        
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



  render() {
    return <canvas ref={this.chartRef} />;
  }
}

export default BetaHorizontalBarPlot;