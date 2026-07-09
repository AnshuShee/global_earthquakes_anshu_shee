import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Search, Filter, Edit, Trash2, Plus, Info, RefreshCw, X, Sliders } from 'lucide-react';
import './EarthquakesList.css';

const EarthquakesList = () => {
  const { user } = useContext(AuthContext);

  // Data list and pagination states
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Search & dynamic filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filterMinMag, setFilterMinMag] = useState('');
  const [filterMaxMag, setFilterMaxMag] = useState('');
  const [filterMinDepth, setFilterMinDepth] = useState('');
  const [filterMaxDepth, setFilterMaxDepth] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterPlace, setFilterPlace] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [sortField, setSortField] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal control states
  const [selectedEqDetails, setSelectedEqDetails] = useState(null); // Detail modal
  const [showCrudModal, setShowCrudModal] = useState(false); // Create/Edit modal
  const [crudMode, setCrudMode] = useState('create'); // 'create' or 'edit'
  const [crudError, setCrudError] = useState('');
  const [crudSuccess, setCrudSuccess] = useState('');
  const [crudLoading, setCrudLoading] = useState(false);

  // Form states for Create/Edit
  const [formId, setFormId] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formDepth, setFormDepth] = useState('');
  const [formMag, setFormMag] = useState('');
  const [formMagType, setFormMagType] = useState('mw');
  const [formNet, setFormNet] = useState('us');
  const [formPlace, setFormPlace] = useState('');
  const [formStatus, setFormStatus] = useState('reviewed');
  const [formLocationSource, setFormLocationSource] = useState('us');
  const [formMagSource, setFormMagSource] = useState('us');

  const buildQueryParams = (pageNum) => {
    let params = {
      page: pageNum,
      limit: 10
    };

    // Sort query
    if (sortField) {
      params.sort = `${sortOrder === 'desc' ? '-' : ''}${sortField}`;
    }

    // Apply exact/range filters
    if (filterMinMag) params.minMagnitude = filterMinMag;
    if (filterMaxMag) params.maxMagnitude = filterMaxMag;
    if (filterMinDepth) params.minDepth = filterMinDepth;
    if (filterMaxDepth) params.maxDepth = filterMaxDepth;
    if (filterCountry) params.country = filterCountry;
    if (filterPlace) params.place = filterPlace;
    if (filterStatus) params.status = filterStatus;

    return params;
  };

  const fetchEarthquakes = async (pageNum) => {
    setLoading(true);
    try {
      let res;
      if (isSearching && searchQuery.trim() !== '') {
        // Run search endpoint
        const params = buildQueryParams(pageNum);
        res = await api.get(`/search/earthquakes?q=${encodeURIComponent(searchQuery)}`, { params });
      } else {
        // Run regular paginated list router
        const params = buildQueryParams(pageNum);
        res = await api.get('/earthquakes', { params });
      }

      setData(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.totalRecords || 0);
    } catch (err) {
      console.error('Failed to load earthquakes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarthquakes(page);
  }, [page, isSearching, sortField, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearching(searchQuery.trim() !== '');
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilterMinMag('');
    setFilterMaxMag('');
    setFilterMinDepth('');
    setFilterMaxDepth('');
    setFilterCountry('');
    setFilterPlace('');
    setFilterStatus('');
    setSearchQuery('');
    setIsSearching(false);
    setPage(1);
    fetchEarthquakes(1);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchEarthquakes(1);
  };

  // Open details
  const handleOpenDetails = (eq) => {
    setSelectedEqDetails(eq);
  };

  // Open Create/Edit modal
  const handleOpenCrudModal = (mode, eq = null) => {
    setCrudMode(mode);
    setCrudError('');
    setCrudSuccess('');

    if (mode === 'edit' && eq) {
      setFormId(eq.id || '');
      setFormTime(eq.time ? new Date(eq.time).toISOString().slice(0, 16) : '');
      const [lng, lat] = eq.coordinates || [0, 0];
      setFormLatitude(lat.toString());
      setFormLongitude(lng.toString());
      setFormDepth(eq.depth?.toString() || '');
      setFormMag(eq.mag?.toString() || eq.magnitude?.toString() || '');
      setFormMagType(eq.magType || 'mw');
      setFormNet(eq.net || 'us');
      setFormPlace(eq.place || eq.location || '');
      setFormStatus(eq.status || 'reviewed');
      setFormLocationSource(eq.locationSource || 'us');
      setFormMagSource(eq.magSource || 'us');
    } else {
      // Clear forms
      setFormId('us' + Math.random().toString(36).substr(2, 9));
      setFormTime(new Date().toISOString().slice(0, 16));
      setFormLatitude('25.30');
      setFormLongitude('98.40');
      setFormDepth('10.0');
      setFormMag('5.0');
      setFormMagType('mw');
      setFormNet('us');
      setFormPlace('10km E of Myitkyina, Myanmar');
      setFormStatus('reviewed');
      setFormLocationSource('us');
      setFormMagSource('us');
    }

    setShowCrudModal(true);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setCrudError('');
    setCrudSuccess('');
    setCrudLoading(true);

    try {
      const payload = {
        id: formId,
        time: new Date(formTime).toISOString(),
        latitude: parseFloat(formLatitude),
        longitude: parseFloat(formLongitude),
        depth: parseFloat(formDepth),
        mag: parseFloat(formMag),
        magType: formMagType,
        net: formNet,
        updated: new Date().toISOString(),
        place: formPlace,
        status: formStatus,
        locationSource: formLocationSource,
        magSource: formMagSource
      };

      let res;
      if (crudMode === 'edit') {
        res = await api.patch(`/earthquakes/${formId}`, payload);
      } else {
        res = await api.post('/earthquakes', payload);
      }

      if (res.data.success) {
        setCrudSuccess(`Record successfully ${crudMode === 'edit' ? 'updated' : 'created'}!`);
        setTimeout(() => {
          setShowCrudModal(false);
          fetchEarthquakes(page);
        }, 1500);
      }
    } catch (err) {
      setCrudError(err.response?.data?.message || 'Error processing record. Validate input formats.');
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDeleteRecord = async (eqId) => {
    if (!window.confirm(`Are you sure you want to soft delete the seismic record: ${eqId}?`)) return;
    try {
      const res = await api.delete(`/earthquakes/${eqId}`);
      if (res.data.success) {
        alert('Seismic register soft-deleted successfully.');
        fetchEarthquakes(page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record.');
    }
  };

  return (
    <div className="earthquakes-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Seismic Events Registry</h1>
          <p className="text-muted">Browse, filter, and search through recorded global earthquakes ({totalRecords.toLocaleString()} events).</p>
        </div>
        {user && (
          <button className="btn-primary" onClick={() => handleOpenCrudModal('create')}>
            <Plus size={16} /> Create Record
          </button>
        )}
      </header>

      {/* Query Bar */}
      <div className="query-settings glass-panel">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <input
            type="text"
            className="form-input"
            placeholder="Search keywords (e.g. indonesia, deep, mw, automatic)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-page" style={{ padding: '0.75rem' }}>
            <Search size={18} />
          </button>
        </form>

        <div className="query-btn-row">
          <button className={`btn-page ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} /> Filters
          </button>
          <button className="btn-page" onClick={handleClearFilters}>
            Reset Query
          </button>
          <div className="sort-selectors">
            <span>Sort:</span>
            <select className="form-input small" value={sortField} onChange={(e) => setSortField(e.target.value)}>
              <option value="time">Date & Time</option>
              <option value="magnitude">Magnitude</option>
              <option value="depth">Hypocenter Depth</option>
            </select>
            <select className="form-input small" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Expandable filters block */}
        {showFilters && (
          <div className="filters-expanded-pane">
            <div className="filters-grid">
              <div className="filters-group">
                <label className="form-label">Magnitude Bounds</label>
                <div className="range-inputs">
                  <input type="number" placeholder="Min" className="form-input" value={filterMinMag} onChange={(e) => setFilterMinMag(e.target.value)} />
                  <input type="number" placeholder="Max" className="form-input" value={filterMaxMag} onChange={(e) => setFilterMaxMag(e.target.value)} />
                </div>
              </div>
              <div className="filters-group">
                <label className="form-label">Depth Range (km)</label>
                <div className="range-inputs">
                  <input type="number" placeholder="Min" className="form-input" value={filterMinDepth} onChange={(e) => setFilterMinDepth(e.target.value)} />
                  <input type="number" placeholder="Max" className="form-input" value={filterMaxDepth} onChange={(e) => setFilterMaxDepth(e.target.value)} />
                </div>
              </div>
              <div className="filters-group">
                <label className="form-label">Place Description</label>
                <input type="text" placeholder="e.g. california" className="form-input" value={filterPlace} onChange={(e) => setFilterPlace(e.target.value)} />
              </div>
              <div className="filters-group">
                <label className="form-label">Country Tag</label>
                <input type="text" placeholder="e.g. japan" className="form-input" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} />
              </div>
              <div className="filters-group">
                <label className="form-label">Review Status</label>
                <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={handleApplyFilters} style={{ alignSelf: 'flex-end', marginTop: '1rem' }}>
              Apply Telemetry Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="data-table-wrapper glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Register ID</th>
              <th>Geographic Location</th>
              <th>Magnitude</th>
              <th>Depth (km)</th>
              <th>Review Status</th>
              <th>Date & Time</th>
              <th>Operations</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <RefreshCw size={24} className="spin-animation" style={{ margin: 'auto' }} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">No seismological records found matching query parameters.</td>
              </tr>
            ) : (
              data.map((eq) => (
                <tr key={eq._id || eq.id}>
                  <td className="code-text">{eq.id}</td>
                  <td>{eq.place || eq.location}</td>
                  <td>
                    <span className={`mag-badge ${eq.mag > 5.5 ? 'mag-high' : 'mag-normal'}`}>
                      {(eq.mag || eq.magnitude)?.toFixed(1)} M
                    </span>
                  </td>
                  <td>{eq.depth} km</td>
                  <td>
                    <span className={`status-badge ${eq.status}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td>{eq.time ? new Date(eq.time).toLocaleString() : 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => handleOpenDetails(eq)} title="More details">
                        <Info size={16} />
                      </button>
                      {user && (
                        <button className="btn-icon" onClick={() => handleOpenCrudModal('edit', eq)} title="Edit record">
                          <Edit size={16} />
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button className="btn-icon delete-btn" onClick={() => handleDeleteRecord(eq.id)} title="Delete record">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn-page"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button
              className="btn-page"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* DETAIL DIALOG MODAL */}
      {selectedEqDetails && (
        <div className="modal-overlay" onClick={() => setSelectedEqDetails(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Seismicity Record Profile</h2>
              <button className="close-btn" onClick={() => setSelectedEqDetails(null)}>&times;</button>
            </div>

            <div className="eq-detail-profile">
              <div className="detail-hero-box" style={{ background: selectedEqDetails.mag > 5.5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}>
                <strong className={`large-magnitude ${selectedEqDetails.mag > 5.5 ? 'high' : 'normal'}`}>
                  {selectedEqDetails.mag?.toFixed(2)}M
                </strong>
                <span>{selectedEqDetails.place || selectedEqDetails.location}</span>
                <span className="source-info">Source: {selectedEqDetails.net?.toUpperCase()} ({selectedEqDetails.magType})</span>
              </div>

              <div className="detail-meta-grid">
                <div className="meta-cell">
                  <span className="cell-label">Dataset Key ID</span>
                  <span className="cell-value">{selectedEqDetails.id}</span>
                </div>
                <div className="meta-cell">
                  <span className="cell-label">Date & Time</span>
                  <span className="cell-value">{new Date(selectedEqDetails.time).toLocaleString()}</span>
                </div>
                <div className="meta-cell">
                  <span className="cell-label">Hypocenter Depth</span>
                  <span className="cell-value">{selectedEqDetails.depth} km</span>
                </div>
                <div className="meta-cell">
                  <span className="cell-label">Coordinates</span>
                  <span className="cell-value">
                    {selectedEqDetails.coordinates ? `Lat: ${selectedEqDetails.coordinates[1]}, Lng: ${selectedEqDetails.coordinates[0]}` : 'N/A'}
                  </span>
                </div>
                <div className="meta-cell">
                  <span className="cell-label">Seismic Gap</span>
                  <span className="cell-value">{selectedEqDetails.gap ? `${selectedEqDetails.gap}°` : 'N/A'}</span>
                </div>
                <div className="meta-cell">
                  <span className="cell-label">RMS error rate</span>
                  <span className="cell-value">{selectedEqDetails.rms || 'N/A'}</span>
                </div>
                <div className="meta-cell">
                  <span className="cell-label">Stations count</span>
                  <span className="cell-value">{selectedEqDetails.nst || 'N/A'}</span>
                </div>
                <div className="meta-cell">
                  <span className="cell-label">Review Status</span>
                  <span className="cell-value" style={{ textTransform: 'capitalize' }}>{selectedEqDetails.status}</span>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={() => setSelectedEqDetails(null)}>Close Profile</button>
          </div>
        </div>
      )}

      {/* CREATE & EDIT RECORD DIALOG MODAL */}
      {showCrudModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel font-main" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>{crudMode === 'edit' ? 'Edit Seismic Record' : 'Create Seismic Record'}</h2>
              <button className="close-btn" onClick={() => setShowCrudModal(false)}>&times;</button>
            </div>

            {crudError && <div className="profile-error">{crudError}</div>}
            {crudSuccess && <div className="profile-success">{crudSuccess}</div>}

            <form onSubmit={handleSaveRecord} className="crud-form">
              <div className="crud-form-scrollable">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Dataset IDKey</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      disabled={crudMode === 'edit'}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Epoch Date Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="-90"
                      max="90"
                      className="form-input"
                      value={formLatitude}
                      onChange={(e) => setFormLatitude(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="-180"
                      max="180"
                      className="form-input"
                      value={formLongitude}
                      onChange={(e) => setFormLongitude(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Depth (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formDepth}
                      onChange={(e) => setFormDepth(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Magnitude (M)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      className="form-input"
                      value={formMag}
                      onChange={(e) => setFormMag(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mag Type</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formMagType}
                      onChange={(e) => setFormMagType(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reporting Network</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formNet}
                      onChange={(e) => setFormNet(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Geographic Place Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPlace}
                    onChange={(e) => setFormPlace(e.target.value)}
                    placeholder="e.g. 50km NW of Anchorage, Alaska"
                    required
                  />
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Report Status</label>
                    <select className="form-input" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                      <option value="reviewed">Reviewed</option>
                      <option value="automatic">Automatic</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location Source</label>
                    <input type="text" className="form-input" value={formLocationSource} onChange={(e) => setFormLocationSource(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Magnitude Source</label>
                    <input type="text" className="form-input" value={formMagSource} onChange={(e) => setFormMagSource(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={crudLoading}>
                  {crudLoading ? 'Saving...' : `${crudMode === 'edit' ? 'Save Changes' : 'Create Record'}`}
                </button>
                <button type="button" className="btn-page" onClick={() => setShowCrudModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarthquakesList;
