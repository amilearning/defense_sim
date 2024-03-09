import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'ol/ol.css';
import Map from 'ol/Map';
import { Tab, Tabs } from '@mui/material';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Circle as CircleStyle, Fill, Stroke, Style , Text} from 'ol/style';
import LineString from 'ol/geom/LineString';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat, toLonLat } from 'ol/proj'; // Import fromLonLat function
import './App.css'; // Import CSS for styling
import XYZ from 'ol/source/XYZ';

import HorizontalBarPlot from './barcharts'; // Adjust the path as per your file structure
import MissileTrajectory from './missiles'; // Adjust the path as per your file structure

const baseURL = 'http://127.0.0.1:5000'; // Base URL of your Flask backend



class App extends React.Component {
    
  constructor(props) {
    super(props);
    this.state = {
      defenseAreas: [],
      adjacencyMatrix: [],
      displayMatrix: [],
      selectedTab: 0,
      map:null,
      vectorLayer:null,
      vectorSource:null,
      mapKey: 0, // Add this line,
      mapreset:true,
      missileTrajectory: null,
      clock_var:true,
      missile_to_view:null
    };
    
  };

  
  
  initMissileTrajectory = () => {
    const { map, vectorSource } = this.state;
    if (map && vectorSource) {
      const missileTrajectory = new MissileTrajectory(map, vectorSource);
      this.setState({ missileTrajectory }); // Set missileTrajectory in the state
    }
  };
  
  generateRandomProbabilities = (numScenarios) => {
    const probabilities = [];
    for (let i = 0; i < numScenarios; i++) {
      probabilities.push(Math.random()*0.3);//Math.random());
    }
    return probabilities;
  }

  generateMissileDropdown = () => {
    if(!this.state.missileTrajectory){    
      return;
    }  else{
      const { missiles } = this.state.missileTrajectory;  
      return (
        <select onChange={this.handleMissileDropdownChange}>
          <option value="">Select Missile</option>
          {missiles.map((missile, index) => (
            <option key={index} value={index}>{`Missile ${index}`}</option>
          ))}
        </select>
      );
    }
    
  };

  
handleMissileDropdownChange = (event) => {
  const selectedIndex = event.target.value;
  
  this.setState({ missile_to_view: selectedIndex });
  console.log(selectedIndex)
  // Handle the selected missile here
};

  
  
  generateBarPlots = (defenseAreas) => {
    
    if(!this.state.missile_to_view){
      
      return;      
    }
   
    if(!Number.isInteger(parseFloat(this.state.missile_to_view))){
      return;
    }

    if (!defenseAreas || defenseAreas.length === 0) {
      console.error('Invalid defense areas or number of scenarios.');
      return null;
    }

    const barPlots = [];

    for (let i = 0; i < defenseAreas.length; i++) {
      const defenseArea = defenseAreas[i];
      

      
    } 
    const defenseArea = defenseAreas;
    const probabilities = this.generateRandomProbabilities(defenseAreas.length);
    // barPlots.push(<HorizontalBarPlot key={defenseArea.id} defenseAreas={defenseAreas} probabilities={probabilities} />);
    
    return<HorizontalBarPlot key={defenseArea.id} defenseAreas={defenseAreas} probabilities={probabilities} />;
  }

  visualizeSingleImpact = async (area_id) => {
    this.state.mapreset = true;
    try {
    // const area_id = prompt('area_id:');
    const response = await axios.post(`${baseURL}/api/single-impact-analysis`, { area_id });
    // Access class attributes using this.state
    // For example: this.state.defenseAreas
    
    this.setState({
      displayMatrix: response.data.reachability_matrix,
    });

    

    // Refresh defense areas after adding
  } catch (error) {
    console.error('Error reachability:', error);
  }
  

  } 

 

