import { useState, useEffect } from 'react';
import { userTickets } from '../data/mockData';
import { ParkingTicket } from '../types';
import { Clock, MapPin, Car, Ticket as TicketIcon, Calendar, CreditCard } from 'lucide-react';

export function Tickets() {
  const [tickets, setTickets] = useState<ParkingTicket[]>(userTickets);

  // Update ticket status based on time
  useEffect(() => {
    const interval = setInterval(() => {
      setTickets(prev =>
        prev.map(ticket => {
          if (ticket.endTime < new Date() && ticket.status === 'active') {
            return { ...ticket, status: 'completed' as const };
          }
          return ticket;
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

  const activeTickets = tickets.filter(t => t.status === 'active');
  const completedTickets = tickets
    .filter(t => t.status === 'completed')
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold mb-2">My Parking Tickets</h1>
        <p className="text-gray-600">View your ongoing tickets and payment history</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Ongoing Tickets */}
        <div className="md:col-span-2">
          <h2 className="font-semibold mb-4">Ongoing Tickets</h2>
          {activeTickets.length > 0 ? (
            <div className="space-y-4">
              {activeTickets.map((ticket) => {
                const remainingTime = getRemainingTime(ticket.endTime);
                const progress = getProgressPercentage(ticket.startTime, ticket.endTime);
                const isExpiringSoon = ticket.endTime.getTime() - new Date().getTime() < 15 * 60 * 1000;

                return (
                  <div
                    key={ticket.id}
                    className={`bg-white rounded-lg border-2 p-6 ${
                      isExpiringSoon ? 'border-orange-300' : 'border-green-300'
                    }`}
                  >
                    {/* Ticket Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isExpiringSoon ? 'bg-orange-100' : 'bg-green-100'
                        }`}>
                          <TicketIcon className={`w-6 h-6 ${
                            isExpiringSoon ? 'text-orange-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{ticket.lotName}</h3>
                          <p className="text-sm text-gray-600">{ticket.lotAddress}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{ticket.carInfo}</span>
                          </div>
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
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-5 h-5 ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`} />
                          <span className="font-semibold">Time Remaining:</span>
                        </div>
                        <span className={`font-mono font-bold text-lg ${isExpiringSoon ? 'text-orange-700' : 'text-green-700'}`}>
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

                    {/* Ticket Details */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <span className="text-sm text-gray-600">Started</span>
                        <p className="font-medium">
                          {ticket.startTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Expires</span>
                        <p className="font-medium">
                          {ticket.endTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Duration</span>
                        <p className="font-medium">{ticket.duration} hours</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Paid</span>
                        <p className="font-medium">${ticket.totalPrice}</p>
                      </div>
                    </div>

                    {/* Extend Button */}
                    <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Extend Parking Time
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No ongoing parking tickets</p>
              <a
                href="/"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buy Parking Ticket
              </a>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Tickets</p>
                <p className="font-bold text-green-600">{activeTickets.length}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
                <p className="font-bold">{tickets.length}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="font-bold">
                  $
                  {tickets
                    .filter(
                      t =>
                        t.startTime.getMonth() === new Date().getMonth() &&
                        t.startTime.getFullYear() === new Date().getFullYear()
                    )
                    .reduce((sum, t) => sum + t.totalPrice, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-8">
        <h2 className="font-semibold mb-4">Payment History</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vehicle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">
                            {ticket.startTime.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ticket.startTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{ticket.lotName}</p>
                        <p className="text-xs text-gray-500">{ticket.lotAddress}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{ticket.carInfo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{ticket.duration}h</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <p className="text-sm">{ticket.paymentMethod}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold">${ticket.totalPrice.toFixed(2)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {completedTickets.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No payment history yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
