import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getParkingArea, getAvailableSlots, type ParkingAreaResponse } from '../lib/parkingService';
import { getVehicles, type VehicleResponse } from '../lib/vehicleService';
import { buyTicket, getActiveTickets, type TicketResponse } from '../lib/ticketService';
import { useParkingWebSocket } from '../lib/parkingWebSocket';
import { AlertTriangle, Car, CreditCard, MapPin, Check } from 'lucide-react';

export function Payment() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lot, setLot] = useState<ParkingAreaResponse | null>(null);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [activeTickets, setActiveTickets] = useState<TicketResponse[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [selectedCar, setSelectedCar] = useState('');
  const [hours, setHours] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'WALLET'>('CARD');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !lotId) return;
    Promise.all([
      getParkingArea(lotId),
      getVehicles(user.id),
      getAvailableSlots(lotId),
      getActiveTickets(user.id),
    ]).then(([areaData, vehicleData, slots, tickets]) => {
      setLot(areaData);
      setVehicles(vehicleData);
      setAvailableCount(slots.length);
      setActiveTickets(tickets);
      if (vehicleData.length > 0) setSelectedCar(vehicleData[0].id);
    }).catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, [user, lotId]);

  useParkingWebSocket((update) => {
    if (update.parkingAreaId === lotId) {
      setAvailableCount(update.availableSlots);
    }
  });

  const activeVehicleIds = new Set(activeTickets.map(t => t.vehicleId));
  const selectedCarHasActiveTicket = !!selectedCar && activeVehicleIds.has(selectedCar);

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">Loading...</div>;
  }

  if (!lot) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">Parking lot not found</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = lot.hourlyRate * hours;
  const selectedCarInfo = vehicles.find(c => c.id === selectedCar);

  const handlePayment = async () => {
    if (!selectedCar) return;
    setProcessing(true);
    setError('');
    try {
      await buyTicket({
        parkingAreaId: lot.id,
        vehicleId: selectedCar,
        durationMinutes: hours * 60,
        paymentMethod,
      });
      navigate('/tickets');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline mb-2">
          &larr; Back to Map
        </button>
        <h1 className="font-bold mb-2">Buy Parking Ticket</h1>
        <p className="text-gray-600">Select duration and complete payment</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Parking Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Parking Details</h2>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">{lot.name}</h3>
            <p className="text-sm text-gray-600">{lot.address}</p>
            <p className="text-sm text-gray-600 mt-1">${lot.hourlyRate}/hour</p>
            <p className="text-sm text-green-600 mt-1">{availableCount} spots available</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm mb-2">Parking Duration</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setHours(Math.max(1, hours - 1))}
              className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >-</button>
            <div className="flex-1 text-center">
              <p className="font-bold">{hours}</p>
              <p className="text-sm text-gray-600">hours</p>
            </div>
            <button
              onClick={() => setHours(hours + 1)}
              className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >+</button>
          </div>
        </div>
      </div>

      {/* Select Vehicle */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Select Vehicle</h2>
        {vehicles.length === 0 ? (
          <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <Car className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">No vehicles added yet</p>
            <p className="text-sm text-gray-500 mb-4">You need at least one vehicle to buy a parking ticket.</p>
            <button
              onClick={() => navigate(lotId ? `/profile?returnTo=/payment/${lotId}` : '/profile')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Car className="w-4 h-4" />
              Add a Vehicle
            </button>
            <p className="text-xs text-gray-400 mt-3">You'll be brought back here after adding.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((car) => (
              <button
                key={car.id}
                onClick={() => setSelectedCar(car.id)}
                className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                  selectedCar === car.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedCar === car.id ? 'bg-blue-200' : 'bg-gray-100'
                    }`}>
                      <Car className={`w-5 h-5 ${selectedCar === car.id ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{car.licensePlate}</p>
                      <p className="text-sm text-gray-600">Category {car.vehicleCategory}{car.electric ? ' • Electric' : ''}</p>
                      {activeVehicleIds.has(car.id) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Active session
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedCar === car.id && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Payment Method</h2>
        <div className="space-y-3">
          <button
            onClick={() => setPaymentMethod('CARD')}
            className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
              paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className={`w-5 h-5 ${paymentMethod === 'CARD' ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className="font-medium">Credit/Debit Card</span>
              </div>
              {paymentMethod === 'CARD' && <Check className="w-5 h-5 text-blue-600" />}
            </div>
          </button>
          <button
            onClick={() => setPaymentMethod('WALLET')}
            className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
              paymentMethod === 'WALLET' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                  paymentMethod === 'WALLET' ? 'border-blue-600' : 'border-gray-600'
                }`}>
                  <span className={`text-xs ${paymentMethod === 'WALLET' ? 'text-blue-600' : 'text-gray-600'}`}>$</span>
                </div>
                <span className="font-medium">Digital Wallet</span>
              </div>
              {paymentMethod === 'WALLET' && <Check className="w-5 h-5 text-blue-600" />}
            </div>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Summary</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Duration</span>
            <span className="font-medium">{hours} hours</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Rate</span>
            <span className="font-medium">${lot.hourlyRate}/hour</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Vehicle</span>
            <span className="font-medium">{selectedCarInfo?.licensePlate || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-3 bg-blue-50 rounded-lg px-3 mt-2">
            <span className="font-semibold">Total Amount</span>
            <span className="font-bold text-blue-600">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {selectedCarHasActiveTicket && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Active session detected</p>
            <p className="text-sm text-amber-700 mt-0.5">This vehicle already has an active parking session. Please end it on the Tickets page before buying a new ticket.</p>
          </div>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={processing || !selectedCar || selectedCarHasActiveTicket}
        className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {processing ? 'Processing...' : `Pay $${totalPrice.toFixed(2)} and Get Ticket`}
      </button>
    </div>
  );
}