  MapComponent = ({ defenseAreas, matrix_in}) => {
    
    useEffect(() => {
      const seoulCoordinates = fromLonLat([126.9779, 37.5665]);
     
      // Check if map and vectorLayer are already created
      if (this.state.mapreset == true) {
        this.state.mapreset = false;
        if (this.state.map != null) {
          // Destroy the map instance if it exists
          this.state.map.dispose(); // or any other method to destroy the map
          // Set the map state to null or any initial value
          this.setState({ map: null });
        }
        
        const map = new Map({
          target: 'map',
          layers: [
            new TileLayer({
              source: new XYZ({
                url: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
              }),
            }),
          ],
          view: new View({
            center: seoulCoordinates,
            zoom: 7,
          }),
        });
        
        
        const vectorSource = new VectorSource();
        const vectorLayer = new VectorLayer({
          source: vectorSource,
        });
        
      
        map.addLayer(vectorLayer);
        map.on('click', this.handleMapClick);
  
        // Set state with map, vectorLayer, and vectorSource
        this.setState({
          map: map,
          vectorLayer: vectorLayer,
          vectorSource: vectorSource
        }, () => {
          // This callback function will be executed after state is updated
          this.drawLinesBetweenDefenseAreas(defenseAreas, matrix_in, vectorSource);
          
          console.log("nodes and edges are added");
          console.log("map is init")
        
        });

        // this.drawLinesBetweenDefenseAreas(defenseAreas, matrix_in, this.state.vectorSource);
       
      }else{
        
       
        // const map = this.state.map;
        if (this.state.missileTrajectory !=null){
          // this.initMissileTrajectory();
          this.state.missileTrajectory.setMapAndVectorSource(this.state.map, this.state.vectorSource);
          this.state.missileTrajectory.start();
          const { map, vectorSource } = this.state.missileTrajectory;
          this.setState({
            map: map,
            vectorSource: vectorSource
          });
          
        }
        
      }
      
      return () => {
       
        // Clean up function
        // No need to set map and vectorLayer to null as we are keeping them in state
      };
    }, [defenseAreas, matrix_in]);
  
    return <div id="map" style={{ width: '50%', height: '100vh', float: 'right' }}></div>;
  };

  handleLaunchMissileAll= (index) =>{
    this.state.missileTrajectory.launch_missiles();
    console.log("all missiles are launched");
  }

  handleLaunchMissile = async () => {
    try {
      const missile_id = prompt('Enter missile idx to launch');
      if (missile_id !== null && !isNaN(missile_id) && Number.isInteger(parseFloat(missile_id))) {
        
          this.state.missileTrajectory.launch_missile(missile_id);
          console.log("missile is launched");
        }
      
    } catch (error) {
      console.error('Error adding defense area:', error);
    }
  };

  handleAddMissile = async () => {
    try {
      const area_id = prompt('Enter target defense area ID:');
      // const missile_id = prompt('Enter missile ID:');
      if (area_id !== null && !isNaN(area_id) && Number.isInteger(parseFloat(area_id))) {
        
        const target_area =  this.state.defenseAreas.find(area => area._id === area_id);
        if (target_area !== null){
          const { lon: tar_lon, lat: tar_lat } = target_area.tags;
          this.state.missileTrajectory.add_missile( parseFloat(tar_lat), parseFloat(tar_lon));
          console.log("missile is added");
        }
      }
    } catch (error) {
      console.error('Error adding defense area:', error);
    }
  };

 
  handleMissileInit = (index) => {        
   
      this.initMissileTrajectory(() => {
    // Callback function to start missile trajectory after initialization
    this.state.missileTrajectory.start();
      });
   
   
    
  };

    handleMapClick = async (event) => {
      console.log("clicked");
      this.state.mapreset = true;
      
      try {
        const coordinate = event.coordinate;
        const lonLat = toLonLat(coordinate);
        const [longitude, latitude] = lonLat;
        // const clickedCoordinate = this.state.map.getCoordinateFromPixel(event.pixel);
        const lon_val = longitude.toString();
        const lat_val = latitude.toString();
        
        const area_id = prompt('Enter defense area ID:');
        if (area_id !== null && !isNaN(area_id) && Number.isInteger(parseFloat(area_id))) {
        const value_ = prompt('Enter value:');
        const tags_input = `lat:${lat_val},lon:${lon_val},value:${value_}`;
        
        await axios.post(`${baseURL}/api/add-defense-area`, { area_id, tags: tags_input });
        this.fetchDefenseAreas();
        }
      } catch (error) {
        console.error('Error adding defense area:', error);
      }
      // const { map, vectorSource } = this.state;
      

     
     
    }


