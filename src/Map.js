import React, { Component } from 'react';
import L from 'leaflet';
// postCSS import of Leaflet's CSS
import 'leaflet/dist/leaflet.css';
// using webpack json loader we can import our geojson file like this
import geojson from 'json!./Guija_Settelments.geojson';
import polulation from 'json!./Guija_population.geojson';
// import local components Filter and ForkMe

import 'leaflet-draw/dist/leaflet.draw.js';
import 'leaflet-draw/dist/leaflet.draw.css';
// store the map configuration properties in an object,
// we could also move this to a separate file & import it if desired.
let config = {};
config.params = {
  center: [-24.749434, 32.961285],
  zoomControl: false,
  zoom: 8,
  scrollwheel: false,
  legends: true,
  infoControl: false,
  attributionControl: true
};
config.tileLayer = {
  // uri: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  // uri: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  uri: 'https://tile.osm.ch/switzerland/{z}/{x}/{y}.png',
  params: {
    // minZoom: 11,
    attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    id: '',
    accessToken: ''
  }
};


var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
});

var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
});

var baseMaps= {
  "OpenStreetMap": osm,
  "OpenStreetMap.HOT": osmHOT
}
var overlayMaps = {
  
}




class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      map: null,
      // tileLayer: null,
      // geojsonLayer: null,
      // polulationgeojson: null,
      // geojson: null,
    };
    this._mapNode = null;
  }

  componentDidMount() {
    // code to run just after the component "mounts" / DOM elements are created
    // we could make an AJAX request for the GeoJSON data here if it wasn't stored locally
    this.getData();
    // create the Leaflet map object
    if (!this.state.map) this.init(this._mapNode);
  }

  // componentDidUpdate(prevProps, prevState) {
  //   // code to run when the component receives new props or state
  //   // check to see if geojson is stored, map is created, and geojson overlay needs to be added
  //   if (this.state.geojson && this.state.map && !this.state.geojsonLayer) {
  //     // add the geojson overlay
  //     this.addGeoJSONLayer(this.state.geojson);
  //     this.addGeoJSONLayer(this.state.polulationgeojson);
  //   }

  //   // check to see if the subway lines filter has changed
  //   if (this.state.subwayLinesFilter !== prevState.subwayLinesFilter) {
  //     // filter / re-render the geojson overlay
  //     this.filterGeoJSONLayer();
  //   }
  // }

  componentWillUnmount() {
    // code to run just before unmounting the component
    // this destroys the Leaflet map object & related event listeners
    this.state.map.remove();
  }

  getData() {
    // could also be an AJAX request that results in setting state with the geojson data
    // for simplicity sake we are just importing the geojson data using webpack's json loader
    this.setState({
      geojson
    });
  }



  addGeoJSONLayer() {
    // create a native Leaflet GeoJSON SVG Layer to add as an interactive overlay to the map
    // an options object is passed to define functions for customizing the layer
    const settlementLayer = L.geoJson(geojson, {
      // onEachFeature: this.onEachFeature,
      // pointToLayer: this.pointToLayer,
      // filter: this.filterFeatures
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
    // add our GeoJSON layer to the Leaflet map object
    // geojsonLayer.addTo(this.state.map);
    // overlayMaps['settlement'] = geojsonLayer
    overlayMaps['settlement'] = settlementLayer
    this.setState({ settlementLayer });

    const populationLayer = L.geoJson(polulation, {
      // onEachFeature: this.onEachFeature,
      // pointToLayer: this.pointToLayer,
      // filter: this.filterFeatures
      style: function (feature) {
        // Customize the style based on feature properties if needed
        return {
          color: '#00CC00',
          fillColor: '#00CC00',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.5,
        };
      }
    });
    // add our GeoJSON layer to the Leaflet map object
    // geojsonLayer2.addTo(this.state.map);
    overlayMaps['population'] = populationLayer

    this.setState({ polulationgeojson: populationLayer });

  }



  init(id) {
    if (this.state.map) return;
    this.addGeoJSONLayer();


    // overlayMaps = {
    // };
    // this function creates the Leaflet map object and is called after the Map component mounts
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

    map.on(L.Draw.Event.CREATED, function (event) {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      layer.bindPopup("This is a polygon!");

    });




    // a TileLayer is used as the "basemap"
    const tileLayer = L.tileLayer(config.tileLayer.uri, config.tileLayer.params).addTo(map);

    // set our state to include the tile layer
    this.setState({ map, tileLayer });
  }

  render() {
    const { subwayLinesFilter } = this.state;
    return (
      <div id="mapUI">
        {/* {
          subwayLineNames.length &&
            <Filter lines={subwayLineNames}
              curFilter={subwayLinesFilter}
              filterLines={this.updateMap} />
        } */}
        <div ref={(node) => this._mapNode = node} id="map" />
        {/* <ForkMe /> */}
      </div>
    );
  }
}

export default Map;
