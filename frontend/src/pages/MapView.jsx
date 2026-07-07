import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { Compass, AlertOctagon, Activity, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import './MapView.css';

const MapView = () => {
  const [earthquakes, setEarthquakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'high-mag', 'deep', 'shallow', 'critical'

  const fetchLocations = async (filterType) => {
    setLoading(true);
    try {
      let endpoint = '/earthquakes?limit=100';
      if (filterType === 'high-mag') {
        endpoint = '/earthquakes/high-magnitude?limit=100';
      } else if (filterType === 'deep') {
        endpoint = '/earthquakes/deep?limit=100';
      } else if (filterType === 'shallow') {
        endpoint = '/earthquakes/shallow?limit=100';
      } else if (filterType === 'critical') {
        endpoint = '/earthquakes/critical?limit=100';
      }

      const res = await api.get(endpoint);
      setEarthquakes(res.data.data || []);
    } catch (err) {
      console.error('Failed to load map points:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(activeFilter);
  }, [activeFilter]);

  return (
    <div className="map-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Global Seismic Map Tracker</h1>
          <p className="text-muted">Interactive map showing recent global seismic occurrences mapped onto OSM.</p>
        </div>

        {/* Filter controls floating */}
        <div className="map-filter-row glass-panel">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Filter size={14} /> MAPPED FILTER:
          </span>
          <button
            className={`map-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Events
          </button>
          <button
            className={`map-filter-btn ${activeFilter === 'high-mag' ? 'active' : ''}`}
            onClick={() => setActiveFilter('high-mag')}
          >
            Mag &ge; 5.0
          </button>
          <button
            className={`map-filter-btn ${activeFilter === 'shallow' ? 'active' : ''}`}
            onClick={() => setActiveFilter('shallow')}
          >
            Shallow depth
          </button>
          <button
            className={`map-filter-btn ${activeFilter === 'deep' ? 'active' : ''}`}
            onClick={() => setActiveFilter('deep')}
          >
            Deep depth
          </button>
          <button
            className={`map-filter-btn ${activeFilter === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveFilter('critical')}
          >
            Critical
          </button>
        </div>
      </header>

      <div className="map-wrapper glass-panel">
        {loading ? (
          <div className="loading-state" style={{ height: '600px' }}>Analyzing telemetry grid...</div>
        ) : (
          <MapContainer
            center={[20, 0]}
            zoom={2.2}
            scrollWheelZoom={true}
            style={{ height: '600px', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles"
            />
            {earthquakes.map((eq) => {
              if (!eq.coordinates || eq.coordinates.length < 2) return null;
              // Coordinates in GeoJSON are usually [longitude, latitude], Leaflet needs [latitude, longitude]
              const [lng, lat] = eq.coordinates;

              let radius = 6;
              let color = '#3B82F6'; // Default Light/Moderate Blue

              const magnitude = eq.mag || eq.magnitude || 0;

              if (magnitude >= 6.0) {
                color = '#EF4444'; // Red for severe
                radius = Math.max(magnitude * 2.8, 12);
              } else if (magnitude >= 5.0) {
                color = '#F59E0B'; // Orange for strong
                radius = Math.max(magnitude * 2.2, 9);
              } else {
                radius = Math.max(magnitude * 1.8, 5);
              }

              return (
                <CircleMarker
                  key={eq._id}
                  center={[lat, lng]}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.6,
                    weight: magnitude >= 6.0 ? 2 : 1
                  }}
                  radius={radius}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.25rem' }}>{eq.place || eq.location}</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '180px', marginTop: '0.5rem' }}>
                        <div><strong>Mag:</strong> {magnitude.toFixed(1)} M</div>
                        <div><strong>Depth:</strong> {eq.depth} km</div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <strong>Date:</strong> {new Date(eq.time).toLocaleDateString()}
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{eq.status}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default MapView;