  AdjacencyMatrix({ adjacencyMatrix,defenseAreas }) {
    const idsArray = defenseAreas.map(area => area._id);
    return (
      <div>
        <h2>Adjacency Matrix</h2>
        <table className="adjacency-matrix">
          <thead>
            <tr>
              <th></th>
              {adjacencyMatrix.map((_, index) => (
                <th key={index}># {idsArray[index]} Area</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adjacencyMatrix.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th># {idsArray[rowIndex]} Area</th>
                {row.map((value, colIndex) => (
                  <td key={`${rowIndex}-${colIndex}`}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Define DefenseAreaTable as a method inside the App class
  DefenseAreaTable = ({ defenseAreas }) => {
    return (
      <div style={{ maxHeight: '300px', overflowY: 'scroll', maxWidth: '50vw' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Tags</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>ImpactAnalysis</th>
            </tr>
          </thead>
          <tbody>
            {defenseAreas.map((area) => (
              <tr key={area._id}>
                <td style={{ border: '1px solid black', padding: '8px' }}>{area._id}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {Object.entries(area.tags).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}: </strong>
                        {value}
                      </li>
                    ))}
                  </ul>
                </td>
                <td style={{ border: '1px solid black', padding: '8px' }}>
                  <button onClick={() => this.visualizeSingleImpact(area._id)}>apply</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };


 // Define a function to create a gradient style for the LineString
 

 drawLinesBetweenDefenseAreas(defenseAreas, adjacencyMatrix, vectorSource) {
 
  defenseAreas.forEach((area, sourceIndex) => {
    const { lon: lon1, lat: lat1 } = area.tags;
    const coords1 = fromLonLat([parseFloat(lon1), parseFloat(lat1)]);
   

    const value = parseInt(area.tags.value); // Default value if 'value' tag is not present
    const markerStyle = new Style({
      image: new CircleStyle({
          radius: value, // Use the value of the 'value' tag here
          fill: new Fill({ color: 'red' }),
          stroke: new Stroke({ color: 'red', width: 1 }),
      }),
      text: new Text({
          text: area._id.toString(), // Convert value to string and set as text
          font: '15px Arial', // Set the font size and family
          fill: new Fill({ color: '#fff' }) // Set the text color
      })
  });

  const sourcePoint = new Feature({
    geometry: new Point(coords1),
  });
 

    sourcePoint.setStyle(markerStyle);
    vectorSource.addFeature(sourcePoint);
    
    adjacencyMatrix[sourceIndex].forEach((weight, targetIndex) => {
      if (weight !== 0 && targetIndex !== sourceIndex) {
        const { lon: lon2, lat: lat2 } = defenseAreas[targetIndex].tags;
        const coords2 = fromLonLat([parseFloat(lon2), parseFloat(lat2)]);
        const targetPoint = new Feature({
          geometry: new Point(coords2),
        });
        
        const line = new Feature({
          geometry: new LineString([coords1,coords2]),   
        });

        const lineString = new LineString([coords1,coords2]);
       
        // Calculate the total length of the line string
        const totalLength = lineString.getLength();

        // Define the start and end colors for the gradient
        const startColor = [255, 0, 0]; // Red
        const endColor = [0, 0, 255];   // Blue

        // Create a vector source and layer
        

        // Divide the line string into smaller segments and assign colors
        const numSegments = 4;
        for (let i = 0; i < numSegments-1; i++) {
          const fraction = i / (numSegments - 1);
          const color = [
            startColor[0] + (endColor[0] - startColor[0]) * fraction,
            startColor[1] + (endColor[1] - startColor[1]) * fraction,
            startColor[2] + (endColor[2] - startColor[2]) * fraction,
          ];

          // Create a feature for each segment with the corresponding style
          const segment = lineString.getCoordinateAt(fraction);
          const start_segment = lineString.getCoordinateAt( i / (numSegments - 1));
          const end_segment = lineString.getCoordinateAt( (i+1) / (numSegments - 1));
          
          const style = new Style({
            stroke: new Stroke({
              color: `rgb(${color.join(',')})`,
              width: weight,
            }),
          });
          const segmentFeature = new Feature({
            geometry: new LineString([start_segment, end_segment]),
          });
         
          segmentFeature.setStyle(style);
          vectorSource.addFeature(segmentFeature);
        }
        // const canvas = document.createElement('canvas');
        // const context = canvas.getContext('2d');
        
        // // Define the start and end colors
        // const startColor = 'green';
        // const middleColor = 'blue';
        // const endColor = 'red';
        
        // // Create a linear gradient
        // const canvasGradient = context.createLinearGradient(coords1[0], coords1[1], coords2[0], coords2[1]);
        // canvasGradient.addColorStop(0, startColor); // Start color
        // canvasGradient.addColorStop(0.5, middleColor); // Color at the midpoint (50%)
        // canvasGradient.addColorStop(1, endColor);   // End color
        // context.fillStyle = canvasGradient;
        // context.fillRect(coords1[0], coords1[1], canvas.width, canvas.height);
        // const canvasImage = canvas.toDataURL();
        // const image = new Image();
        // image.src = canvasImage;

        
        // Create the stroke style using the canvas gradient
        // const stroke = new Stroke({
        //     width: weight,                  // Width of the stroke
        //     color: canvasGradient          // Use the canvas gradient as the stroke color
        // });
        
        // // Define the line style with the gradient stroke
        // const lineStyle = new Style({
        //     stroke: stroke
        // });
        
        targetPoint.setStyle(markerStyle);
        // line.setStyle(lineStyle);
        
        // vectorSource.addFeature(line);
        
      }
    });
  });
}


  // componentDidMount() {
  //   this.fetchDefenseAreas();
  //   this.intervalId = setInterval(this.fetchDefenseAreas, 1000); // Fetch defense areas every 1 second
  //   this.intervalId2 = setInterval(this.generateBarPlots, 1000); // Update bar plots every 1 second
  // }

  updateBarPlots = () => {
    const { defenseAreas } = this.state;
    if (defenseAreas && defenseAreas.length > 0) {
      this.generateBarPlots(defenseAreas);
    }
  };
  clock_interval = () => {
    this.setState(prevState => ({
      clock_var: !prevState.clock_var
    }));
  };

  componentDidMount() {
    this.fetchDefenseAreas(); // Initial fetch
    this.intervalId = setInterval(this.fetchDefenseAreas, 500); // Fetch defense areas every 1 second
    this.intervalId2 = setInterval(this.clock_interval, 100); // Update bar plots every 1 second
  }

  // componentDidMount() {
  //   this.fetchDefenseAreas();
  //   this.intervalId = setInterval(this.fetchDefenseAreas, 10000);
    
  // }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    clearInterval(this.intervalId2);
  }


  fetchDefenseAreas = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/defense-areas`);
      this.setState({
        defenseAreas: response.data.defenseAreas,
        adjacencyMatrix: response.data.adjacencyMatrix,        
      });

    } catch (error) {
      console.error('Error fetching defense areas:', error);
    }
  };

  


  handleTabClick = (index) => {
    this.setState({ selectedTab: index });
      
  };

  handleAddDefenseArea = async () => {
    try {
      const area_id = prompt('Enter defense area ID:');
      if (area_id !== null && !isNaN(area_id) && Number.isInteger(parseFloat(area_id))) {
      const tags_input = prompt('Enter tags (format: key:value,key2:value2):');
      
      await axios.post(`${baseURL}/api/add-defense-area`, { area_id, tags: tags_input });
      this.fetchDefenseAreas();
      }
    } catch (error) {
      console.error('Error adding defense area:', error);
    }
  };

  
  handleAddEdge = async () => {
    try {
      const source_id = prompt('Enter Source ID:');
      if (source_id !== null && !isNaN(source_id) && Number.isInteger(parseFloat(source_id))) {
      const target_id = prompt('Enter target ID:');
      const weight = prompt('Enter weight');
      await axios.post(`${baseURL}/api/add-edges`, { source_id, target_id, weight });      
      this.resetdisplayMatrix();
      }
    } catch (error) {
      console.error('Error adding defense area:', error);
    }
  };


  resetdisplayMatrix= async () => {
    
    const {adjacencyMatrix} = this.state;
    console.log(this.state.adjacencyMatrix)
    try {
      // Reset the displayMatrix state to an empty array
      this.setState({ displayMatrix: this.state.adjacencyMatrix,
                    mapreset: true });

      console.log("Matrix reset successfully.");
    } catch (error) {
      console.error("Error resetting matrix:", error);
    }
    // this.setState({displayMatrix:adjacencyMatrix});
    this.state.mapreset=true
  };


  render() {
    const { defenseAreas, adjacencyMatrix, displayMatrix,selectedTab } = this.state;
   
    let matrix_input;
    if (displayMatrix.length === 0) {
      matrix_input = adjacencyMatrix;      
    } else {
      matrix_input = displayMatrix;      
    }
    if (defenseAreas.length <=0){
      
      return null;
    }
    return (
      <div className="MainComponent">
        <div className="left-panel" style={{ flex: '1', marginRight: '50 px' }}>
          <div className="tabs-container">
            <div className={`tab ${selectedTab === 0 ? 'active' : ''}`} onClick={() => this.handleTabClick(0)}>
              Defense Areas
            </div>
            <div className={`tab ${selectedTab === 1 ? 'active' : ''}`} onClick={() => this.handleTabClick(1)}>
              Adjacency Matrix
            </div>
          </div>
          <div className="tab-content">
            {selectedTab === 0 && <this.DefenseAreaTable defenseAreas={defenseAreas} />}
            {selectedTab === 1 && <this.AdjacencyMatrix adjacencyMatrix={matrix_input} defenseAreas={defenseAreas} />}
          </div>
          <div>
            <button onClick={this.handleAddDefenseArea}>Add Defense Area</button>
            <button onClick={this.handleAddEdge}>Add Edge</button>
            <button onClick={this.resetdisplayMatrix}>reset_adj_mtx</button>
            <button onClick={this.handleMissileInit}>Init Missile</button>
            <button onClick={this.handleAddMissile}>Add Missile</button>
            <button onClick={this.handleLaunchMissile}>Launch Missile</button>
            <button onClick={this.handleLaunchMissileAll}>Launch All Missiles</button>
          </div>
          {this.generateMissileDropdown()}
          {this.generateBarPlots(defenseAreas)}
        </div>       
         {<this.MapComponent  defenseAreas={defenseAreas} matrix_in={matrix_input}/>}
      </div>
    );
  }
}

export default App;