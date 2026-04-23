import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle, type VehicleResponse } from '../lib/vehicleService';
import { Car as CarIcon, Plus, Edit2, Trash2, Check, ArrowLeft } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(!!returnTo);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const emptyForm = { licensePlate: '', vehicleCategory: 'B', isElectric: false };
  const [form, setForm] = useState(emptyForm);

  const fetchVehicles = async () => {
    if (!user) return;
    try {
      const data = await getVehicles(user.id);
      setVehicles(data);
    } catch {
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !form.licensePlate) return;
    setError('');
    try {
      await addVehicle(user.id, form);
      setForm(emptyForm);
      setShowAddForm(false);
      if (returnTo) {
        navigate(returnTo);
        return;
      }
      fetchVehicles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!user || !form.licensePlate) return;
    setError('');
    try {
      await updateVehicle(id, user.id, form);
      setEditingId(null);
      setForm(emptyForm);
      fetchVehicles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update vehicle');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setError('');
    try {
      await deleteVehicle(id, user.id);
      fetchVehicles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const startEdit = (v: VehicleResponse) => {
    setEditingId(v.id);
    setShowAddForm(false);
    setForm({ licensePlate: v.licensePlate, vehicleCategory: v.vehicleCategory, isElectric: v.electric });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {returnTo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">Add a vehicle below — you'll be sent back to complete your purchase.</span>
          <button onClick={() => navigate(returnTo)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        </div>
      )}
      <div className="mb-8">
        <h1 className="font-bold mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your vehicles and account settings</p>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Member Since</label>
            <p className="font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* My Vehicles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">My Vehicles</h2>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setForm(emptyForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        </div>

        {showAddForm && (
          <VehicleForm
            form={form}
            setForm={setForm}
            onSubmit={handleAdd}
            onCancel={() => { setShowAddForm(false); setForm(emptyForm); }}
            submitLabel="Add Vehicle"
          />
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading vehicles...</div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((v) =>
              editingId === v.id ? (
                <div key={v.id} className="p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                  <VehicleForm
                    form={form}
                    setForm={setForm}
                    onSubmit={() => handleUpdate(v.id)}
                    onCancel={cancelEdit}
                    submitLabel="Save Changes"
                  />
                </div>
              ) : (
                <div
                  key={v.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CarIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{v.licensePlate}</h3>
                        <p className="text-sm text-gray-600">
                          Category {v.vehicleCategory} {v.electric ? '• Electric' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(v)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
            {vehicles.length === 0 && !loading && (
              <div className="py-8 text-center text-gray-500">No vehicles added yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  form: { licensePlate: string; vehicleCategory: string; isElectric: boolean };
  setForm: (f: typeof form) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">License Plate *</label>
          <input
            type="text"
            value={form.licensePlate}
            onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CJ-01-ABC"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Category *</label>
          <select
            value={form.vehicleCategory}
            onChange={(e) => setForm({ ...form, vehicleCategory: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="A">A (Compact)</option>
            <option value="B">B (Standard)</option>
            <option value="C1">C1 (Large)</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isElectric}
              onChange={(e) => setForm({ ...form, isElectric: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Electric Vehicle</span>
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
