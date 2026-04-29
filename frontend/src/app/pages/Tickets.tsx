import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getActiveTickets,
  getUserTickets,
  getUserPayments,
  endTicket,
  extendTicket,
  type TicketResponse,
  type PaymentResponse,
} from '../lib/ticketService';
import { Clock, Car, Ticket as TicketIcon, Calendar, CreditCard } from 'lucide-react';

export function Tickets() {
  const { user } = useAuth();
  const [activeTickets, setActiveTickets] = useState<TicketResponse[]>([]);
  const [completedTickets, setCompletedTickets] = useState<TicketResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [active, all, pays] = await Promise.all([
        getActiveTickets(user.id),
        getUserTickets(user.id),
        getUserPayments(user.id),
      ]);
      setActiveTickets(active);
      setCompletedTickets(all.filter(t => t.status === 'COMPLETED'));
      setPayments(pays);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Tick every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const getRemainingTime = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return 'Expirat';
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
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const handleEnd = async (ticketId: string) => {
    try {
      await endTicket(ticketId);
      fetchData();
    } catch (err) {
      console.error('Failed to end ticket', err);
    }
  };

  const handleExtend = async (ticketId: string, minutes: number) => {
    try {
      await extendTicket(ticketId, minutes);
      setExtendingId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to extend ticket', err);
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">Se încarcă tichetele...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold mb-2">Tichetele mele de parcare</h1>
        <p className="text-gray-600">Vezi tichetele active și istoricul plăților</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="font-semibold mb-4">Tichete active</h2>
          {activeTickets.length > 0 ? (
            <div className="space-y-4">
              {activeTickets.map((ticket) => {
                const remainingTime = getRemainingTime(ticket.endTime);
                const progress = getProgressPercentage(ticket.startTime, ticket.endTime);
                const isExpiringSoon = new Date(ticket.endTime).getTime() - Date.now() < 15 * 60 * 1000;

                return (
                  <div
                    key={ticket.id}
                    className={`bg-white rounded-lg border-2 p-6 ${
                      isExpiringSoon ? 'border-orange-300' : 'border-green-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isExpiringSoon ? 'bg-orange-100' : 'bg-green-100'
                        }`}>
                          <TicketIcon className={`w-6 h-6 ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{ticket.parkingAreaName}</h3>
                          <p className="text-sm text-gray-600">{ticket.parkingAreaAddress}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{ticket.vehicleLicensePlate} • Slot {ticket.slotIdentifier}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isExpiringSoon ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'
                      }`}>Activ</span>
                    </div>

                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-5 h-5 ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`} />
                          <span className="font-semibold">Timp rămas:</span>
                        </div>
                        <span className={`font-mono font-bold text-lg ${isExpiringSoon ? 'text-orange-700' : 'text-green-700'}`}>
                          {remainingTime}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${isExpiringSoon ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <span className="text-sm text-gray-600">Început la</span>
                        <p className="font-medium">{new Date(ticket.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Expiră la</span>
                        <p className="font-medium">{new Date(ticket.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Durată</span>
                        <p className="font-medium">{Math.round(ticket.durationMinutes / 60 * 10) / 10}h</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total plătit</span>
                        <p className="font-medium">${Number(ticket.totalCost).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {extendingId === ticket.id ? (
                        <div className="flex gap-2 w-full">
                          {[30, 60, 120].map(mins => (
                            <button
                              key={mins}
                              onClick={() => handleExtend(ticket.id, mins)}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              +{mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                            </button>
                          ))}
                          <button
                            onClick={() => setExtendingId(null)}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                          >
                            Anulează
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setExtendingId(ticket.id)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Extinde timpul de parcare
                          </button>
                          <button
                            onClick={() => handleEnd(ticket.id)}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Încheie sesiunea
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Niciun tichet de parcare activ</p>
              <a href="/" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Cumpără tichet de parcare
              </a>
            </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Statistici rapide</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tichete active</p>
                <p className="font-bold text-green-600">{activeTickets.length}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total tichete</p>
                <p className="font-bold">{activeTickets.length + completedTickets.length}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total cheltuit</p>
                <p className="font-bold">
                  ${payments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-8">
        <h2 className="font-semibold mb-4">Istoric plăți</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Dată</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tranzacție</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Plată</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sumă</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{new Date(payment.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-gray-600">{payment.transactionId.slice(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <p className="text-sm">{payment.paymentMethod}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold">${Number(payment.amount).toFixed(2)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length === 0 && (
            <div className="p-8 text-center text-gray-500">Niciun istoric de plăți</div>
          )}
        </div>
      </div>
    </div>
  );
}
