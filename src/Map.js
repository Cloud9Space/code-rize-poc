import React, { Component } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import settlement from 'json!./Guija_Settelments.geojson';
import polulation from 'json!./Guija_population.geojson';
import 'leaflet-draw/dist/leaflet.draw.js';
import 'leaflet-draw/dist/leaflet.draw.css';
import leafletPip from 'leaflet-pip';

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

  checkAllPointsInPolygon(polygonCoordinates, polygonCoords) {
    return polygonCoordinates.every(point =>
      leafletPip.pointInLayer(L.latLng(point.lat, point.lng), L.polygon(polygonCoords))
    );
  }

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

      // Check points in settlement layer
      settlement.features.forEach((feature) => {
        const settlementCoords = feature.geometry.coordinates[0];
        if (this.checkAllPointsInPolygon(settlementCoords, polygonCoordinates)) {
          console.log("Settlement Properties: ", feature.properties);
        }
      });

      // Check points in population layer
      polulation.features.forEach((feature) => {
        const populationCoords = feature.geometry.coordinates[0];
        if (this.checkAllPointsInPolygon(populationCoords, polygonCoordinates)) {
          console.log("Population Properties: ", feature.properties);
        }
      });
    });

    this.setState({ map });
  }

  render() {
    return (
      <div id="mapUI">
        <div ref={(node) => this._mapNode = node} id="map" />
      </div>
    );
  }
}

export default Map;
