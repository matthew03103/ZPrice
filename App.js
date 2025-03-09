import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Button from "./componants/ui/button.js"; // Adjust path if needed

const App = () => {
  const [price, setPrice] = useState(null);
  const [gasStations, setGasStations] = useState([]);

  // Example gas station coordinates (fallback if no data is fetched)
  const defaultPosition = [39.8283, -98.5795];

  // Fetch gas stations from Overpass API
  useEffect(() => {
    const fetchGasStations = async () => {
      const overpassUrl = "https://overpass-api.de/api/interpreter";
      const query = `
        [out:json];
        node["amenity"="fuel"]({{bbox}});
        out body;
        >;
        out skel qt;
      `;

      // Replace {{bbox}} with actual bounding box coordinates (e.g., for the US)
      const bbox = "-125,24,-66,49"; // Example bounding box for the US
      const formattedQuery = query.replace("{{bbox}}", bbox);

      try {
        const response = await fetch(overpassUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `data=${encodeURIComponent(formattedQuery)}`,
        });
        const data = await response.json();
        setGasStations(data.elements);
      } catch (error) {
        console.error("Error fetching gas stations:", error);
      }
    };

    fetchGasStations();
  }, []);

  // Handle price update
  const updatePrice = () => {
    const userPrice = prompt("Enter the price you paid for Zyn:");
    if (userPrice) {
      setPrice(userPrice);
    }
  };

  return (
    <div>
      <h1 style={{ textAlign: "center", padding: "10px" }}>Gas Stations & Zyn Prices</h1>
      <MapContainer center={defaultPosition} zoom={4} style={{ height: "80vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {gasStations.map((station) => {
          if (station.lat && station.lon) {
            return (
              <Marker key={station.id} position={[station.lat, station.lon]}>
                <Popup>
                  <div>
                    <h3>Gas Station</h3>
                    <p>Zyn Price: {price ? `$${price}` : "Not added yet"}</p>
                    <Button onClick={updatePrice}>Update Price</Button>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default App;