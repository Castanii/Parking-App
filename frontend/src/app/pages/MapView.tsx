import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getAllParkingAreas, getAvailableSlots, type ParkingAreaResponse } from '../lib/parkingService';
import { getVehicles, type VehicleResponse } from '../lib/vehicleService';
import { Navigation, MapPin, AlertCircle, Car, ChevronDown } from 'lucide-react';

import Map, { Marker, MapRef } from 'react-map-gl';
import { SearchBox } from '@mapbox/search-js-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface ParkingAreaWithSlots extends ParkingAreaResponse {
  available: number;
  total: number;
  status: 'available' | 'full' | 'reserved';
}

export function MapView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<MapRef>(null);

  const [lots, setLots] = useState<ParkingAreaWithSlots[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [selectedLot, setSelectedLot] = useState<ParkingAreaWithSlots | null>(null);
  const [userLocation] = useState({ lat: 46.7556635, lng: 23.57446 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCar, setSelectedCar] = useState('');
  const [showCarSelector, setShowCarSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [areas, userVehicles] = await Promise.all([
        getAllParkingAreas(),
        getVehicles(user.id),
      ]);

      // For each area, fetch available slots to determine availability
      const areasWithSlots = await Promise.all(
        areas.map(async (area) => {
          try {
            const availableSlots = await getAvailableSlots(area.id);
            const available = availableSlots.length;
            return {
              ...area,
              available,
              total: area.capacity,
              status: (available === 0 ? 'full' : 'available') as 'available' | 'full' | 'reserved',
            };
          } catch {
            return {
              ...area,
              available: 0,
              total: area.capacity,
              status: 'full' as const,
            };
          }
        })
      );

      setLots(areasWithSlots);
      setVehicles(userVehicles);
      if (userVehicles.length > 0) setSelectedCar(userVehicles[0].id);
    } catch (err) {
      console.error('Failed to load parking data', err);
    } finally {
      setLoading(false);
    }
  };

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
      const distanceToCurrent = calculateDistance(currentLot.latitude, currentLot.longitude, lot.latitude, lot.longitude);
      const distanceToNearest = calculateDistance(currentLot.latitude, currentLot.longitude, nearest.latitude, nearest.longitude);
      return distanceToCurrent < distanceToNearest ? lot : nearest;
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
        alert('No available parking lots nearby.');
      }
    } else {
      navigate(`/payment/${lot.id}`);
    }
  };

  const filteredLots = lots.filter(lot =>
      lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <div className="min-h-[calc(100vh-73px)] flex flex-col lg:flex-row">
        {/* Map Section */}
        <div className="flex-1 relative bg-gray-100">
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
            <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
              <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg" />
            </Marker>

            {filteredLots.map((lot) => (
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
                    <MapPin
                        className={`w-8 h-8 ${
                            lot.status === 'full' ? 'text-red-500' :
                                lot.status === 'reserved' ? 'text-yellow-500' :
                                    'text-green-500'
                        } drop-shadow-lg`}
                        fill="currentColor"
                    />
                  </div>
                </Marker>
            ))}
          </Map>

          <div className="absolute top-4 left-4 right-4 z-10 flex items-start gap-3">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg flex-1 min-w-0 overflow-hidden flex items-center p-1">
              <SearchBox
                  accessToken={MAPBOX_TOKEN}
                  map={mapRef.current?.getMap()}
                  popoverOptions={{ placement: 'bottom-start' }}
                  placeholder="Search places or addresses..."
                  value={searchQuery}
                  onChange={(searchStr) => setSearchQuery(searchStr)}
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
                      <p className="text-sm text-gray-500 whitespace-nowrap">No vehicle</p>
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
                              <p className="text-xs text-gray-600">Category {car.vehicleCategory}{car.electric ? ' • EV' : ''}</p>
                            </div>
                          </div>
                        </button>
                    ))}

                    {vehicles.length === 0 && (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500 mb-2">No vehicles added</p>
                          <button
                              onClick={() => navigate('/profile')}
                              className="text-sm text-blue-600 hover:underline"
                          >
                            Add a vehicle
                          </button>
                        </div>
                    )}
                  </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-500" fill="currentColor" />
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-yellow-500" fill="currentColor" />
                <span className="text-sm">Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" fill="currentColor" />
                <span className="text-sm">Full</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-full lg:w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading parking areas...</div>
          ) : selectedLot ? (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-bold">{selectedLot.name}</h2>
                    <span
                        className={`px-2 py-1 rounded text-xs ${
                            selectedLot.status === 'full' ? 'bg-red-100 text-red-700' :
                                selectedLot.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                        }`}
                    >
                  {selectedLot.status === 'full' ? 'Full' :
                      selectedLot.status === 'reserved' ? 'Reserved' :
                          'Available'}
                </span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedLot.address}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Available Spots</span>
                    <span className="font-semibold">
                  {selectedLot.available}/{selectedLot.total}
                </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Price per Hour</span>
                    <span className="font-semibold">${selectedLot.hourlyRate}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Distance</span>
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
                            <p className="text-sm text-red-800">
                              This parking lot is currently full.
                            </p>
                            <p className="text-sm text-red-600 mt-1">
                              We can redirect you to the nearest available parking.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                          onClick={() => handleReserve(selectedLot)}
                          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Find Nearest Parking
                      </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleReserve(selectedLot)}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Buy Parking Ticket
                    </button>
                )}

                <button
                    onClick={() => setSelectedLot(null)}
                    className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
          ) : (
              <div className="p-6">
                <h2 className="font-bold mb-4">All Parking Lots</h2>
                {filteredLots.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">No parking areas found</div>
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
                          className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm">{lot.name}</h3>
                          <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                  lot.status === 'full' ? 'bg-red-100 text-red-700' :
                                      lot.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-green-100 text-green-700'
                              }`}
                          >
                      {lot.available} spots
                    </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{lot.address}</p>
                        <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      ${lot.hourlyRate}/hr
                    </span>
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
  );
}
