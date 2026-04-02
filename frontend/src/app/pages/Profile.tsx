import { useState } from 'react';
import { userCars } from '../data/mockData';
import { Car } from '../types';
import { Car as CarIcon, Plus, Edit2, Trash2 } from 'lucide-react';

export function Profile() {
  const [cars, setCars] = useState<Car[]>(userCars);
  const [showAddCar, setShowAddCar] = useState(false);
  const [newCar, setNewCar] = useState<Partial<Car>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    color: '',
  });

  const handleAddCar = () => {
    if (newCar.make && newCar.model && newCar.licensePlate) {
      const car: Car = {
        id: String(cars.length + 1),
        make: newCar.make,
        model: newCar.model || '',
        year: newCar.year || new Date().getFullYear(),
        licensePlate: newCar.licensePlate,
        color: newCar.color || '',
      };
      setCars([...cars, car]);
      setNewCar({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        color: '',
      });
      setShowAddCar(false);
    }
  };

  const handleDeleteCar = (id: string) => {
    setCars(cars.filter(car => car.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your vehicles and account settings</p>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <p className="font-medium">John Doe</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium">john.doe@email.com</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Phone</label>
            <p className="font-medium">+1 (555) 123-4567</p>
          </div>
        </div>
      </div>

      {/* My Cars */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">My Vehicles</h2>
          <button
            onClick={() => setShowAddCar(!showAddCar)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        </div>

        {showAddCar && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium mb-4">Add New Vehicle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm mb-1">Make *</label>
                <input
                  type="text"
                  value={newCar.make}
                  onChange={(e) => setNewCar({ ...newCar, make: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tesla"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Model *</label>
                <input
                  type="text"
                  value={newCar.model}
                  onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Model 3"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Year</label>
                <input
                  type="number"
                  value={newCar.year}
                  onChange={(e) => setNewCar({ ...newCar, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2023"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">License Plate *</label>
                <input
                  type="text"
                  value={newCar.licensePlate}
                  onChange={(e) => setNewCar({ ...newCar, licensePlate: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC-1234"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Color</label>
                <input
                  type="text"
                  value={newCar.color}
                  onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="White"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Vehicle
              </button>
              <button
                onClick={() => setShowAddCar(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {cars.map((car) => (
            <div
              key={car.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {car.make} {car.model}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {car.year} • {car.color}
                    </p>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                      {car.licensePlate}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCar(car.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
