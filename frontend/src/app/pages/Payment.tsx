import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { parkingLots, userCars } from '../data/mockData';
import { Car, CreditCard, Clock, MapPin, Check } from 'lucide-react';

export function Payment() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const lot = parkingLots.find(l => l.id === lotId);
  
  const [selectedCar, setSelectedCar] = useState<string>(userCars[0]?.id || '');
  const [hours, setHours] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);

  if (!lot) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">Parking lot not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = lot.pricePerHour * hours;
  const selectedCarInfo = userCars.find(c => c.id === selectedCar);

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
    
    // Show success and redirect
    alert('Payment successful! Your parking ticket has been issued.');
    navigate('/tickets');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:underline mb-2"
        >
          ← Back to Map
        </button>
        <h1 className="font-bold mb-2">Buy Parking Ticket</h1>
        <p className="text-gray-600">Select duration and complete payment</p>
      </div>

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
            <p className="text-sm text-gray-600 mt-1">
              ${lot.pricePerHour}/hour
            </p>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm mb-2">Parking Duration</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setHours(Math.max(1, hours - 1))}
              className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <p className="font-bold">{hours}</p>
              <p className="text-sm text-gray-600">hours</p>
            </div>
            <button
              onClick={() => setHours(hours + 1)}
              className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Select Vehicle */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Select Vehicle</h2>
        <div className="space-y-3">
          {userCars.map((car) => (
            <button
              key={car.id}
              onClick={() => setSelectedCar(car.id)}
              className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                selectedCar === car.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedCar === car.id ? 'bg-blue-200' : 'bg-gray-100'
                  }`}>
                    <Car className={`w-5 h-5 ${
                      selectedCar === car.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {car.make} {car.model}
                    </p>
                    <p className="text-sm text-gray-600">{car.licensePlate}</p>
                  </div>
                </div>
                {selectedCar === car.id && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Payment Method</h2>
        <div className="space-y-3 mb-4">
          <button
            onClick={() => setPaymentMethod('card')}
            className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
              paymentMethod === 'card'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className={`w-5 h-5 ${
                  paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <span className="font-medium">Credit/Debit Card</span>
              </div>
              {paymentMethod === 'card' && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </button>
          <button
            onClick={() => setPaymentMethod('wallet')}
            className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
              paymentMethod === 'wallet'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                  paymentMethod === 'wallet' ? 'border-blue-600' : 'border-gray-600'
                }`}>
                  <span className={`text-xs ${
                    paymentMethod === 'wallet' ? 'text-blue-600' : 'text-gray-600'
                  }`}>$</span>
                </div>
                <span className="font-medium">Digital Wallet</span>
              </div>
              {paymentMethod === 'wallet' && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </button>
        </div>

        {paymentMethod === 'card' && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm mb-1">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
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
            <span className="font-medium">${lot.pricePerHour}/hour</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Vehicle</span>
            <span className="font-medium">{selectedCarInfo?.licensePlate}</span>
          </div>
          <div className="flex items-center justify-between py-3 bg-blue-50 rounded-lg px-3 mt-2">
            <span className="font-semibold">Total Amount</span>
            <span className="font-bold text-blue-600">${totalPrice}</span>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <button
        onClick={handlePayment}
        disabled={processing || !selectedCar}
        className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {processing ? 'Processing...' : `Pay $${totalPrice} and Get Ticket`}
      </button>
    </div>
  );
}