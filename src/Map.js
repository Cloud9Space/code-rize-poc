import React, { Component } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import settlement from 'json!./Guija_Settelments.geojson';
import polulation from 'json!./Guija_population.geojson';
import 'leaflet-draw/dist/leaflet.draw.js';
import 'leaflet-draw/dist/leaflet.draw.css';
import leafletPip from 'leaflet-pip';
import * as turf from '@turf/turf';
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
});

var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
});

let config = {};
config.params = {
  center: [-24.749434, 32.961285],
  zoomControl: false,
  zoom: 8,
  scrollwheel: false,
  legends: true,
  infoControl: false,
  attributionControl: true,
  layers: osm,
};

var baseMaps = {
  "OpenStreetMap": osm,
  "OpenStreetMap.HOT": osmHOT
}

var overlayMaps = {}

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      map: null,
    };
    this._mapNode = null;
  }

  componentDidMount() {
    if (!this.state.map) this.init(this._mapNode);
  }

  componentWillUnmount() {
    this.state.map.remove();
  }

  addGeoJSONLayer() {
    const settlementLayer = L.geoJson(settlement, {
      style: function (feature) {
        return {
          color: '#CC0066',
          fillColor: '#CC0066',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        };
      }
    });
    overlayMaps['settlement'] = settlementLayer
    this.setState({ settlementLayer });

    const populationLayer = L.geoJson(polulation, {
      style: function (feature) {
        return {
          color: '#00CC00',
          fillColor: '#00CC00',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.5,
        };
      }
    });
    overlayMaps['population'] = populationLayer
    this.setState({ polulationgeojson: populationLayer });
  }

  // checkAllPointsInPolygon(polygonCoordinates, polygonCoords) {
  //   return polygonCoordinates.every(point =>
  //     leafletPip.pointInLayer(L.latLng(point[0], point[1]), polygonCoords)
  //   );
  // }
  checkAllPointsInPolygon(polygonCoordinates, polygonLayer) {
    // const polygon = polygonLayer.(); // Assuming it's a single polygon
    // console.log("polygon",polygon)
    // return false
    return polygonCoordinates.every(point => {
      this.isPointInPolygon(L.latLng(point[0], point[1]), polygonLayer)
    });
  }

  isPointInPolygon(point, polygonLayer) {
    const isInside = leafletPip.pointInLayer(point, polygonLayer);
    return isInside.length > 0;
  }
  // isPointInPolygon(point, polygon) {
  //   const x = point.lat;
  //   const y = point.lng;
  //   let inside = false;

  //   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
  //     const xi = polygon[i].lat;
  //     const yi = polygon[i].lng;
  //     const xj = polygon[j].lat;
  //     const yj = polygon[j].lng;

  //     const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
  // // console.log("intersect",intersect)
  //     if (intersect) {
  //       inside = !inside;
  //     }
  //   }

  //   return inside;
  // }
  // checkAllPointsInPolygon(polygonCoordinates, polygonCoords) {
  //   // Convert Leaflet LatLng to [lng, lat] format expected by turf
  //   const coords = polygonCoordinates.map(point => [point[0], point[1]);

  //   // Create a turf polygon
  //   const turfPolygon = turf.polygon([polygonCoords]);

  //   // Check if any point is within the polygon
  //   return coords.some(point =>
  //     turf.booleanPointInPolygon(turf.point(point), turfPolygon)
  //   );
  // }


  init(id) {
    if (this.state.map) return;
    this.addGeoJSONLayer();

    let map = L.map(id, config.params);
    var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    L.control.scale({ position: "bottomleft" }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          shapeOptions: {
            color: 'red',
            fillColor: 'blue',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.5
          }
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      layer.bindPopup("This is a polygon!");

      // Extract polygon coordinates
      const polygonCoordinates = layer.getLatLngs();
      console.log("Polygon Coordinates: ", polygonCoordinates);

      // Convert to GeoJSON format
      const geojsonPolygon = {
        type: "FeatureCollection",
        name: "idk",
        features: [{
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [polygonCoordinates.map(point => [point.lng, point.lat])]
          }
        }]
      };

      const idk = L.geoJson(geojsonPolygon, {
        style: function (feature) {
          return {
            color: '#00CC00',
            fillColor: '#00CC00',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.5,
          };
        }
      });
      console.log(idk)

      // const geoJSONLayer = L.geoJSON(geojsonPolygon, {
      //   style: function (feature) {
      //     // Customize the style based on feature properties if needed
      //     return {
      //       color: 'red',
      //       fillColor: 'blue',
      //       weight: 2,
      //       opacity: 1,
      //       fillOpacity: 0.5
      //     };
      //   }
      // });

      var properties = [];
      settlement.features.forEach((feature) => {
        const settlementCoords = feature.geometry.coordinates[0][0];
        // console.log(feature.properties)
        var flag = false;
        settlementCoords.forEach((polygonCoords) => {

          const isInside = leafletPip.pointInLayer(L.latLng(polygonCoords[1], polygonCoords[0]), idk);
          // if(isInside.length>0)console.log("isInside", isInside)
          if (isInside.length > 0) {

            flag = true;
          }
        });
        if(flag === true)
          properties.push(feature.properties)
      });
console.log(properties)
      const totalPopulation = [properties.reduce((accumulator,currentValue)=>{
        return accumulator + currentValue.population;
      },0)]
      console.log(totalPopulation)
      const data = {
        properties,
        totalPopulation 
      }
      this.downloadObjectAsJson(data, 'myFile.json');

      // Check points in settlement layer
      // settlement.features.forEach((feature) => {
      //   const settlementCoords = feature.geometry.coordinates[0][0];
      //   // console.log("Settlement Coordinates: ", settlementCoords);
      //   // console.log("Settlement Coordinates: ", settlementCoords[0][0]);
      //   const val = this.checkAllPointsInPolygon(settlementCoords, layer)
      //   console.log(val)
      //   if (val) {
      //     console.log("Settlement Properties: ", feature.properties);
      //   }
      // });



      // Check points in population layer
      // polulation.features.forEach((feature) => {
      //   const populationCoords = feature.geometry.coordinates[0];
      //   if (this.checkAllPointsInPolygon(populationCoords, polygonCoordinates)) {
      //     console.log("Population Properties: ", feature.properties);
      //   }
      // });
    });

    this.setState({ map });
  }


  downloadObjectAsJson(obj, filename) {
    const jsonStr = JSON.stringify(obj, null, 2); // null, 2 adds indentation for readability
  
    const blob = new Blob([jsonStr], { type: 'application/json' });
  
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
  
    // Append the link to the body
    document.body.appendChild(link);
  
    // Trigger a click event on the link
    link.click();
  
    // Remove the link from the DOM
    document.body.removeChild(link);
  }

  render() {
    return (
      <div id="mapUI">
        <div>asiufhliawkerunsaefiejn</div>

        <div ref={(node) => this._mapNode = node} id="map" />
      </div>
    );
  }
}

export default Map;
