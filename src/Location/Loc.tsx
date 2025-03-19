
import { useState, useEffect, useRef } from "react";
import { Shield, AlertCircle, Info, CheckCircle, Search, Volume2, Map, RefreshCw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "./Loc.css";

function useLiveLocation() {
  const [location, setLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState({ fullAddress: "Loading...", details: {} });
  const [status, setStatus] = useState("Detecting your live location...");
  const watchIdRef = useRef(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 10;

  const getLocationDetails = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      console.log("OSM Location details:", data);
      return {
        fullAddress: data.display_name || "Address not available",
        details: data.address || {},
      };
    } catch (error) {
      console.error("Error fetching OSM location details:", error);
      return { fullAddress: "Location details not available", details: {} };
    }
  };

  const updateLocation = async (position) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
    
    console.log("Detected live location:", newLocation);
    setLocation(newLocation);
    localStorage.setItem('lastKnownLocation', JSON.stringify(newLocation));
    const details = await getLocationDetails(newLocation.lat, newLocation.lng);
    setLocationDetails(details);
    setStatus(`Live location acquired (Accuracy: ${Math.round(newLocation.accuracy)}m)`);
    retryCountRef.current = 0;
  };

  const handleError = (error) => {
    if (retryCountRef.current < MAX_RETRIES) {
      setStatus(`Retrying location detection... (Attempt ${retryCountRef.current + 1}/${MAX_RETRIES})`);
      retryCountRef.current += 1;
      setTimeout(requestLocation, 3000);
    } else {
      setStatus(`Failed to detect live location: ${error.message}. Using last known position if available.`);
      const lastKnown = localStorage.getItem('lastKnownLocation');
      if (lastKnown) {
        const parsedLocation = JSON.parse(lastKnown);
        console.log("Using last known location:", parsedLocation);
        setLocation(parsedLocation);
        getLocationDetails(parsedLocation.lat, parsedLocation.lng).then(setLocationDetails);
      } else {
        setStatus("Unable to detect location. Please enable location services.");
        setLocation(null);
      }
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported by your browser");
      setLocation(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    requestLocation();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { location, locationDetails, status, refreshLocation: requestLocation };
}

function MapComponent({ userLocation, manualLocation, policeStations, setPoliceStations, setPlaceDetails, refreshTriggered }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingControlsRef = useRef([]);
  const zoneLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const nearestPoliceMarkerRef = useRef(null);
  const nearestRedZoneMarkerRef = useRef(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const getPlaceDetails = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return {
        fullAddress: data.display_name || "Address not available",
        details: data.address || {},
      };
    } catch (error) {
      console.error("Error fetching OSM place details:", error);
      return { fullAddress: "Details not available", details: {} };
    }
  };

  const fetchPoliceStations = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=[out:json];(node["amenity"="police"](around:10000,${lat},${lng});way["amenity"="police"](around:10000,${lat},${lng}););out center;`
      );
      const data = await response.json();
      return data.elements
        .map((element) => ({
          lat: element.lat || element.center.lat,
          lng: element.lon || element.center.lon,
          name: element.tags?.name || "Police Station",
          distance: calculateDistance(lat, lng, element.lat || element.center.lat, element.lon || element.center.lon),
          phone: element.tags?.phone || "Not available",
          address: element.tags?.["addr:full"] || "Address not available",
        }))
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error("Error fetching police stations:", error);
      return [];
    }
  };

  const fetchRedZones = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=[out:json];(way["landuse"="industrial"](around:5000,${lat},${lng});way["highway"~"track|path"](around:5000,${lat},${lng}););out center;`
      );
      const data = await response.json();
      return data.elements
        .map((element) => ({
          lat: element.center.lat,
          lng: element.center.lon,
          type: element.tags?.landuse || element.tags?.highway,
          distance: calculateDistance(lat, lng, element.center.lat, element.center.lon),
        }))
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error("Error fetching red zones:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!mapRef.current || (!userLocation && !manualLocation)) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: userLocation ? [userLocation.lat, userLocation.lng] : [manualLocation.lat, manualLocation.lng],
        zoom: 14,
        maxZoom: 22,
        minZoom: 3,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomControl: true,
      });

      const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 22,
      });

      const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '© <a href="https://www.esri.com/">Esri</a>, USGS, NOAA',
        maxZoom: 22,
      });

      const baseLayers = {
        "OpenStreetMap": osmLayer,
        "Satellite": satelliteLayer,
      };

      osmLayer.addTo(mapInstanceRef.current);
      L.control.layers(baseLayers).addTo(mapInstanceRef.current);
      zoneLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    const zoneLayer = zoneLayerRef.current;

    const updateMap = async (centerLat, centerLng, isManual = false) => {
      routingControlsRef.current.forEach((control) => map.removeControl(control));
      routingControlsRef.current = [];
      zoneLayer.clearLayers();

      if (userMarkerRef.current) userMarkerRef.current.remove();
      if (nearestPoliceMarkerRef.current) nearestPoliceMarkerRef.current.remove();
      if (nearestRedZoneMarkerRef.current) nearestRedZoneMarkerRef.current.remove();

      map.setView([centerLat, centerLng], 14);
      
      userMarkerRef.current = L.marker([centerLat, centerLng], {
        icon: L.divIcon({
          className: isManual ? "manual-marker" : "user-marker",
          html: `<div style="color: ${isManual ? '#d81b60' : '#ff4444'}; font-size: 28px;">${isManual ? '⭐' : '📍'}</div>`,
        }),
      }).addTo(map);

      L.circle([centerLat, centerLng], {
        radius: 100,
        color: isManual ? '#d81b60' : '#ff4444',
        fillColor: isManual ? '#d81b60' : '#ff4444',
        fillOpacity: 0.2,
      }).addTo(zoneLayer);

      userMarkerRef.current.bindPopup(isManual ? "Searched Location" : "Your Live Location").openPopup();

      const placeDetails = await getPlaceDetails(centerLat, centerLng);
      setPlaceDetails(placeDetails);

      const stations = await fetchPoliceStations(centerLat, centerLng);
      setPoliceStations(stations);

      if (stations.length > 0) {
        const nearestStation = stations[0];
        nearestPoliceMarkerRef.current = L.marker([nearestStation.lat, nearestStation.lng], {
          icon: L.divIcon({
            className: "police-marker",
            html: '<div style="color: #0288d1; font-size: 28px;">👮</div>',
          }),
        }).addTo(map);

        L.circle([nearestStation.lat, nearestStation.lng], {
          radius: 200,
          color: '#0288d1',
          fillColor: '#0288d1',
          fillOpacity: 0.2,
        }).addTo(zoneLayer);

        nearestPoliceMarkerRef.current.bindPopup(
          `<strong>Nearest Police Station</strong><br>${nearestStation.name}<br>${nearestStation.address}<br>${nearestStation.distance.toFixed(2)} km<br>${nearestStation.phone}`
        ).openPopup();

        const route = L.Routing.control({
          waypoints: [L.latLng(centerLat, centerLng), L.latLng(nearestStation.lat, nearestStation.lng)],
          lineOptions: {
            styles: [{ color: "#0288d1", weight: 4, opacity: 0.8 }],
          },
          show: true,
          addWaypoints: false,
          routeWhileDragging: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          showAlternatives: false,
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          })
        }).addTo(map);
        
        routingControlsRef.current.push(route);
      }

      const redZones = await fetchRedZones(centerLat, centerLng);
      if (redZones.length > 0) {
        const nearestRedZone = redZones[0];
        nearestRedZoneMarkerRef.current = L.circle([nearestRedZone.lat, nearestRedZone.lng], {
          radius: 300,
          color: '#ff0000',
          fillColor: '#ff0000',
          fillOpacity: 0.15,
        }).addTo(zoneLayer)
          .bindPopup(`<strong>Nearest Red Zone</strong><br>Type: ${nearestRedZone.type}<br>Distance: ${nearestRedZone.distance.toFixed(2)} km`);
      }
    };

    if (manualLocation && !refreshTriggered) {
      updateMap(manualLocation.lat, manualLocation.lng, true);
    } else if (userLocation) {
      updateMap(userLocation.lat, userLocation.lng, false);
    }

    return () => {
      routingControlsRef.current.forEach((control) => {
        if (map.hasLayer(control)) map.removeControl(control);
      });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation, manualLocation, setPoliceStations, setPlaceDetails, refreshTriggered]);

  return <div ref={mapRef} className="leaflet-map" />;
}

