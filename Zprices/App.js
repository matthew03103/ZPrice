import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Button from "./componants/ui/button.js"; // Adjust path if needed
import gasStationIcon from "./componants/images/GasIcon.png"; // Import the gas station icon

// Create a custom gas station icon
const customGasStationIcon = new L.Icon({
  iconUrl: gasStationIcon, // Use the imported image
  iconSize: [25, 25], // Size of the icon
  iconAnchor: [12, 25], // Point of the icon that will correspond to the marker's location
  popupAnchor: [0, -25], // Point from which the popup should open relative to the iconAnchor
});

const App = () => {
  const [gasStations, setGasStations] = useState([]);
  const [prices, setPrices] = useState({}); // Store prices for each gas station
  const mapRef = useRef(null);

  // Default map center (centered on the contiguous US)
  const defaultPosition = [37.0902, -95.7129];

  // Fetch gas stations from Overpass API
  const fetchGasStations = async (bbox) => {
    const overpassUrl = "https://overpass-api.de/api/interpreter";

    // Simplified Overpass API query
    const query = `
      [out:json];
      node["amenity"="fuel"](${bbox});
      out body;
      >;
      out skel qt;
    `;

    try {
      const response = await fetch(overpassUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setGasStations(data.elements);
    } catch (error) {
      console.error("Error fetching gas stations:", error);
      alert("Failed to fetch gas stations. Please try again.");
    }
  };

  // Handle price update for a specific gas station
  const updatePrice = (stationId) => {
    const userPrice = prompt("Enter the price you paid for Zyn:");
    if (userPrice) {
      // Update the price for the specific gas station
      setPrices((prevPrices) => ({
        ...prevPrices,
        [stationId]: userPrice,
      }));
    }
  };

  // Handle query button click
  const handleQueryClick = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      const bounds = map.getBounds();
      const bbox = `${bounds.getSouthWest().lat},${bounds.getSouthWest().lng},${bounds.getNorthEast().lat},${bounds.getNorthEast().lng}`;
      fetchGasStations(bbox);
    }
  };

  return (
    <div>
      <h1 style={{ textAlign: "center", padding: "10px" }}>Gas Stations & Zyn Prices</h1>
      <MapContainer
        center={defaultPosition}
        zoom={4}
        style={{ height: "80vh", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {gasStations.map((station) => {
          if (station.lat && station.lon) {
            return (
              <Marker
                key={station.id}
                position={[station.lat, station.lon]}
                icon={customGasStationIcon} // Use the custom gas station icon
              >
                <Popup>
                  <div>
                    <h3>Gas Station</h3>
                    <p>Zyn Price: {prices[station.id] ? `$${prices[station.id]}` : "Not added yet"}</p>
                    <Button onClick={() => updatePrice(station.id)}>Update Price</Button>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <Button onClick={handleQueryClick}>Query Gas Stations in This Area</Button>
      </div>
    </div>
  );
};

export default App;