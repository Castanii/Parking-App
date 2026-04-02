import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { parkingLots, userCars } from '../data/mockData';
import { ParkingLot } from '../types';
import { Navigation, MapPin, Search, AlertCircle, Car, ChevronDown, LocateFixed } from 'lucide-react';

// --- NEW MAPBOX IMPORTS ---
import Map, { Marker, MapRef } from 'react-map-gl';
import { SearchBox } from '@mapbox/search-js-react';
import 'mapbox-gl/dist/mapbox-gl.css'; // CRITICAL: This makes the map look right!

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

export function MapView() {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null); // This allows us to fly the map around

  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [userLocation] = useState({ lat: 46.7556635, lng: 23.57446 });
  //const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCar, setSelectedCar] = useState(userCars[0]?.id || '');
  const [showCarSelector, setShowCarSelector] = useState(false);

  const selectedCarInfo = userCars.find(c => c.id === selectedCar);
/*
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;

          // Update the blue dot's position
          setUserLocation({ lat: newLat, lng: newLng });

          // Fly the map to the user
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [newLng, newLat],
              zoom: 15,
              duration: 2000
            });
          }
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert('Unable to retrieve your location. Please check your browser permissions.');
          setIsLocating(false);
        },
        // High accuracy option for better mobile tracking
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };
*/
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

  const findNearestAvailable = (currentLot: ParkingLot) => {
    const availableLots = parkingLots.filter(
        lot => lot.id !== currentLot.id && lot.status === 'available' && lot.available > 0
    );
    if (availableLots.length === 0) return null;
    return availableLots.reduce((nearest, lot) => {
      const distanceToCurrent = calculateDistance(currentLot.lat, currentLot.lng, lot.lat, lot.lng);
      const distanceToNearest = calculateDistance(currentLot.lat, currentLot.lng, nearest.lat, nearest.lng);
      return distanceToCurrent < distanceToNearest ? lot : nearest;
    });
  };

  const handleReserve = (lot: ParkingLot) => {
    if (lot.status === 'full' || lot.available === 0) {
      const nearest = findNearestAvailable(lot);
      if (nearest) {
        setSelectedLot(nearest);
        alert(`This lot is full. Redirecting you to the nearest available parking: ${nearest.name}`);
        // Mapbox specific pan/zoom
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [nearest.lng, nearest.lat], zoom: 16, duration: 1500 });
        }
      } else {
        alert('No available parking lots nearby.');
      }
    } else {
      navigate(`/payment/${lot.id}`);
    }
  };

  const filteredLots = parkingLots.filter(lot =>
      lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <div className="min-h-[calc(100vh-73px)] flex flex-col lg:flex-row">
        {/* Map Section */}
        <div className="flex-1 relative bg-gray-100">

          {/* Real Mapbox Map */}
          <Map
              ref={mapRef}
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{
                longitude: userLocation.lng,
                latitude: userLocation.lat,
                zoom: 14
              }}
              mapStyle="mapbox://styles/mapbox/streets-v12" // Change to "light-v11" or "dark-v11" for different themes!
              style={{ width: '100%', height: '100%', position: 'absolute' }}
          >
            {/* User Marker */}
            <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
              <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg" />
            </Marker>

            {/* Parking Lot Markers */}
            {filteredLots.map((lot) => (
                <Marker
                    key={lot.id}
                    longitude={lot.lng}
                    latitude={lot.lat}
                    onClick={(e) => {
                      // Prevent map click events from firing
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

          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="bg-white rounded-lg shadow-lg max-w-md overflow-hidden flex items-center p-1">
              {/* Mapbox Search component automatically handles typing, fetching, and dropdown UI */}
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
          </div>
          {/* Search Bar - Replaced with Mapbox SearchBox */}

          {/* Car Selection Widget (Unchanged) */}
          <div className="absolute top-20 left-4 right-4 z-10">
            <div className="bg-white rounded-lg shadow-lg max-w-md">
              <button
                  onClick={() => setShowCarSelector(!showCarSelector)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Selected Vehicle</p>
                    {selectedCarInfo ? (
                        <>
                          <p className="font-semibold text-sm">
                            {selectedCarInfo.make} {selectedCarInfo.model}
                          </p>
                          <p className="text-xs text-gray-600">{selectedCarInfo.licensePlate}</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">No vehicle selected</p>
                    )}
                  </div>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                        showCarSelector ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Car Selector Dropdown */}
              {showCarSelector && (
                  <div className="border-t border-gray-200 p-2">
                    {userCars.map((car) => (
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
                              <p className="font-medium text-sm">
                                {car.make} {car.model}
                              </p>
                              <p className="text-xs text-gray-600">{car.licensePlate}</p>
                            </div>
                          </div>
                        </button>
                    ))}

                    {userCars.length === 0 && (
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

        {/* Locate Me Button */}
        {/*<button*/}
        {/*    onClick={handleLocateMe}*/}
        {/*    disabled={isLocating}*/}
        {/*    className="absolute bottom-24 left-4 z-10 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-75"*/}
        {/*    title="Find my location"*/}
        {/*>*/}
        {/*  <LocateFixed className={`w-6 h-6 text-blue-600 ${isLocating ? 'animate-pulse' : ''}`} />*/}
        {/*</button>*/}

        {/* Details Panel */}
        <div className="w-full lg:w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {selectedLot ? (
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
                    <span className="font-semibold">${selectedLot.pricePerHour}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Distance</span>
                    <span className="font-semibold">
                  {calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      selectedLot.lat,
                      selectedLot.lng
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
                <div className="space-y-3">
                  {filteredLots.map((lot) => (
                      <button
                          key={lot.id}
                          onClick={() => {
                            setSelectedLot(lot);
                            if (mapRef.current) {
                              // Mapbox uses a smooth animation with flyTo
                              mapRef.current.flyTo({ center: [lot.lng, lot.lat], zoom: 16, duration: 1500 });
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
                      ${lot.pricePerHour}/hr
                    </span>
                          <span className="text-gray-500">
                      {calculateDistance(
                          userLocation.lat,
                          userLocation.lng,
                          lot.lat,
                          lot.lng
                      ).toFixed(1)} km
                    </span>
                        </div>
                      </button>
                  ))}
                </div>
              </div>
          )}
        </div>
      </div>
  );
}