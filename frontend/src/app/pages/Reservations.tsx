import { useState, useEffect } from 'react';
import { userReservations } from '../data/mockData';
import { Reservation } from '../types';
import { Clock, MapPin, Car, CheckCircle, XCircle } from 'lucide-react';

export function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>(userReservations);

  // Update reservation status based on time
  useEffect(() => {
    const interval = setInterval(() => {
      setReservations(prev =>
        prev.map(reservation => {
          if (reservation.endTime < new Date() && reservation.status === 'active') {
            return { ...reservation, status: 'expired' as const };
          }
          return reservation;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getRemainingTime = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getProgressPercentage = (startTime: Date, endTime: Date) => {
    const now = new Date();
    const total = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const activeReservations = reservations.filter(r => r.status === 'active');
  const pastReservations = reservations.filter(r => r.status !== 'active');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold mb-2">My Reservations</h1>
        <p className="text-gray-600">Manage your active and past parking reservations</p>
      </div>

      {/* Active Reservations */}
      {activeReservations.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-4">Active Reservations</h2>
          <div className="space-y-4">
            {activeReservations.map((reservation) => {
              const remainingTime = getRemainingTime(reservation.endTime);
              const progress = getProgressPercentage(reservation.startTime, reservation.endTime);
              const isExpiringSoon = reservation.endTime.getTime() - new Date().getTime() < 15 * 60 * 1000;

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
                        <h3 className="font-semibold">{reservation.lotName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Car className="w-4 h-4" />
                        <span>{reservation.carInfo}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isExpiringSoon
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-green-200 text-green-800'
                      }`}
                    >
                      Active
                    </span>
                  </div>

                  {/* Time Remaining */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-5 h-5 ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`} />
                        <span className="font-semibold">Time Remaining:</span>
                      </div>
                      <span className={`font-mono font-bold ${isExpiringSoon ? 'text-orange-700' : 'text-green-700'}`}>
                        {remainingTime}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          isExpiringSoon ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Time Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <span className="text-sm text-gray-600">Start Time</span>
                      <p className="font-medium">
                        {reservation.startTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">End Time</span>
                      <p className="font-medium">
                        {reservation.endTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Extend Button */}
                  <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Extend Reservation
                  </button>
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
                      <h3 className="font-semibold">{reservation.lotName}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Car className="w-4 h-4" />
                      <span>{reservation.carInfo}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {reservation.startTime.toLocaleDateString()} •{' '}
                      {reservation.startTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {reservation.endTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-2">
                      {reservation.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600 capitalize">
                        {reservation.status}
                      </span>
                    </div>
                    <p className="font-semibold">${reservation.price}</p>
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
    </div>
  );
}
