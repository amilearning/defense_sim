import React, { useState, useEffect } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
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


class Missile {
    constructor(id,lat, lon) {
      this.lat = lat;
      this.lon = lon;
      this.init_lat = parseFloat(lat);
      this.init_lon = parseFloat(lon);
      this.id = id
      this.type = 0;      
      this.timer = null;
      this.goal_lat = null;
      this.goal_lon = null;
      this.missile_speed = Math.random()*0.005+0.003 // percentage to move to the goal
      this.ts = 100;
      this.launched = false;
      this.trajectoryPoints = [];
    }
    set_goal(lat, lon){
        this.goal_lat =parseFloat(lat) ;
        this.goal_lon =parseFloat(lon);
    }
    launch(){
        console.log(this.init_lat)
        this.launched = true;
        this.timer = setInterval(() => {    
        const cur_lat = parseFloat(this.lat);
        const cur_lon = parseFloat(this.lon);
        this.trajectoryPoints.push([cur_lon,cur_lat]);
        this.lat =  cur_lat + (parseFloat(this.goal_lat) - this.init_lat)*this.missile_speed;
        this.lon =  cur_lon + (parseFloat(this.goal_lon) - this.init_lon)*this.missile_speed;    
        const distanceSquared = Math.pow(this.lat - this.goal_lat, 2) + Math.pow(this.lon - this.goal_lon, 2);
        // Check if the distance is less than a threshold (e.g., 0.01)
        if (distanceSquared < 0.001) {
            console.log("missile landed");
            this.launched = false;
            this.lat = this.init_lat;
            this.lon = this.init_lon;
            this.trajectoryPoints = [];
            clearInterval(this.timer);            
            return;
        }
      }, this.ts); // Update every second (adjust as needed)

    }
  }
  

class MissileTrajectory {
    constructor(map, vectorSource) {
      this.map = map;
      this.vectorSource = vectorSource;
      this.timer = null;
      this.missiles = []; 
    }
  
    // Method to set the map and vector source
    setMapAndVectorSource(map, vectorSource) {
      this.map = map;
      this.vectorSource = vectorSource;
    }
  
    // Method to start generating and updating missile trajectories
    start() {
        const featuresToRemove = this.vectorSource.getFeatures().filter(feature => feature.get('tag') === 'missiletraj');
        featuresToRemove.forEach(feature => this.vectorSource.removeFeature(feature));
        
        const lineStyle = new Style({
            stroke: new Stroke({
              color: 'yellow',
              width: 1,
              lineDash: [5], // This creates a dashed line with segments of 5 pixels
            }),
          });

        if( this.missiles.length > 0){
            for(let i =0; i < this.missiles.length;i++){
                if(this.missiles[i].launched){
                    const trajectoryPoints= this.missiles[i].trajectoryPoints;
                    const lineString = new Feature({
                        geometry: new LineString(trajectoryPoints.map(coord => fromLonLat(coord))),
                        tag: 'missiletraj' 
                      });
                      lineString.setStyle(lineStyle);
                      this.vectorSource.addFeature(lineString);
                }               
            }
        }
        
    }
    
    add_missile( goal_lat, goal_lon){
        const tmp_lat = 41.9027;
        const tmp_lon = 128.2837;
        const tmp_id = 0;
        const missile = new Missile(tmp_id, tmp_lat, tmp_lon);
        missile.set_goal(goal_lat, goal_lon);
        this.missiles.push(missile);
    }
    
    launch_missile(idx){
        if(this.missiles.length >idx-1){
            this.missiles[idx].launch();
        }
    }

    launch_missiles(){
        for(let i =0; i < this.missiles.length;i++){
            this.missiles[i].launch();
        }
    }
        
  }

  
export default MissileTrajectory;