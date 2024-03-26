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
      missionInfo: [],
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
      missile_to_view:null,
      intent_result:null,
      beta_result:null
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
      probabilities.push(Math.random()*0.3);
    }
    return probabilities;
  }

  
  generateMissileTypeDropdown = () => {
    if(!this.state.missileTrajectory){    
      return;
    }  else{
      const { missiles } = this.state.missileTrajectory;  
      return (
        <select onChange={this.handleMissileTypeDropdownChange}>
          <option value="">Select Missile Type</option>
          <option value="">N</option>
          <option value="">K</option>
          <option value="">B</option>          
        </select>
      );
    }
    
  };

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

  
  
  handleMissileTypeDropdownChange = (event) => {
  const selectedIndex = event.target.value;  
  // this.setState({ missile_to_view: selectedIndex });
  console.log(selectedIndex)
  // Handle the selected missile here
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
   
    if(!Number.isInteger(parseInt(this.state.missile_to_view))){
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
    // const probabilities = this.generateRandomProbabilities(defenseAreas.length);
    // barPlots.push(<HorizontalBarPlot key={defenseArea.id} defenseAreas={defenseAreas} probabilities={probabilities} />);
    console.log('Response with result:', this.state.intent_result);
    console.log('this.state.missile_to_view:', this.state.missile_to_view);    
    const probabilities = this.extractProbabilitiesForMissile(this.state.intent_result, parseInt(this.state.missile_to_view));
    const missile_target_defense_indx = this.state.missileTrajectory.missiles[parseInt(this.state.missile_to_view)].id
    const betas = this.extractBetafromMissile(this.state.beta_result, parseInt(this.state.missile_to_view));

    console.log('probabilities with result:', probabilities);

      
    // for (let i = 0; i < numScenarios; i++) {
    //   probabilities.push(Math.random()*0.3);
    // }
    
    
    const horizontalBarPlot = <HorizontalBarPlot key={defenseArea.id} defenseAreas={defenseAreas} probabilities={probabilities} target_idx={missile_target_defense_indx}/>;

    // New HorizontalBarPlot or your new bar chart component
    // Adjust the key, and any other props as necessary
    const betaBarplot =  <HorizontalBarPlot key={defenseArea.id} defenseAreas={defenseAreas} probabilities={betas} target_idx={missile_target_defense_indx}/>;
  

    // return<HorizontalBarPlot key={defenseArea.id} defenseAreas={defenseAreas} probabilities={probabilities} target_idx={missile_target_defense_indx}/>;
    return (
      <div>
        {horizontalBarPlot}      
        {betaBarplot}
      </div>
    );
  }

  extractProbabilitiesForMissile = (response, missileId) => {
    // Initialize an object to store probabilities for defense areas
    const probabilities = [];
    let missileTarget = response[missileId].target;
    for (let i = 0; i < this.state.defenseAreas.length; i++) {
        let defenseAreaId = this.state.defenseAreas[i]._id;
          // Check if the defense area is targeted by the current missile          
            // Get the probability of being targeted by the current missile
            let probability = missileTarget[defenseAreaId];            
            // Append the probability to the probabilities array
            probabilities.push(probability);
    }
      
    return probabilities;
  };

  
  extractBetafromMissile = (response, missileId) => {
    // Initialize an object to store betas for defense areas
    const betas = [];
    let missileTarget = response[missileId].beta;
    for (let i = 0; i < this.state.defenseAreas.length; i++) {
        let defenseAreaId = this.state.defenseAreas[i]._id;
          // Check if the defense area is targeted by the current missile          
            // Get the probability of being targeted by the current missile
            let beta = missileTarget[defenseAreaId];            
            // Append the probability to the betas array
            betas.push(beta);
    }
      
    return betas;
  };



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
          this.state.missileTrajectory.add_missile( parseInt(area_id), parseFloat(tar_lat), parseFloat(tar_lon));
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
        const spec_tag = prompt('Enter other tags, e.g.unit:tank');
        const tags_input = `lat:${lat_val},lon:${lon_val},value:${value_},${spec_tag}`;
        
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
      <div style={{ maxHeight: '100px', overflowY: 'scroll', maxWidth: '50vw' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Mission Group</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Tags</th>              
              <th style={{ border: '1px solid black', padding: '8px' }}>ImpactAnalysis</th>
            </tr>
          </thead>
          <tbody>
            {defenseAreas.map((area) => (
              <tr key={area._id}>
                <td style={{ border: '1px solid black', padding: '8px' }}>{area._id}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{area.msgroup}</td>
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

  handleMissionInfoCheckboxChange = async (index) =>  {
    const updatedMissionInfo = [...this.state.missionInfo];
    updatedMissionInfo[index].status = !updatedMissionInfo[index].status;
    this.setState({ missionInfo: updatedMissionInfo }, async () => {
      const { _id, msgroup, status } = updatedMissionInfo[index];
          
      try {
        await axios.post(`${baseURL}/api/update-msinfo`, { _id, msgroup, status });
      } catch (error) {
        console.error('Error updating status:', error);
        // Revert the status change if API call fails
        updatedMissionInfo[index].status = !updatedMissionInfo[index].status;
        this.setState({ missionInfo: updatedMissionInfo });
      }
      this.fetchMissionInfo();
      //////////////////////
      setTimeout(this.resetdisplayMatrix, 500);
      
    });
    
  };

  MissionTable = ({ missionInfo }) => {
    return (
      <div>
      <h2>Mission Information</h2>
      <table>
        <thead>
          <tr>
            <th>Mission ID</th>
            <th>Status</th>
            <th>Mission Group</th>
          </tr>
        </thead>
        <tbody>
          {missionInfo.map((mission, index) => (
            <tr key={index}>
              <td>{mission._id}</td>
              <td>
                <input
                  type="checkbox"
                  checked={mission.status}
                  onChange={() => this.handleMissionInfoCheckboxChange(index)}
                />
              </td>
              <td>{mission.msgroup}</td>
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
    tag: 'defensearea' 
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
            tag: 'edges' 
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
    this.intervalId2 = setInterval(this.clock_interval, 100); // Update bar plots every 100 ,icrosecond
    this.intervalId = setInterval(this.fetchDefenseAreas, 100); // Fetch defense areas every 0.5 second    
    this.intervalId4 = setInterval(this.updateMissileMeasurements, 100); // Fetch defense areas every 0.5 second        
    this.intervalId4 = setInterval(this.updateBetas, 100); // Fetch defense areas every 0.5 second        
    this.intervalId3 = setInterval(this.fetchMissionInfo, 10000); // Fetch defense areas every 3 second
  }

  // componentDidMount() {
  //   this.fetchDefenseAreas();
  //   this.intervalId = setInterval(this.fetchDefenseAreas, 10000);
    
  // }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    clearInterval(this.intervalId2);
    clearInterval(this.intervalId3);
    clearInterval(this.intervalId4);
  }


  
  updateMissileMeasurements = async () => {
    try {
      // Access missiles directly from the MissileTrajectory instance
     
      const { missiles } = this.state.missileTrajectory;  
      // Create an array to store measurements for each missile
      const missileMeasurements = missiles.map(missile => ({
        id: missile.id,
        lat: missile.lat,
        lon: missile.lon,
        launched : missile.launched,
      }));
      
      // Make a POST request to your backend API with the missile measurements
      const response = await axios.post(`${baseURL}/api/update-missiles-measurements`, { missileMeasurements });
      if (response.data && response.data.result !== null) {
        // Handle the response with "result"        
        this.setState({intent_result: response.data.result});
      } else {
        // Handle the response without "result" or with "result" being None        
      }
      // Handle the response if needed
    } catch (error) {
      console.error('Error updating missile measurements:', error);
    }
  };

  
  updateBetas = async () => {
    try {
      // Access missiles directly from the MissileTrajectory instance
     
      const { missiles } = this.state.missileTrajectory;  
      // Create an array to store measurements for each missile
      const missileMeasurements = missiles.map(missile => ({
        id: missile.id,
        lat: missile.lat,
        lon: missile.lon,
        launched : missile.launched,
      }));
      
      // Make a POST request to your backend API with the missile measurements
      const response = await axios.post(`${baseURL}/api/update-beta`, { missileMeasurements });
      if (response.data && response.data.result !== null) {
        // Handle the response with "result"        
        this.setState({beta_result: response.data.result});
      } else {
        // Handle the response without "result" or with "result" being None        
      }
      // Handle the response if needed
    } catch (error) {
      console.error('Error updating missile measurements:', error);
    }
  };




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

  
  fetchMissionInfo = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/get-msinfo`);
      this.setState({
        missionInfo: response.data.missionInfo        
      });

    } catch (error) {
      console.error('Error fetching Mission Info:', error);
    }
  };
  


  handleTabClick = (index) => {
    this.setState({ selectedTab: index });
      
  };
  
  
  handleAddMission= async () => {
    try {
      const mission_id = prompt('Enter Mission  ID:');
      if (mission_id !== null) {
      const msgroup = prompt('Enter included Mission groups(format: 1,2,3,..):');
      await axios.post(`${baseURL}/api/add-msinfo`, { mission_id, msgroup });
      this.fetchDefenseAreas();
      }
    } catch (error) {
      console.error('Error adding defense area:', error);
    }
  };


  handleAssignMission= async () => {
    try {
      const area_id = prompt('Enter defense area ID:');
      if (area_id !== null && !isNaN(area_id) && Number.isInteger(parseFloat(area_id))) {
      const msgroup = prompt('Enter Mission groups for assignment(format: 1,2,3,..):');
      
      await axios.post(`${baseURL}/api/assign-msgroup`, { area_id, msgroup });
      this.fetchDefenseAreas();
      }
    } catch (error) {
      console.error('Error adding defense area:', error);
    }
  };
  
  handleAddRule = async () => {
    try {
      const _id = prompt('Enter rule ID:');
      if (_id !== null && !isNaN(_id) && Number.isInteger(parseFloat(_id))) {
      const source_tag = prompt('Enter Source tags');
      const target_tag = prompt('Enter Target tags');      
      await axios.post(`${baseURL}/api/add-rule`, { _id, source_tag, target_tag });      
      }
    } catch (error) {
      console.error('Error adding rule:', error);
    }
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


  handlInitIntentInference = async () => {
    try {
      // Ensure that this.state.missileTrajectory is properly initialized
      if (this.state && this.state.missileTrajectory) {
        // Retrieve the count of missiles
        const missileCount = this.state.missileTrajectory.getMissileCount();  
        // Perform the axios POST request
        await axios.post(`${baseURL}/api/init-intentinference`, { missileCount });  
        console.log('Init Intent Inference Successful');
      } else {
        console.error('Missile trajectory not properly initialized.');
      }
    } catch (error) {
      console.error('Error Initializing intent inference algorithm:', error);
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
    const { missionInfo, defenseAreas, adjacencyMatrix, displayMatrix,selectedTab } = this.state;
   
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
            <div className={`tab ${selectedTab === 2 ? 'active' : ''}`} onClick={() => this.handleTabClick(2)}>
              Mission Info
            </div>
          </div>
          <div className="tab-content">
            {selectedTab === 0 && <this.DefenseAreaTable defenseAreas={defenseAreas} />}
            {selectedTab === 1 && <this.AdjacencyMatrix adjacencyMatrix={matrix_input} defenseAreas={defenseAreas} />}
            {selectedTab === 2 && <this.MissionTable missionInfo={missionInfo}/>}
          </div>
          <div>          
           <button onClick={this.handleAddRule}>Add Rule</button>
            <button onClick={this.handleAddDefenseArea}>Add Defense Area</button>
            <button onClick={this.handleAssignMission}>Assign Mission Group</button>
            <button onClick={this.handleAddMission}>Add Mission</button>
            <button onClick={this.handleAddEdge}>Add Edge</button>
            <button onClick={this.resetdisplayMatrix}>reset_adj_mtx</button>
            <button onClick={this.handleMissileInit}>Init Missile</button>
            <button onClick={this.handleAddMissile}>Add Missile</button>
            <button onClick={this.handleLaunchMissile}>Launch Missile</button>
            <button onClick={this.handleLaunchMissileAll}>Launch All Missiles</button>
            <button onClick={this.handlInitIntentInference}>Init IntentInference</button>
          </div>
          {this.generateMissileDropdown()}
          {this.generateMissileTypeDropdown()}
          {this.generateBarPlots(defenseAreas)}
        </div>       
         {<this.MapComponent  defenseAreas={defenseAreas} matrix_in={matrix_input}/>}
      </div>
    );
  }
}

export default App;