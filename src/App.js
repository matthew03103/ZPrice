import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Button from "./components/ui/button.js"; // Adjust path if needed
import gasStationIcon from "./components/images/GasIcon.png"; // Import the gas station icon
import axios from "axios"; // Import axios for API calls

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
  const [selectedLocation, setSelectedLocation] = useState(null); // Store the selected location
  const mapRef = useRef(null);

  // Default map center (centered on the contiguous US)
  const defaultPosition = [37.0902, -95.7129];

  // Handle adding/updating price for a gas station
  const addPrice = async (lat, lon) => {
    const userPrice = prompt("Enter the price you paid for Zyn:");
    if (userPrice && !isNaN(userPrice)) {
      try {
        console.log("Adding/updating price for gas station at:", lat, lon); // Log location
        const response = await axios.post("http://localhost:5000/api/prices", {
          lat,
          lon,
          price: userPrice,
        });
        console.log("Update response:", response.data); // Log response
        setPrices((prevPrices) => ({
          ...prevPrices,
          [response.data.id]: userPrice,
        }));
        setGasStations((prevStations) => [
          ...prevStations,
          { id: response.data.id, lat, lon },
        ]);
      } catch (error) {
        console.error("Error updating price:", error);
        if (error.response) {
          console.error("Response data:", error.response.data); // Log response data
          console.error("Response status:", error.response.status); // Log status code
        }
        alert("Failed to update price. Please try again.");
      }
    } else {
      alert("Please enter a valid price.");
    }
  };

  // Handle map click to select a gas station
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setSelectedLocation({ lat, lng });
  };

  // Handle button click to add price
  const handleAddPriceClick = () => {
    if (selectedLocation) {
      addPrice(selectedLocation.lat, selectedLocation.lng);
    } else {
      alert("Please select a location on the map first.");
    }
  };

  // Fetch gas stations from Overpass API
  const fetchGasStations = async (bbox) => {
    const overpassUrl = "https://overpass-api.de/api/interpreter";

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

      // Fetch prices for all gas stations
      const pricePromises = data.elements.map(async (station) => {
        try {
          const priceResponse = await axios.get(`http://localhost:5000/api/prices/${station.id}`);
          return { id: station.id, price: priceResponse.data.price };
        } catch (error) {
          console.error("Error fetching price for station:", station.id, error);
          return { id: station.id, price: null };
        }
      });

      const priceResults = await Promise.all(pricePromises);
      const newPrices = priceResults.reduce((acc, result) => {
        acc[result.id] = result.price;
        return acc;
      }, {});
      setPrices((prevPrices) => ({ ...prevPrices, ...newPrices }));
    } catch (error) {
      console.error("Error fetching gas stations:", error);
      alert("Failed to fetch gas stations. Please try again.");
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
        onClick={handleMapClick} // Add click handler
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
                icon={customGasStationIcon}
              >
                <Popup>
                  <div>
                    <h3>Gas Station</h3>
                    <p>Zyn Price: {prices[station.id] ? `$${prices[station.id]}` : "Not added yet"}</p>
                    <Button onClick={() => addPrice(station.lat, station.lon)}>Update Price</Button>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <Button onClick={handleAddPriceClick}>Add Price</Button>
        <Button onClick={handleQueryClick} style={{ marginLeft: "10px" }}>Query Gas Stations</Button>
      </div>
    </div>
  );
};

export default App;