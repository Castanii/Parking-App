import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getAvailabilitySummary, getAvailableSlots, type AreaAvailabilitySummary } from '../lib/parkingService';
import { useParkingWebSocket } from '../lib/parkingWebSocket';
import { getVehicles, type VehicleResponse } from '../lib/vehicleService';
import { Navigation, MapPin, AlertCircle, Car, ChevronDown, X, Clock, ArrowRight, RotateCcw } from 'lucide-react';

import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl';
import type { Feature } from 'geojson';
import { SearchBox } from '@mapbox/search-js-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
const CLUJ_CENTER = { lat: 46.7556635, lng: 23.57446 };
const BUSY_THRESHOLD = 0.2;
const POLL_INTERVAL_MS = 30_000;

// A lot is "busy" when available slots ≤ max(1, 20% of total).
// Using Math.max(1, ...) ensures small lots (2–4 slots) show yellow
// instead of jumping straight from green to red.
function computeLotStatus(available: number, total: number): 'available' | 'busy' | 'full' {
  if (available === 0) return 'full';
  if (available <= Math.max(1, Math.floor(total * BUSY_THRESHOLD))) return 'busy';
  return 'available';
}

interface DirectionStep {
  maneuver: { instruction: string };
  distance: number;
}

interface RouteInfo {
  geometry: Feature;
  distanceM: number;
  durationS: number;
  steps: DirectionStep[];
}

type NavPhase = 'idle' | 'navigating' | 'rerouting';

interface RerouteAlert {
  message: string;
  suggestedLot: ParkingAreaWithSlots;
}

interface ParkingAreaWithSlots extends AreaAvailabilitySummary {
  available: number;
  total: number;
  status: 'available' | 'busy' | 'full';
}

