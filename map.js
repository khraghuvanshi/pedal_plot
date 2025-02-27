import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';

console.log("Mapbox GL JS Loaded:", mapboxgl);
// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoicmtodXNoaSIsImEiOiJjbTdjanBrNGswaGloMm5vZDJnM21xNmo2In0.JODYoQmb2JzLJbsQP0E4yQ';

// Initialize the map
// Initialize the map
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-71.09415, 42.36027],
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
});

// Global variables for data storage
let stations = [];
let circles;
let trips = [];
let departures;
let arrivals;
let maxTraffic;

let filteredTrips = [];
let filteredArrivals = new Map();
let filteredDepartures = new Map();
let filteredStations = [];
let radiusScale;
let stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);

// Define function to convert longitute and latitude to pixel values
function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.lon, +station.lat);
  const { x, y } = map.project(point);
  return { cx: x, cy: y };
}

// Function to update circle positions when the map moves/zooms
function updatePositions() {
  circles.attr("cx", (d) => getCoords(d).cx).attr("cy", (d) => getCoords(d).cy);
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function filterTripsbyTime() {
}

map.on("load", () => {
  const svg = d3.select("#map").select("svg");
  const jsonurl = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";

  d3.json(jsonurl)
    .then((jsonData) => {
      stations = jsonData.data.stations;
      circles = svg
        .selectAll("circle")
        .data(stations)
        .enter()
        .append("circle")
        .attr("r", 5)
        .attr("fill", "steelblue")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8);

      updatePositions();
    })
    .catch((error) => {
      console.error("Error loading JSON:", error);
    });

  const csvurl =
    "https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv";
  d3.csv(csvurl).then((data) => {
    trips = data;
    for (let trip of trips) {
      trip.started_at = new Date(trip.started_at);
      trip.ended_at = new Date(trip.ended_at);
    }

    departures = d3.rollup(
      trips,
      (v) => v.length,
      (d) => d.start_station_id
    );

    arrivals = d3.rollup(
      trips,
      (v) => v.length,
      (d) => d.end_station_id
    );

    stations = stations.map((station) => {
      let id = station.short_name;
      station.arrivals = arrivals.get(id) ?? 0;
      station.departures = departures.get(id) ?? 0;
      station.totalTraffic = station.departures + station.arrivals;
      return station;
    });

    maxTraffic = d3.max(stations, (d) => d.totalTraffic);
    radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(stations, (d) => d.totalTraffic)])
      .range([0, 25]);

    circles
      .attr("r", (d) => radiusScale(d.totalTraffic))
      .each(function (d) {
        d3.select(this).html(
          `<title>${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)</title>`
        );
      })
      .style("--departure-ratio", (d) =>
        stationFlow(d.departures / d.totalTraffic)
      );
  });

  // Boston bike routes
  map.addSource("boston_route", {
    type: "geojson",
    data: "https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...",
  });

  map.addLayer({
    id: "bike-lanes",
    type: "line",
    source: "boston_route",
    paint: {
      "line-color": "#32D400",
      "line-width": 4,
      "line-opacity": 0.6,
    },
  });

  //   Cambridge bike routes
  map.addSource("cambridge_route", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson",
  });

  map.addLayer({
    id: "cambridge-bike-lanes",
    type: "line",
    source: "cambridge_route",
    paint: {
      "line-color": "#32D400",
      "line-width": 4,
      "line-opacity": 0.6,
    },
  });
});

// Reposition markers on map interactions
map.on("move", updatePositions);
map.on("zoom", updatePositions);
map.on("resize", updatePositions);
map.on("moveend", updatePositions);

// Time Filter
let timeFilter = -1;
const timeSlider = document.getElementById("time-slider");
const selectedTime = document.getElementById("selected-time");
const anyTimeLabel = document.getElementById("any-time");

function formatTime(minutes) {
  const date = new Date(0, 0, 0, 0, minutes);
  return date.toLocaleString("en-US", { timeStyle: "short" });
}

function updateTimeDisplay() {
  timeFilter = Number(timeSlider.value);

  if (timeFilter === -1) {
    selectedTime.textContent = "";
    selectedTime.style.display = "none";
    anyTimeLabel.style.display = "block";
  } else {
    selectedTime.textContent = formatTime(timeFilter);
    selectedTime.style.display = "block";
    anyTimeLabel.style.display = "none";
  }

  filterTripsbyTime();
}
// Trigger filtering logic which will be implemented in the next step
timeSlider.addEventListener("input", updateTimeDisplay);
updateTimeDisplay();