import React, { Component, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.js';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';


const fetchSettlement = async () => await fetch('/Guija_Settelments.geojson').then(response => response.json())
const fetchGrid = async () => await fetch('/Grid_line.geojson').then(response => response.json())
const fetchPopulation = async () => await fetch('/Guija_population.geojson').then(response => response.json())
const settlement = await fetchSettlement();
const population = await fetchPopulation();
const Grid_lines = await fetchGrid();


// console.log(settlement);
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

export default function Map() {

    var [map, setMap] = useState(null);
    var [_mapNode, set__mapNode] = useState("map");

    useEffect(() => {
        if (!map) {
            init(_mapNode);
        }
    }, []);

    const addGeoJSONLayer = () => {
        var settlementLayer = L.geoJson(settlement, {
            style: function (feature) {
                return {
                    color: '#CC0066',
                    fillColor: '#CC0066',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                };
            },
            onEachFeature: function (feature, layer) {
                // Bind a popup to each polygon with properties information
                // console.log(feature)
                // console.log(layer)
                var popupContent = "<b>Object Id:</b> " + feature.properties.OBJECTID + "<br>" +
                    "<b>Name:</b> " + feature.properties.adm2_name + "<br>" +
                    "<b>Country:</b> " + feature.properties.country + "<br>" +
                    "<b>Population:</b> " + feature.properties.population + "<br>" +
                    "<b>Settlement Type:</b> " + feature.properties.type;
                layer.bindPopup(popupContent);
            }
        });
        // settlementLayer.bindPopup("Settlement Layer")
        overlayMaps['settlement'] = settlementLayer

        var populationLayer = L.geoJson(population, {
            style: function (feature) {
                return {
                    color: '#00CC00',
                    fillColor: '#00CC00',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.5,
                };
            },
            onEachFeature: function (feature, layer) {
                // Bind a popup to each polygon with properties information
                // console.log(feature)
                // console.log(layer)
                var popupContent = "<b>Id:</b> " + feature.properties.fid + "<br>" +
                    "<b>DN:</b> " + feature.properties.DN;

                layer.bindPopup(popupContent);
            }
        });
        // populationLayer.bindPopup("Population Layer")
        overlayMaps['population'] = populationLayer


        var gridLayer = L.geoJson(Grid_lines, {
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


    }

    function getColor(d) {
        return d === "Settlement"? "#CC0066":
                d === "Population"? "#00CC00":
                "white";
    }


    const init = (id) => {
        if (map !== null) return;

        addGeoJSONLayer();

        let map_i = L.map(id, config.params);
        var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map_i);
        L.control.zoom({ position: "bottomleft" }).addTo(map_i);
        L.control.scale({ position: "bottomleft" }).addTo(map_i);
        var legend = L.control({ position: 'bottomright' });

        // legend.onAdd = function (map) {
        //     var div = L.DomUtil.create('div', 'info legend');
        //     // ... (your existing code)
        //     console.log("Legend content created:", div.innerHTML);
        //     return div;
        // };
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend'),
                grades = ["Settlement", "Population"],
                labels = [];
                console.log("Legend content created:", div.innerHTML);
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<div style="margin-bottom: 5px"><i style="background:' + getColor(grades[i]) + '"></i> ' +
                    grades[i] +'</div>';
            }

            return div;
        };

        legend.addTo(map_i);


        const drawnItems = new L.FeatureGroup();
        map_i.addLayer(drawnItems);

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
                marker: false,
                circlemarker: false
            },
            edit: {
                featureGroup: drawnItems,
                edit: false,
                remove: true
            }
        });

        map_i.addControl(drawControl);

        map_i.on(L.Draw.Event.CREATED, (event) => {
            const layer = event.layer;
            drawnItems.addLayer(layer);

            const polygonCoordinates = layer.getLatLngs();

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



            var properties = [];
            settlement.features.forEach((feature) => {
                var flag = false;

                const turfPolygon = turf.polygon(geojsonPolygon.features[0].geometry.coordinates);
                const turfLayer = turf.multiPolygon(feature.geometry.coordinates);

                const intersection = turf.intersect(turfPolygon, turfLayer);
                if (intersection) {

                    flag = true;
                }
                // });
                if (flag === true)
                    properties.push(feature.properties)
            });

            var totalPopulation_settlement = [properties.reduce((accumulator, currentValue) => {
                return accumulator + currentValue.population;
            }, 0)]
            var data = {
                properties,
                totalPopulation: totalPopulation_settlement
            }
            downloadObjectAsCsv(data, 'settlements.csv');



            properties = [];
            population.features.forEach((feature) => {
                var flag = false;

                const turfPolygon = turf.polygon(geojsonPolygon.features[0].geometry.coordinates);
                const turfLayer = turf.multiPolygon(feature.geometry.coordinates);

                const intersection = turf.intersect(turfPolygon, turfLayer);
                if (intersection) {

                    flag = true;
                }
                if (flag === true)
                    properties.push(feature.properties)
            });

            var totalPopulation_polupation = [properties.reduce((accumulator, currentValue) => {
                return accumulator + currentValue.DN;
            }, 0)]

            data = {
                properties,
                totalPopulation: totalPopulation_polupation
            }
            downloadObjectAsCsv(data, 'population.csv');


            properties = [];
            settlement.features.forEach((feature) => {

                const turfPolygon = turf.polygon(geojsonPolygon.features[0].geometry.coordinates);
                const turfLayer = turf.multiPolygon(feature.geometry.coordinates);

                const intersection = turf.intersect(turfPolygon, turfLayer);
                if (intersection) {
                    // Calculate the area of the intersection
                    const intersectionArea = turf.area(intersection);

                    const polygonArea = turf.area(turfLayer);

                    const portion = intersectionArea / polygonArea;
                    properties.push({ ...feature.properties, portion: portion, effectivepopulation: portion * feature.properties.population })

                }

            });

            var effectivepopulation_partial = [properties.reduce((accumulator, currentValue) => {
                return accumulator + currentValue.effectivepopulation;
            }, 0)]

            data = {
                properties,
                effectivepopulation: effectivepopulation_partial
            }
            downloadObjectAsCsv(data, 'population_partialIncluded.csv');

            layer.bindPopup("Settlements: " + totalPopulation_settlement + "\nPopulation: " + totalPopulation_polupation + "\nPopulation Partial: " + effectivepopulation_partial);




        });

        setMap(map_i);
    }

    const downloadObjectAsCsv = (obj, filename) => {
        const csvContent = convertObjectToCsv(obj);
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

    const convertObjectToCsv = (obj) => {
        var properties = obj.properties

        const headers = Object.keys(properties[0]);
        const values = properties.map((item) => (Object.values(item)).join(','));
        var v1 = values.join('\n') + '\n'
        const headerRow = headers.join(',') + '\n';

        var polulationdata
        obj.totalPopulation ? polulationdata = obj.totalPopulation : polulationdata = obj.effectivepopulation


        return headerRow + v1 + "\nTotal Population" + ',' + polulationdata;
    }

    return (
        <div id="mapUI">

            <div ref={(node) => _mapNode = node} id="map" />
        </div>
    );
}