export function MapView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<MapRef>(null);

  const [lots, setLots] = useState<ParkingAreaWithSlots[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [selectedLot, setSelectedLot] = useState<ParkingAreaWithSlots | null>(null);
  const [userLocation, setUserLocation] = useState(CLUJ_CENTER);
  const geoWatchRef = useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(1);
  const [selectedCar, setSelectedCar] = useState('');
  const [showCarSelector, setShowCarSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [navPhase, setNavPhase] = useState<NavPhase>('idle');
  const [navigationTarget, setNavigationTarget] = useState<ParkingAreaWithSlots | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [rerouteAlert, setRerouteAlert] = useState<RerouteAlert | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  useParkingWebSocket((update) => {
    const newStatus = computeLotStatus(update.availableSlots, update.totalSlots);

    setLots(prev => prev.map(lot =>
      lot.id === update.parkingAreaId
        ? { ...lot, available: update.availableSlots, total: update.totalSlots, status: newStatus }
        : lot
    ));
    setSelectedLot(prev =>
      prev?.id === update.parkingAreaId
        ? { ...prev, available: update.availableSlots, total: update.totalSlots, status: newStatus }
        : prev
    );
    setNavigationTarget(prev =>
      prev?.id === update.parkingAreaId
        ? { ...prev, available: update.availableSlots, total: update.totalSlots, status: newStatus }
        : prev
    );

    // Trigger reroute via WebSocket when navigation target becomes full or busy
    if (navPhase === 'navigating' && navigationTarget?.id === update.parkingAreaId &&
        (newStatus === 'full' || newStatus === 'busy')) {
      const nearestAlternative = lots
        .filter(l => l.id !== update.parkingAreaId && l.available > 0)
        .sort((a, b) =>
          calculateDistance(navigationTarget.latitude, navigationTarget.longitude, a.latitude, a.longitude) -
          calculateDistance(navigationTarget.latitude, navigationTarget.longitude, b.latitude, b.longitude)
        )[0];
      if (nearestAlternative) {
        setNavPhase('rerouting');
        setRerouteAlert({
          message: `Doar ${update.availableSlots} ${update.availableSlots !== 1 ? 'locuri rămase' : 'loc rămas'} la ${navigationTarget.name}!`,
          suggestedLot: nearestAlternative,
        });
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }
  });

  // Poll availability during active navigation and trigger rerouting
  useEffect(() => {
    if (navPhase !== 'navigating' || !navigationTarget) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    const poll = async () => {
      try {
        const slots = await getAvailableSlots(navigationTarget.id);
        const available = slots.length;
        const status = computeLotStatus(available, navigationTarget.total);

        setLots(currentLots =>
          currentLots.map(lot =>
            lot.id === navigationTarget.id
              ? { ...lot, available, status }
              : lot
          )
        );
        setSelectedLot(currentSelectedLot =>
          currentSelectedLot?.id === navigationTarget.id
            ? { ...currentSelectedLot, available, status }
            : currentSelectedLot
        );
        setNavigationTarget(currentNavigationTarget =>
          currentNavigationTarget?.id === navigationTarget.id
            ? { ...currentNavigationTarget, available, status }
            : currentNavigationTarget
        );
        if (status === 'busy' || status === 'full') {
          const nearestAlternative = lots
            .filter(l => l.id !== navigationTarget.id && l.available > 0)
            .sort((a, b) =>
              calculateDistance(navigationTarget.latitude, navigationTarget.longitude, a.latitude, a.longitude) -
              calculateDistance(navigationTarget.latitude, navigationTarget.longitude, b.latitude, b.longitude)
            )[0];

          if (nearestAlternative) {
            setNavPhase('rerouting');
            setRerouteAlert({
              message: `Doar ${available} ${available !== 1 ? 'locuri rămase' : 'loc rămas'} la ${navigationTarget.name}!`,
              suggestedLot: nearestAlternative,
            });
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {
        // network error during poll — ignore
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [navPhase, navigationTarget, lots]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    geoWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(CLUJ_CENTER),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => {
      if (geoWatchRef.current !== null) navigator.geolocation.clearWatch(geoWatchRef.current);
    };
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const [summary, userVehicles] = await Promise.all([
        getAvailabilitySummary(),
        getVehicles(user.id),
      ]);

      const areasWithSlots: ParkingAreaWithSlots[] = summary.map((area) => ({
        ...area,
        available: area.availableSlots,
        total: area.totalSlots,
        status: computeLotStatus(area.availableSlots, area.totalSlots),
      }));

      setLots(areasWithSlots);
      setVehicles(userVehicles);
      if (userVehicles.length > 0) setSelectedCar(userVehicles[0].id);
    } catch (err) {
      console.error('Failed to load parking data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoute = useCallback(async (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<RouteInfo | null> => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?steps=true&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return null;
      const route = data.routes[0];
      return {
        geometry: { type: 'Feature', properties: {}, geometry: route.geometry },
        distanceM: route.distance,
        durationS: route.duration,
        steps: route.legs[0]?.steps ?? [],
      };
    } catch {
      return null;
    }
  }, []);

  const startNavigation = useCallback(async (lot: ParkingAreaWithSlots) => {
    if (!MAPBOX_TOKEN) {
      alert('Mapbox token missing. Create frontend/.env.local with VITE_MAPBOX_ACCESS_TOKEN=pk.your_token');
      return;
    }
    setRouteLoading(true);
    const route = await fetchRoute(userLocation, { lat: lot.latitude, lng: lot.longitude });
    setRouteLoading(false);
    if (!route) {
      alert('Nu s-a putut calcula ruta. Verificați tokenul Mapbox și conexiunea la rețea.');
      return;
    }
    setNavigationTarget(lot);
    setActiveRoute(route);
    setNavPhase('navigating');
    setSelectedLot(lot);
    if (mapRef.current) {
      mapRef.current.fitBounds(
        [[Math.min(userLocation.lng, lot.longitude), Math.min(userLocation.lat, lot.latitude)],
         [Math.max(userLocation.lng, lot.longitude), Math.max(userLocation.lat, lot.latitude)]],
        { padding: 80, duration: 1500 }
      );
    }
  }, [fetchRoute, userLocation]);

  const stopNavigation = useCallback(() => {
    setNavPhase('idle');
    setNavigationTarget(null);
    setActiveRoute(null);
    setRerouteAlert(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const acceptReroute = useCallback(async (lot: ParkingAreaWithSlots) => {
    setRerouteAlert(null);
    await startNavigation(lot);
  }, [startNavigation]);

  const selectedCarInfo = vehicles.find(c => c.id === selectedCar);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findNearestAvailable = (currentLot: ParkingAreaWithSlots) => {
    const availableLots = lots.filter(
        lot => lot.id !== currentLot.id && lot.status === 'available' && lot.available > 0
    );
    if (availableLots.length === 0) return null;
    return availableLots.reduce((nearest, lot) => {
      const distToLot = calculateDistance(userLocation.lat, userLocation.lng, lot.latitude, lot.longitude);
      const distToNearest = calculateDistance(userLocation.lat, userLocation.lng, nearest.latitude, nearest.longitude);
      return distToLot < distToNearest ? lot : nearest;
    });
  };

  const handleReserve = (lot: ParkingAreaWithSlots) => {
    if (lot.status === 'full' || lot.available === 0) {
      const nearest = findNearestAvailable(lot);
      if (nearest) {
        setSelectedLot(nearest);
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [nearest.longitude, nearest.latitude], zoom: 16, duration: 1500 });
        }
      } else {
        alert('Nicio parcare disponibilă în apropiere.');
      }
    } else {
      navigate(`/payment/${lot.id}`);
    }
  };

  const filteredLots = (() => {
    if (searchCenter) {
      return lots.filter(lot =>
        calculateDistance(searchCenter.lat, searchCenter.lng, lot.latitude, lot.longitude) <= searchRadius
      );
    }
    if (searchQuery.trim()) {
      return lots.filter(lot =>
        lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lot.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return lots;
  })();

  return (
      <div className="h-[calc(100vh-73px)] flex flex-col lg:flex-row overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 relative bg-gray-100 min-h-[300px]">
          <Map
              ref={mapRef}
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{
                longitude: userLocation.lng,
                latitude: userLocation.lat,
                zoom: 14
              }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              style={{ width: '100%', height: '100%', position: 'absolute' }}
          >
            {/* Route line */}
            {activeRoute && (
              <Source id="route" type="geojson" data={activeRoute.geometry}>
                <Layer
                  id="route-line"
                  type="line"
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{ 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85 }}
                />
              </Source>
            )}

            {/* User location dot */}
            <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
              <div className="relative">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg z-10 relative" />
                <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-60" />
              </div>
            </Marker>

            {filteredLots.map((lot) => {
              const isNavTarget = navigationTarget?.id === lot.id;
              return (
                <Marker
                    key={lot.id}
                    longitude={lot.longitude}
                    latitude={lot.latitude}
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setSelectedLot(lot);
                    }}
                >
                  <div className="relative transform transition-transform hover:scale-110 cursor-pointer">
                    {isNavTarget && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-blue-400 animate-ping opacity-50" />
                      </div>
                    )}
                    <MapPin
                        className={`w-8 h-8 relative z-10 ${
                            lot.status === 'full' ? 'text-red-500' :
                                lot.status === 'busy' ? 'text-yellow-500' :
                                    'text-green-500'
                        } drop-shadow-lg`}
                        fill="currentColor"
                    />
                    <span className="absolute -top-2 -right-2 bg-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow border border-gray-200 z-10">
                      {lot.available}
                    </span>
                  </div>
                </Marker>
              );
            })}
          </Map>

          <div className="absolute top-4 left-4 right-4 z-10 flex items-start gap-3">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg flex-1 min-w-0 overflow-hidden flex items-center p-1">
              <SearchBox
                  accessToken={MAPBOX_TOKEN}
                  map={mapRef.current?.getMap()}
                  popoverOptions={{ placement: 'bottom-start' }}
                  placeholder="Caută o locație pentru a găsi parcări..."
                  value={searchQuery}
                  onChange={(val) => {
                    setSearchQuery(val);
                    if (!val.trim()) setSearchCenter(null);
                  }}
                  onRetrieve={(result: any) => {
                    const coords = result.features?.[0]?.geometry?.coordinates;
                    if (coords) {
                      setSearchCenter({ lat: coords[1], lng: coords[0] });
                      setSearchRadius(1);
                    }
                  }}
                  theme={{
                    variables: {
                      fontFamily: 'inherit',
                      unit: '16px',
                      boxShadow: 'none',
                      border: 'none',
                    }
                  }}
              />
            </div>

            {/* Car Selection Widget */}
            <div className="relative flex-shrink-0">
              <button
                  onClick={() => setShowCarSelector(!showCarSelector)}
                  className="bg-white rounded-lg shadow-lg p-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left hidden sm:block">
                  {selectedCarInfo ? (
                      <p className="font-semibold text-sm whitespace-nowrap">{selectedCarInfo.licensePlate}</p>
                  ) : (
                      <p className="text-sm text-gray-500 whitespace-nowrap">Fără vehicul</p>
                  )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                        showCarSelector ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {showCarSelector && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-64 p-2">
                    {vehicles.map((car) => (
                        <button
                            key={car.id}
                            onClick={() => {
                              setSelectedCar(car.id);
                              setShowCarSelector(false);
                            }}
                            className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                                selectedCar === car.id ? 'bg-blue-50' : ''
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    selectedCar === car.id ? 'bg-blue-200' : 'bg-gray-100'
                                }`}
                            >
                              <Car
                                  className={`w-4 h-4 ${
                                      selectedCar === car.id ? 'text-blue-600' : 'text-gray-600'
                                  }`}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{car.licensePlate}</p>
                              <p className="text-xs text-gray-600">Categorie {car.vehicleCategory}{car.electric ? ' • EV' : ''}</p>
                            </div>
                          </div>
                        </button>
                    ))}

                    {vehicles.length === 0 && (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500 mb-2">Niciun vehicul adăugat</p>
                          <button
                              onClick={() => navigate('/profile')}
                              className="text-sm text-blue-600 hover:underline"
                          >
                            Adaugă un vehicul
                          </button>
                        </div>
                    )}
                  </div>
              )}
            </div>
          </div>

          {/* Radius filter pill — shown after a location is selected */}
          {searchCenter && (
            <div className="absolute top-[4.5rem] left-4 z-10 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Rază:</span>
              {[0.5, 1, 2, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setSearchRadius(r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    searchRadius === r
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {r}km
                </button>
              ))}
              <span className="text-xs text-gray-400 ml-1">
                {filteredLots.length} {filteredLots.length !== 1 ? 'parcări' : 'parcare'}
              </span>
              <button
                onClick={() => { setSearchCenter(null); setSearchQuery(''); }}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Șterge filtrul de locație"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-500" fill="currentColor" />
                <span className="text-sm">Disponibil</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-yellow-500" fill="currentColor" />
                <span className="text-sm">Se aglomerează</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" fill="currentColor" />
                <span className="text-sm">Complet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-[40vh] lg:h-auto">

          {/* Rerouting alert banner */}
          {rerouteAlert && (
            <div className="bg-orange-50 border-b border-orange-200 p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">{rerouteAlert.message}</p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    Alternativa cea mai apropiată: <span className="font-medium">{rerouteAlert.suggestedLot.name}</span> ({rerouteAlert.suggestedLot.available} locuri)
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptReroute(rerouteAlert.suggestedLot)}
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Reredirecționează
                </button>
                <button
                  onClick={() => { setRerouteAlert(null); setNavPhase('navigating'); }}
                  className="flex-1 border border-orange-300 text-orange-700 py-2 rounded-lg text-sm hover:bg-orange-50 transition-colors"
                >
                  Rămâi
                </button>
              </div>
            </div>
          )}

          {/* Active navigation panel */}
          {navPhase !== 'idle' && navigationTarget && activeRoute && (
            <div className="bg-blue-600 text-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  <span className="font-semibold text-sm">Navigare</span>
                </div>
                <button
                  onClick={stopNavigation}
                  className="w-7 h-7 bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm font-medium mb-1 truncate">{navigationTarget.name}</p>
              <div className="flex gap-4 text-xs text-blue-100">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.round(activeRoute.durationS / 60)} min
                </span>
                <span>{(activeRoute.distanceM / 1000).toFixed(1)} km</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {navigationTarget.available} locuri rămase
                </span>
              </div>
              {activeRoute.steps[0] && (
                <div className="mt-3 bg-blue-700 rounded-lg p-2 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs leading-tight">{activeRoute.steps[0].maneuver.instruction}</p>
                </div>
              )}
              {navPhase === 'navigating' && (
                <button
                  onClick={() => {
                    const alt = lots
                      .filter(l => l.id !== navigationTarget.id && l.available > 0)
                      .sort((a, b) =>
                        calculateDistance(navigationTarget.latitude, navigationTarget.longitude, a.latitude, a.longitude) -
                        calculateDistance(navigationTarget.latitude, navigationTarget.longitude, b.latitude, b.longitude)
                      )[0];
                    if (alt) {
                      setNavPhase('rerouting');
                      setRerouteAlert({
                        message: `${navigationTarget.name} se umple — doar ${navigationTarget.available} ${navigationTarget.available !== 1 ? 'locuri rămase' : 'loc rămas'}!`,
                        suggestedLot: alt,
                      });
                    }
                  }}
                  className="mt-2 text-xs text-blue-300 hover:text-white underline w-full text-center transition-colors"
                >
                  Simulează parcare aglomerată →
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Se încarcă zonele de parcare...</div>
            ) : selectedLot ? (
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="font-bold">{selectedLot.name}</h2>
                      <span
                          className={`px-2 py-1 rounded text-xs ${
                              selectedLot.status === 'full' ? 'bg-red-100 text-red-700' :
                                  selectedLot.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                          }`}
                      >
                        {selectedLot.status === 'full' ? 'Complet' :
                            selectedLot.status === 'busy' ? 'Se aglomerează' :
                                'Disponibil'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{selectedLot.address}</p>
                  </div>

                  {/* Occupancy bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Ocupare</span>
                      <span>{selectedLot.available}/{selectedLot.total} locuri</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          selectedLot.status === 'full' ? 'bg-red-500' :
                          selectedLot.status === 'busy' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${selectedLot.total > 0 ? ((selectedLot.total - selectedLot.available) / selectedLot.total) * 100 : 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Preț pe oră</span>
                      <span className="font-semibold">€{selectedLot.hourlyRate}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Distanță</span>
                      <span className="font-semibold">
                        {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            selectedLot.latitude,
                            selectedLot.longitude
                        ).toFixed(1)} km
                      </span>
                    </div>
                  </div>

                  {selectedLot.status === 'full' || selectedLot.available === 0 ? (
                      <div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-red-800 font-medium">Această parcare este plină.</p>
                              <p className="text-sm text-red-600 mt-1">Navighează la cea mai apropiată parcare disponibilă.</p>
                            </div>
                          </div>
                        </div>
                        <button
                            onClick={() => {
                              const nearest = findNearestAvailable(selectedLot);
                              if (nearest) startNavigation(nearest);
                              else alert('Nicio parcare disponibilă în apropiere.');
                            }}
                            disabled={routeLoading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <Navigation className="w-4 h-4" />
                          {routeLoading ? 'Se calculează ruta...' : 'Navighează la cel mai apropiat'}
                        </button>
                      </div>
                  ) : (
                      <div className="flex flex-col gap-2">
                        {selectedLot.status === 'busy' && (() => {
                          const nearest = findNearestAvailable(selectedLot);
                          return nearest ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-2">
                              <div className="flex items-start gap-2 mb-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-yellow-800">Această parcare se aglomerează.</p>
                                  <p className="text-xs text-yellow-600 mt-0.5">
                                    Cea mai apropiată disponibilă: <span className="font-medium">{nearest.name}</span> — {nearest.available} locuri, {calculateDistance(selectedLot.latitude, selectedLot.longitude, nearest.latitude, nearest.longitude).toFixed(1)} km distanță
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => startNavigation(nearest)}
                                disabled={routeLoading}
                                className="w-full bg-yellow-600 text-white py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                {routeLoading ? 'Se calculează ruta...' : `Navighează spre ${nearest.name}`}
                              </button>
                            </div>
                          ) : null;
                        })()}
                        {navPhase === 'idle' ? (
                          <button
                              onClick={() => startNavigation(selectedLot)}
                              disabled={routeLoading}
                              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            <Navigation className="w-4 h-4" />
                            {routeLoading ? 'Se calculează ruta...' : 'Navighează'}
                          </button>
                        ) : (
                          <button
                              onClick={() => startNavigation(selectedLot)}
                              disabled={routeLoading}
                              className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {routeLoading ? 'Se recalculează...' : 'Reredirecționează'}
                          </button>
                        )}
                        <button
                            onClick={() => navigate(`/payment/${selectedLot.id}`)}
                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Cumpără tichet de parcare
                        </button>
                      </div>
                  )}

                  <button
                      onClick={() => setSelectedLot(null)}
                      className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Închide
                  </button>
                </div>
            ) : (
                <div className="p-6">
                  <h2 className="font-bold mb-4">Parcări în Cluj-Napoca</h2>
                  {filteredLots.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">Nicio zonă de parcare găsită</div>
                  ) : (
                  <div className="space-y-3">
                    {filteredLots.map((lot) => (
                        <button
                            key={lot.id}
                            onClick={() => {
                              setSelectedLot(lot);
                              if (mapRef.current) {
                                mapRef.current.flyTo({ center: [lot.longitude, lot.latitude], zoom: 16, duration: 1500 });
                              }
                            }}
                            className={`w-full text-left p-4 border rounded-lg hover:shadow-md transition-all ${
                              navigationTarget?.id === lot.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-500'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm">{lot.name}</h3>
                            <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                    lot.status === 'full' ? 'bg-red-100 text-red-700' :
                                        lot.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                }`}
                            >
                              {lot.available} locuri
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{lot.address}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">€{lot.hourlyRate}/hr</span>
                            <span className="text-gray-500">
                              {calculateDistance(
                                  userLocation.lat,
                                  userLocation.lng,
                                  lot.latitude,
                                  lot.longitude
                              ).toFixed(1)} km
                            </span>
                          </div>
                        </button>
                    ))}
                  </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
