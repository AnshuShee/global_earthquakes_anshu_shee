import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Activity, Server, AlertTriangle, Users, Compass, Eye, ShieldAlert } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // States for analytical telemetry
  const [totalCount, setTotalCount] = useState(0);
  const [avgMagnitude, setAvgMagnitude] = useState(0);
  const [avgDepth, setAvgDepth] = useState(0);

  const [countryAnalysis, setCountryAnalysis] = useState([]);
  const [magAnalysis, setMagAnalysis] = useState([]);
  const [depthAnalysis, setDepthAnalysis] = useState([]);
  const [highestMagRecords, setHighestMagRecords] = useState([]);
  const [deepestRecords, setDeepestRecords] = useState([]);
  const [health, setHealth] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);

    // Resilient getter wrapper to prevent failures from crashing other elements
    const safeGet = async (endpoint, fallback = null) => {
      try {
        const res = await api.get(endpoint);
        return res.data?.data || fallback;
      } catch (err) {
        console.warn(`Telemetry failed fetching ${endpoint}:`, err);
        return fallback;
      }
    };

    const [
      countData,
      magData,
      depthData,
      countryData,
      magCatData,
      depthCatData,
      highMagRecData,
      deepRecData,
      healthData
    ] = await Promise.all([
      safeGet('/stats/earthquakes/count', { total: 0 }),
      safeGet('/stats/earthquakes/average-magnitude', { averageMagnitude: 0 }),
      safeGet('/stats/earthquakes/average-depth', { averageDepthKm: 0 }),
      safeGet('/analytics/earthquakes/country-analysis', []),
      safeGet('/analytics/earthquakes/magnitude-analysis', []),
      safeGet('/analytics/earthquakes/depth-analysis', []),
      safeGet('/analytics/earthquakes/highest-magnitude', []),
      safeGet('/analytics/earthquakes/deepest', []),
      safeGet('/system/health', null)
    ]);

    setTotalCount(countData?.total || 0);
    setAvgMagnitude(magData?.averageMagnitude || 0);
    setAvgDepth(depthData?.averageDepthKm || 0);
    setCountryAnalysis(countryData);
    setMagAnalysis(magCatData);
    setDepthAnalysis(depthCatData);
    setHighestMagRecords(highMagRecData);
    setDeepestRecords(deepRecData);
    setHealth(healthData);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-state">Compiling global seismic telemetry...</div>;
  }

  // Calculate maximum limits for progress bars
  const maxCountryCount = countryAnalysis.length > 0 ? Math.max(...countryAnalysis.map(c => c.count)) : 1;
  const maxMagCount = magAnalysis.length > 0 ? Math.max(...magAnalysis.map(m => m.count)) : 1;
  const maxDepthCount = depthAnalysis.length > 0 ? Math.max(...depthAnalysis.map(d => d.count)) : 1;

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Global Seismic Telemetry Dashboard</h1>
        <p className="text-muted">Welcome back, {user?.name}. Real-time monitoring metrics and analytics.</p>
      </header>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h3>Registered Seismic Events</h3>
            <p className="stat-value">{totalCount.toLocaleString()}</p>
            <span className="stat-subtitle">All active database records</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-danger)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3>Average Magnitude</h3>
            <p className="stat-value">{Number(avgMagnitude).toFixed(2)}M</p>
            <span className="stat-subtitle">Global mean magnitude index</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-secondary)' }}>
            <Compass size={24} />
          </div>
          <div className="stat-info">
            <h3>Average Depth</h3>
            <p className="stat-value">{Number(avgDepth).toFixed(1)} km</p>
            <span className="stat-subtitle">Global hypocenter depth mean</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-success)' }}>
            <Server size={24} />
          </div>
          <div className="stat-info">
            <h3>Telemetry Node Status</h3>
            <p className="stat-value">{health?.status === 'UP' ? 'ONLINE' : 'OFFLINE'}</p>
            <span className="stat-subtitle">DB Node: {health?.database?.status || 'CONNECTED'}</span>
          </div>
        </div>
      </div>

      {/* Grid of Analyses */}
      <div className="analysis-grid">
        {/* Country distribution */}
        <div className="chart-panel glass-panel">
          <h2>Regional Distribution (Top Countries)</h2>
          {countryAnalysis.length > 0 ? (
            <div className="country-list">
              {countryAnalysis.slice(0, 5).map((stat, idx) => (
                <div key={idx} className="country-row">
                  <span className="country-name">{stat.country}</span>
                  <div className="country-bar-container">
                    <div
                      className="country-bar"
                      style={{
                        width: `${(stat.count / maxCountryCount) * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                      }}
                    ></div>
                  </div>
                  <span className="country-count">{stat.count} events</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted py-4">No regional data available. Run seeder to import records.</p>
          )}
        </div>

        {/* Magnitude Buckets */}
        <div className="chart-panel glass-panel">
          <h2>Magnitude Categorization Groups</h2>
          {magAnalysis.length > 0 ? (
            <div className="country-list">
              {magAnalysis.map((bucket, idx) => (
                <div key={idx} className="country-row">
                  <span className="country-name" title={bucket.category}>{bucket.category.split(' (')[0]}</span>
                  <div className="country-bar-container">
                    <div
                      className="country-bar"
                      style={{
                        width: `${(bucket.count / maxMagCount) * 100}%`,
                        background: 'var(--accent-warning)',
                        boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)'
                      }}
                    ></div>
                  </div>
                  <span className="country-count">{bucket.count} events</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted py-4">No magnitude bucket analysis stats compiled.</p>
          )}
        </div>

        {/* Depth Buckets */}
        <div className="chart-panel glass-panel">
          <h2>Depth Level Groupings</h2>
          {depthAnalysis.length > 0 ? (
            <div className="country-list">
              {depthAnalysis.map((bucket, idx) => (
                <div key={idx} className="country-row">
                  <span className="country-name" title={bucket.category}>{bucket.category.split(' (')[0]}</span>
                  <div className="country-bar-container">
                    <div
                      className="country-bar"
                      style={{
                        width: `${(bucket.count / maxDepthCount) * 100}%`,
                        background: 'var(--accent-primary)'
                      }}
                    ></div>
                  </div>
                  <span className="country-count">{bucket.count} events</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted py-4">No depth categorizations analysis compiled.</p>
          )}
        </div>
      </div>

      <div className="lists-grid">
        {/* Highest Magnitude List */}
        <div className="chart-panel glass-panel">
          <h2>Highest Decibel Seismic Events</h2>
          {highestMagRecords.length > 0 ? (
            <div className="event-teaser-list">
              {highestMagRecords.slice(0, 5).map((eq) => (
                <div key={eq._id} className="event-teaser-item">
                  <div className="mag-display high">{eq.mag.toFixed(1)}</div>
                  <div className="teaser-details">
                    <strong>{eq.place}</strong>
                    <span>Depth: {eq.depth} km | Date: {new Date(eq.time).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted py-4">No seismic events records found.</p>
          )}
        </div>

        {/* Deepest Hypocenter List */}
        <div className="chart-panel glass-panel">
          <h2>Deepest Seismological Hypocenters</h2>
          {deepestRecords.length > 0 ? (
            <div className="event-teaser-list">
              {deepestRecords.slice(0, 5).map((eq) => (
                <div key={eq._id} className="event-teaser-item">
                  <div className="mag-display deep">{eq.depth} km</div>
                  <div className="teaser-details">
                    <strong>{eq.place}</strong>
                    <span>Magnitude: {eq.mag} M | Date: {new Date(eq.time).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted py-4">No deep hypocenters compiled.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
