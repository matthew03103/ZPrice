import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Button from "./components/ui/button.js";
import gasStationIcon from "./components/images/GasIcon.png";

// Firebase Imports
import { firestore } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Custom gas station icon
const customGasStationIcon = new L.Icon({
  iconUrl: gasStationIcon,
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
});

const App = () => {
  const [gasStations, setGasStations] = useState([]);
  const [prices, setPrices] = useState({});
  const [userPosition, setUserPosition] = useState(null);
  const mapRef = useRef(null);

  const defaultPosition = [37.0902, -95.7129];

  // Function to generate a Firestore-safe document ID
  const generateDocId = (lat, lon) => {
    return `${lat.toFixed(6)}-${lon.toFixed(6)}`; // Hyphen instead of underscore
  };

  // Add or update price for a gas station in Firestore
  const addPrice = async (id, lat, lon) => {
    const userPrice = prompt("Enter the price you paid for Zyn:");

    if (userPrice && !isNaN(userPrice)) {
      try {
        const docId = generateDocId(lat, lon); // Ensure Firestore-safe ID
        console.log("Updating Firestore with:", { docId, lat, lon, price: userPrice });

        const gasStationRef = doc(firestore, "gasStations", docId);
        await setDoc(gasStationRef, { lat, lon, price: userPrice }, { merge: true });

        console.log("✅ Price successfully updated in Firestore.");
        setPrices((prevPrices) => ({ ...prevPrices, [docId]: userPrice }));
      } catch (error) {
        console.error("❌ Firestore update error:", error.message, "Code:", error.code);
        alert(`Firestore Error: ${error.message} (Code: ${error.code})`);
      }
    } else {
      alert("❌ Please enter a valid number for the price.");
    }
  };

  // Fetch gas stations from Overpass API
  const fetchGasStations = async (bbox) => {
    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const query = `
      [out:json];
      node["amenity"="fuel"](${bbox});
      out body;
    `;

    try {
      const response = await fetch(overpassUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setGasStations(data.elements);

      // Fetch prices from Firestore
      const pricePromises = data.elements.map(async (station) => {
        if (!station.lat || !station.lon) return null;
        const id = generateDocId(station.lat, station.lon);

        try {
          const gasStationRef = doc(firestore, "gasStations", id);
          const gasStationDoc = await getDoc(gasStationRef);
          return gasStationDoc.exists() ? { id, price: gasStationDoc.data().price } : { id, price: null };
        } catch (error) {
          console.error("Firestore fetch error for station:", id, error);
          return { id, price: null };
        }
      });

      const priceResults = await Promise.all(pricePromises);
      const newPrices = priceResults.reduce((acc, result) => {
        if (result) acc[result.id] = result.price;
        return acc;
      }, {});
      setPrices(newPrices);
    } catch (error) {
      console.error("Error fetching gas stations:", error);
      alert("Failed to fetch gas stations. Try again.");
    }
  };

  // Handle Query Button Click
  const handleQueryClick = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      const bounds = map.getBounds();
      const bbox = `${bounds.getSouthWest().lat},${bounds.getSouthWest().lng},${bounds.getNorthEast().lat},${bounds.getNorthEast().lng}`;
      fetchGasStations(bbox);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 13);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Automatically get user's location when the component mounts
  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div>
      <h1 style={{ textAlign: "center", padding: "10px" }}>Gas Stations & Zyn Prices</h1>
      <MapContainer center={userPosition || defaultPosition} zoom={13} style={{ height: "80vh", width: "100%" }} ref={mapRef}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {gasStations.map((station) => {
          if (!station.lat || !station.lon) return null;
          const id = generateDocId(station.lat, station.lon);

          return (
            <Marker key={id} position={[station.lat, station.lon]} icon={customGasStationIcon}>
              <Popup>
                <div>
                  <h3>Gas Station</h3>
                  <p>Zyn Price: {prices[id] ? `$${prices[id]}` : "Not added yet"}</p>
                  <Button onClick={() => addPrice(id, station.lat, station.lon)}>Add/Update Price</Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <Button onClick={handleQueryClick}>Query Gas Stations</Button>
      </div>
    </div>
  );
};

export default App;