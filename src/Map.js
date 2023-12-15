import React, { Component } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import settlement from 'json!./Guija_Settelments.geojson';
import population from 'json!./Guija_population.geojson';
import Grid_lines from 'json!./Grid_line.geojson';
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
    settlementLayer.bindPopup("Settlement Layer")
    overlayMaps['settlement'] = settlementLayer
    this.setState({ settlementLayer });

    const populationLayer = L.geoJson(population, {
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
    populationLayer.bindPopup("Population Layer")
    overlayMaps['population'] = populationLayer
    this.setState({ polulationgeojson: populationLayer });


    const gridLayer = L.geoJson(Grid_lines, {
      style: function (feature) {
        return {
          color: 'black',
          fillColor: 'black',
          weight: 0.4,
          opacity: 1,
          fillOpacity: 0.2,
        };
      }
    });
    overlayMaps['grid'] = gridLayer
    this.setState({ polulationgeojson: gridLayer });


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
      geojsonPolygon.features[0].geometry.coordinates[0].push(geojsonPolygon.features[0].geometry.coordinates[0][0]);
      console.log("geojsonPolygon: ", geojsonPolygon.features[0].geometry.coordinates);

      const DrawnPolygonLayer = L.geoJson(geojsonPolygon, {
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
      console.log(DrawnPolygonLayer)

      var properties = [];
      settlement.features.forEach((feature) => {
        const settlementCoords = feature.geometry.coordinates[0][0];
        // console.log(feature.properties)
        var flag = false;
        // settlementCoords.forEach((polygonCoords) => {

          // const isInside = leafletPip.pointInLayer(L.latLng(polygonCoords[1], polygonCoords[0]), DrawnPolygonLayer);
          const turfPolygon = turf.polygon(geojsonPolygon.features[0].geometry.coordinates);
          const turfLayer = turf.multiPolygon(feature.geometry.coordinates);
  
          // const isInside = leafletPip.pointInLayer(L.latLng(polygonCoords[1], polygonCoords[0]), DrawnPolygonLayer);
          const intersection = turf.intersect(turfPolygon, turfLayer);
          if (intersection) {

            flag = true;
          }
        // });
        if (flag === true)
          properties.push(feature.properties)
      });
      // console.log(properties)
      var totalPopulation_settlement = [properties.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.population;
      }, 0)]
      console.log(totalPopulation_settlement)
      var data = {
        properties,
        totalPopulation : totalPopulation_settlement
      }
      this.downloadObjectAsCsv(data, 'settlements.csv');



      properties = [];
      population.features.forEach((feature) => {
        const populationCoords = feature.geometry.coordinates[0];
        // console.log(feature.properties)
        var flag = false;
        // populationCoords.forEach((polygonCoords) => {

          // const isInside = leafletPip.pointInLayer(L.latLng(polygonCoords[1], polygonCoords[0]), DrawnPolygonLayer);
          const turfPolygon = turf.polygon(geojsonPolygon.features[0].geometry.coordinates);
          const turfLayer = turf.multiPolygon(feature.geometry.coordinates);
  
          // const isInside = leafletPip.pointInLayer(L.latLng(polygonCoords[1], polygonCoords[0]), DrawnPolygonLayer);
          const intersection = turf.intersect(turfPolygon, turfLayer);
          // if(isInside.length>0)console.log("isInside", isInside)
          if (intersection) {

            flag = true;
          }
        // });
        if (flag === true)
          properties.push(feature.properties)
      });
      // console.log(properties)
      var totalPopulation_polupation = [properties.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.DN;
      }, 0)]
      console.log(totalPopulation_polupation)
      data = {
        properties,
        totalPopulation:totalPopulation_polupation
      }
      this.downloadObjectAsCsv(data, 'population.csv');


      properties = [];
      settlement.features.forEach((feature) => {
        // const populationCoords = feature.geometry.coordinates[0];
        // console.log(feature.properties)
        var flag = false;
        // populationCoords.forEach((polygonCoords) => {
        const turfPolygon = turf.polygon(geojsonPolygon.features[0].geometry.coordinates);
        const turfLayer = turf.multiPolygon(feature.geometry.coordinates);

        // const isInside = leafletPip.pointInLayer(L.latLng(polygonCoords[1], polygonCoords[0]), DrawnPolygonLayer);
        const intersection = turf.intersect(turfPolygon, turfLayer);
        // console.log("intersection",intersection)
        if (intersection) {
          // Calculate the area of the intersection
          const intersectionArea = turf.area(intersection);

// A----turfLayer
// I ---
// 100 --- turfLayer
// 40 ---- ?

          // Calculate the area of the original polygon
          const polygonArea = turf.area(turfLayer);
          console.log(polygonArea )
          // Calculate the portion of the intersection
          const portion = intersectionArea / polygonArea;
          console.log("portion",portion)
          console.log("portion*feature.properties.population" ,portion*feature.properties.population)
          properties.push({...feature.properties,portion : portion,effectivepopulation:portion*feature.properties.population})
          // console.log(`Intersection Area: ${intersectionArea}`);
          // console.log(`Polygon Area: ${polygonArea}`);
          console.log(`Portion of Intersection: ${portion}`);
        } else {
          // console.log("No intersection");
        }
        // if(isInside.length>0)console.log("isInside", isInside)
        // if (isInside.length > 0) {

        //   flag = true;
        // }
        // });
        // if (flag === true)
        // properties.push(feature.properties)
      });
      console.log("properties",properties)
      var effectivepopulation_partial = [properties.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.effectivepopulation;
      }, 0)]
      console.log(effectivepopulation_partial)
      data = {
        properties,
        effectivepopulation : effectivepopulation_partial
      }
      this.downloadObjectAsCsv(data, 'population_partialIncluded.csv');



      layer.bindPopup("Settlements: " + totalPopulation_settlement + "\nPopulation: " + totalPopulation_polupation + "\nPopulation Partial: " + effectivepopulation_partial);


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


  downloadObjectAsCsv(obj, filename) {
    const csvContent = this.convertObjectToCsv(obj);
    const blob = new Blob([csvContent], { type: 'text/csv' });

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

  convertObjectToCsv(obj) {
    var properties = obj.properties
    console.log("properties", properties)
    const headers = Object.keys(properties[0]);
    const values = properties.map((item) => (Object.values(item)).join(','));
    var v1 = values.join('\n') + '\n'
    const headerRow = headers.join(',') + '\n';
    // const valueRow = values.join(',') + '\n';

    var polulationdata 
    obj.totalPopulation?polulationdata = obj.totalPopulation:polulationdata = obj.effectivepopulation


    // console.log(v1)
    return headerRow + v1 + "\nTotal Population" + ',' + polulationdata;
    return " "
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
