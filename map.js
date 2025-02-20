// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoicmtodXNoaSIsImEiOiJjbTdjanBrNGswaGloMm5vZDJnM21xNmo2In0.JODYoQmb2JzLJbsQP0E4yQ';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map', // ID of the div where the map will render
  style: 'mapbox://styles/mapbox/streets-v12', // Map style
  center: [-71.09415, 42.36027], // [longitude, latitude]
  zoom: 12, // Initial zoom level
  minZoom: 5, // Minimum allowed zoom
  maxZoom: 18 // Maximum allowed zoom
});