function Loc() {
  const { location, locationDetails, status, refreshLocation } = useLiveLocation();
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualLocation, setManualLocation] = useState(null);
  const [policeStations, setPoliceStations] = useState([]);
  const [audioAlert, setAudioAlert] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [placeDetails, setPlaceDetails] = useState({ fullAddress: "", details: {} });
  const [refreshTriggered, setRefreshTriggered] = useState(false);

  const handleManualLocation = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      console.log("Manual location set:", { lat, lng, address: data.display_name });
      setManualLocation({ lat, lng, fullAddress: data.display_name || "Address not available" });
      setPlaceDetails({ fullAddress: data.display_name, details: data.address || {} });
      setRefreshTriggered(false);
      setManualLat("");
      setManualLng("");
    }
  };

  const handleRefresh = () => {
    refreshLocation();
    setManualLocation(null);
    setRefreshTriggered(true);
  };

  const calculateTravelTime = (distance, speed) => (distance / speed) * 60;

  const handleEmergency = () => {
    if (!location) {
      alert("Location not available yet...");
      return;
    }

    const nearestStation = policeStations[0];
    const policeInfo = nearestStation
      ? `${nearestStation.name}: ${nearestStation.distance.toFixed(2)} km\n` +
        `Phone: ${nearestStation.phone}\n` +
        `Car: ${calculateTravelTime(nearestStation.distance, 40).toFixed(1)} min, ` +
        `Bike: ${calculateTravelTime(nearestStation.distance, 30).toFixed(1)} min, ` +
        `Walk: ${calculateTravelTime(nearestStation.distance, 5).toFixed(1)} min`
      : "No nearby police stations detected";

    if (audioAlert) {
      new Audio("https://www.soundjay.com/buttons/beep-01a.mp3").play().catch(console.error);
    }

    if (nearestStation) {
      window.location.href = `tel:${nearestStation.phone}`;
    }

    alert(
      `EMERGENCY ALERT!\n` +
        `Your Location: ${locationDetails.fullAddress}\n` +
        `Your Coordinates: ${location?.lat}, ${location?.lng}\n` +
        `Accuracy: ${Math.round(location?.accuracy || 0)}m\n\n` +
        `Nearest Police Station (Blue Zone):\n${policeInfo}`
    );
  };

  const safetyTips = [
    "Avoid the nearest Red Zone",
    "Seek the nearest Blue Zone (police station) if needed",
    "Stay aware of your surroundings",
    "Use well-lit, populated routes",
    "Trust your intuition",
  ];

  return (
    <div className="loc-page">


      <div className="container">
        <header className="header glass-effect">
          <h1>
            <Shield size={32} /> Women's Safety Guardian
          </h1>
          <p>Protecting You Always</p>
          <a href="/" className="home-button">
            <span>Home</span>
          </a>
        </header>

        <main className="main-content">
          {!isFullScreen && (
            <section className="form-section glass-effect">
              <div className="location-display">
                <h3>{manualLocation && !refreshTriggered ? "Searched Location" : "Your Live Location"}</h3>
                <p><strong>Address:</strong> {locationDetails.fullAddress}</p>
                <p>
                  <strong>Coordinates:</strong> 
                  {(manualLocation && !refreshTriggered) 
                    ? `${manualLocation.lat.toFixed(6)}, ${manualLocation.lng.toFixed(6)}`
                    : `${location?.lat?.toFixed(6)}, ${location?.lng?.toFixed(6)}`}
                </p>
                <p><strong>Details:</strong></p>
                <ul>
                  {Object.entries(placeDetails.details).map(([key, value]) => (
                    <li key={key}><strong>{key}:</strong> {value}</li>
                  ))}
                </ul>
                <p className="status-text"><Info size={16} /> {status}</p>
                <button onClick={handleRefresh} className="location-button">
                  <RefreshCw size={20} /> Return to My Live Location
                </button>
                {policeStations.length > 0 && (
                  <div className="police-info">
                    <p><strong>Nearest Police Station (Blue Zone):</strong></p>
                    <div className="police-station">
                      <Shield size={16} /> <strong>{policeStations[0].name}</strong><br />
                      Distance: {policeStations[0].distance.toFixed(2)} km<br />
                      Phone: {policeStations[0].phone}<br />
                      Address: {policeStations[0].address}<br />
                      Car: {calculateTravelTime(policeStations[0].distance, 40).toFixed(1)} min<br />
                      Bike: {calculateTravelTime(policeStations[0].distance, 30).toFixed(1)} min<br />
                      Walk: {calculateTravelTime(policeStations[0].distance, 5).toFixed(1)} min
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label><Search size={20} /> Search Location</label>
                <div className="coordinates-input">
                  <input
                    type="number"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="Latitude"
                    step="any"
                  />
                  <input
                    type="number"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="Longitude"
                    step="any"
                  />
                </div>
                <button onClick={handleManualLocation} className="location-button">
                  <Search size={20} /> Go to Location
                </button>
              </div>

              <div className="safety-features">
                <button
                  onClick={() => setAudioAlert(!audioAlert)}
                  className={`location-button ${audioAlert ? "active" : ""}`}
                >
                  <Volume2 size={20} /> {audioAlert ? "Disable Alert" : "Enable Alert"}
                </button>
                <div className="safety-tips glass-effect">
                  <h3>Safety Tips</h3>
                  <div className="tips-list">
                    {safetyTips.map((tip, index) => (
                      <div key={index} className="tip-item">
                        <CheckCircle size={16} /> {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleEmergency} className="emergency-button sos">
                <AlertCircle size={24} /> EMERGENCY SOS
              </button>
            </section>
          )}

          <section className={`map-section ${isFullScreen ? "fullscreen" : ""}`}>
            <MapComponent
              userLocation={location}
              manualLocation={manualLocation}
              policeStations={policeStations}
              setPoliceStations={setPoliceStations}
              setPlaceDetails={setPlaceDetails}
              refreshTriggered={refreshTriggered}
            />
            <div className="map-buttons">
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="fullscreen-toggle location-button"
              >
                <Map size={20} /> {isFullScreen ? "Exit Fullscreen" : "Fullscreen Map"}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Loc;