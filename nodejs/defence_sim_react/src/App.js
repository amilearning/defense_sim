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
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import LineString from 'ol/geom/LineString';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj'; // Import fromLonLat function
import './App.css'; // Import CSS for styling
import XYZ from 'ol/source/XYZ';

function drawLinesBetweenDefenseAreas(defenseAreas, adjacencyMatrix, vectorSource) {
  defenseAreas.forEach((area, sourceIndex) => {
    const { lon: lon1, lat: lat1 } = area.tags;
    const coords1 = fromLonLat([parseFloat(lon1), parseFloat(lat1)]);
    const sourcePoint = new Feature({
      geometry: new Point(coords1),
    });

    const value = parseInt(area.tags.value); // Default value if 'value' tag is not present
    const markerStyle = new Style({
      image: new CircleStyle({
        radius: value, // Use the value of the 'value' tag here
        fill: new Fill({ color: 'red' }),
        stroke: new Stroke({ color: 'red', width: 1 }),
      }),
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
          geometry: new LineString([coords1, coords2]),
        });

        const lineStyle = new Style({
          stroke: new Stroke({
            color: 'red', // Change the color here
            width: weight, // Change the width here
          }),
        });

        targetPoint.setStyle(markerStyle);
        line.setStyle(lineStyle);

        
        vectorSource.addFeature(line);
      }
    });
  });
}

function DefenseAreaTable({ defenseAreas }) {
  return (
    <div style={{ maxHeight: '300px', overflowY: 'scroll', maxWidth: '50vw' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Tags</th>
          </tr>
        </thead>
        <tbody>
          {defenseAreas.map(area => (
            <tr key={area._id}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{area._id}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {Object.entries(area.tags).map(([key, value]) => (
                    <li key={key}><strong>{key}: </strong>{value}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function MapComponent({ defenseAreas, adjacencyMatrix }) {
  useEffect(() => {
    const seoulCoordinates = fromLonLat([126.9779, 37.5665]);

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

    if (defenseAreas && defenseAreas.length > 0) {
      drawLinesBetweenDefenseAreas(defenseAreas, adjacencyMatrix, vectorSource);
    }

    return () => {
      map.setTarget(null);
    };
  }, [defenseAreas, adjacencyMatrix]);

  return <div id="map" style={{ width: '50%', height: '100vh', float: 'right' }}></div>;
}



function AdjacencyMatrix({ adjacencyMatrix }) {
  return (
    <div>
      <h2>Adjacency Matrix</h2>
      <table className="adjacency-matrix">
        <thead>
          <tr>
            <th></th>
            {adjacencyMatrix.map((_, index) => (
              <th key={index}>Defense Area {index + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {adjacencyMatrix.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th>Defense Area {rowIndex + 1}</th>
              {row.map((value, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



function App() {
  const [defenseAreas, setDefenseAreas] = useState([]);
  const [adjacencyMatrix, setAdjacencyMatrix] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0); // State to track the selected tab

  const baseURL = 'http://127.0.0.1:5000'; // Base URL of your Flask backend

  // Fetch defense areas and update state
  useEffect(() => {
    const fetchDefenseAreas = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/defense-areas`);
        setDefenseAreas(response.data.defenseAreas);
        setAdjacencyMatrix(response.data.adjacencyMatrix);
      } catch (error) {
        console.error('Error fetching defense areas:', error);
      }
    };

    const intervalId = setInterval(fetchDefenseAreas, 5000); // Polling interval: every 10 seconds

    return () => clearInterval(intervalId); // Cleanup function to clear the interval
  }, []); // Run effect only once on component mount

  const handleTabClick = (index) => {
    setSelectedTab(index);
  };

  const handleAddDefenseArea = async () => {
    try {
      const area_id = prompt("Enter defense area ID:");
      const tags_input = prompt("Enter tags (format: key:value,key2:value2):");
      await axios.post(`${baseURL}/api/add-defense-area`, { area_id, tags: tags_input });
      // Refresh defense areas after adding
    } catch (error) {
      console.error('Error adding defense area:', error);
    }
  };
  
  return (
    <div className="MainComponent">
      <div className="left-panel" style={{ flex: '1', marginRight: '50 px' }}>
        <div className="tabs-container">
          <div className={`tab ${selectedTab === 0 ? 'active' : ''}`} onClick={() => handleTabClick(0)}>
            Defense Areas
          </div>
          <div className={`tab ${selectedTab === 1 ? 'active' : ''}`} onClick={() => handleTabClick(1)}>
            Adjacency Matrix
          </div>
        </div>
        <div className="tab-content">
          {selectedTab === 0 && <DefenseAreaTable defenseAreas={defenseAreas} />}
          {selectedTab === 1 && <AdjacencyMatrix adjacencyMatrix={adjacencyMatrix} />}
        </div>
        <div>
          <button onClick={handleAddDefenseArea}>Add Defense Area</button>
        </div>
      </div>      
        <MapComponent defenseAreas={defenseAreas} adjacencyMatrix={adjacencyMatrix} />      
    </div>
  );
}
export default App;
