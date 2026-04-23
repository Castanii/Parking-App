import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserReservations,
  createReservation,
  cancelReservation,
  convertReservation,
  type ReservationResponse,
} from '../lib/reservationService';
import { getAllParkingAreas, type ParkingAreaResponse } from '../lib/parkingService';
import { getVehicles, type VehicleResponse } from '../lib/vehicleService';
import { Clock, MapPin, Car, CheckCircle, XCircle, Plus, X } from 'lucide-react';

export function Reservations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [areas, setAreas] = useState<ParkingAreaResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [error, setError] = useState('');
  const [, setTick] = useState(0);

  const [form, setForm] = useState({
    parkingAreaId: '',
    vehicleId: '',
    scheduledStart: '',
    scheduledEnd: '',
  });

  const fetchReservations = async () => {
    if (!user) return;
    try {
      const data = await getUserReservations(user.id);
      setReservations(data);
    } catch {
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [user]);

  // Tick every second for countdowns
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const openNewForm = async () => {
    if (!user) return;
    try {
      const [a, v] = await Promise.all([getAllParkingAreas(), getVehicles(user.id)]);
      setAreas(a);
      setVehicles(v);
      setForm({
        parkingAreaId: a[0]?.id || '',
        vehicleId: v[0]?.id || '',
        scheduledStart: '',
        scheduledEnd: '',
      });
      setShowNewForm(true);
    } catch {
      setError('Failed to load data');
    }
  };

  const handleCreate = async () => {
    if (!form.parkingAreaId || !form.vehicleId || !form.scheduledStart || !form.scheduledEnd) return;
    setError('');
    try {
      await createReservation(form);
      setShowNewForm(false);
      fetchReservations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create reservation');
    }
  };

  const handleCancel = async (id: string) => {
    setError('');
    try {
      await cancelReservation(id);
      fetchReservations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const handleConvert = async (id: string) => {
    setError('');
    try {
      await convertReservation(id);
      navigate('/tickets');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start parking');
    }
  };

  const getRemainingTime = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const getProgressPercentage = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  const canStartNow = (scheduledStart: string) => {
    return new Date(scheduledStart).getTime() - Date.now() < 15 * 60 * 1000;
  };

  const activeReservations = reservations.filter(r => r.status === 'CONFIRMED');
  const pastReservations = reservations.filter(r => r.status !== 'CONFIRMED');

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">Loading reservations...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold mb-2">My Reservations</h1>
          <p className="text-gray-600">Manage your active and past parking reservations</p>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Reservation
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* New Reservation Form */}
      {showNewForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New Reservation</h2>
            <button onClick={() => setShowNewForm(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Parking Area</label>
              <select
                value={form.parkingAreaId}
                onChange={(e) => setForm({ ...form, parkingAreaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Vehicle</label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.licensePlate} (Cat. {v.vehicleCategory})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={form.scheduledStart}
                onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Time</label>
              <input
                type="datetime-local"
                value={form.scheduledEnd}
                onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Reservation
          </button>
        </div>
      )}

      {/* Active Reservations */}
      {activeReservations.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-4">Active Reservations</h2>
          <div className="space-y-4">
            {activeReservations.map((reservation) => {
              const isExpiringSoon = new Date(reservation.scheduledEnd).getTime() - Date.now() < 15 * 60 * 1000;
              const startingSoon = canStartNow(reservation.scheduledStart);

              return (
                <div
                  key={reservation.id}
                  className={`bg-white rounded-lg border-2 p-6 ${
                    isExpiringSoon ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <h3 className="font-semibold">{reservation.parkingAreaName}</h3>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">{reservation.parkingAreaAddress}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Car className="w-4 h-4" />
                        <span>{reservation.vehicleLicensePlate}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isExpiringSoon ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'
                      }`}
                    >
                      Confirmed
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-5 h-5 ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`} />
                        <span className="font-semibold">Time until end:</span>
                      </div>
                      <span className={`font-mono font-bold ${isExpiringSoon ? 'text-orange-700' : 'text-green-700'}`}>
                        {getRemainingTime(reservation.scheduledEnd)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${isExpiringSoon ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${getProgressPercentage(reservation.scheduledStart, reservation.scheduledEnd)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <span className="text-sm text-gray-600">Start Time</span>
                      <p className="font-medium">
                        {new Date(reservation.scheduledStart).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">End Time</span>
                      <p className="font-medium">
                        {new Date(reservation.scheduledEnd).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {startingSoon && (
                      <button
                        onClick={() => handleConvert(reservation.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Start Parking Now
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      className={`px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors ${startingSoon ? '' : 'flex-1'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Reservations */}
      <div>
        <h2 className="font-semibold mb-4">Past Reservations</h2>
        {pastReservations.length > 0 ? (
          <div className="space-y-3">
            {pastReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <h3 className="font-semibold">{reservation.parkingAreaName}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Car className="w-4 h-4" />
                      <span>{reservation.vehicleLicensePlate}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(reservation.scheduledStart).toLocaleDateString()} {' '}
                      {new Date(reservation.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(reservation.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {reservation.status === 'CONVERTED' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600 capitalize">{reservation.status.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No past reservations</p>
          </div>
        )}
      </div>

      {activeReservations.length === 0 && pastReservations.length === 0 && !showNewForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No reservations yet</p>
          <button
            onClick={openNewForm}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Reservation
          </button>
        </div>
      )}
    </div>
  );
}
