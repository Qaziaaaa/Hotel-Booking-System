import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI, hotelsAPI, roomsAPI } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Hotel,
  Calendar,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Loader2,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
// ─── Shared UI helpers ───────────────────────────────────────────────────────
const ModalWrapper = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const FormField = ({ label, value, onChange, type = 'text', textarea = false, required = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    )}
  </div>
);

// ─── CreateHotelModal ────────────────────────────────────────────────────────
const CreateHotelModal = ({ onClose, queryClient }) => {
  const [form, setForm] = useState({
    name: '', location: '', address: '', description: '', amenities: '',
  });
  const [imageFiles, setImageFiles] = useState([]);

  const mutation = useMutation({
    mutationFn: (formData) => hotelsAPI.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHotels'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('location', form.location);
    fd.append('address', form.address);
    fd.append('description', form.description);
    if (form.amenities) {
      form.amenities.split(',').map((a) => a.trim()).filter(Boolean).forEach((a) => fd.append('amenities', a));
    }
    imageFiles.forEach((f) => fd.append('images', f));
    mutation.mutate(fd);
  };

  return (
    <ModalWrapper title="Add Hotel" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} required />
        <FormField label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
        <FormField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea required />
        <FormField label="Amenities (comma-separated)" value={form.amenities} onChange={(v) => setForm({ ...form, amenities: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Images</label>
          <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
        </div>
        {mutation.isError && (
          <p className="text-red-600 text-sm">{mutation.error?.response?.data?.message || 'An error occurred'}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {mutation.isPending ? 'Creating...' : 'Create Hotel'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// ─── EditHotelModal ──────────────────────────────────────────────────────────
const EditHotelModal = ({ hotel, onClose, queryClient }) => {
  const [form, setForm] = useState({
    name: hotel.name || '',
    location: hotel.location || '',
    address: hotel.address || '',
    description: hotel.description || '',
    amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : (hotel.amenities || ''),
  });
  const [imageFiles, setImageFiles] = useState([]);

  const mutation = useMutation({
    mutationFn: (formData) => hotelsAPI.update(hotel.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHotels'] });
      queryClient.invalidateQueries({ queryKey: ['hotel', hotel.id] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('location', form.location);
    fd.append('address', form.address);
    fd.append('description', form.description);
    if (form.amenities) {
      form.amenities.split(',').map((a) => a.trim()).filter(Boolean).forEach((a) => fd.append('amenities', a));
    }
    imageFiles.forEach((f) => fd.append('images', f));
    mutation.mutate(fd);
  };

  return (
    <ModalWrapper title="Edit Hotel" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} required />
        <FormField label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
        <FormField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea required />
        <FormField label="Amenities (comma-separated)" value={form.amenities} onChange={(v) => setForm({ ...form, amenities: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Replace Images (optional)</label>
          <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
        </div>
        {mutation.isError && (
          <p className="text-red-600 text-sm">{mutation.error?.response?.data?.message || 'An error occurred'}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// ─── CreateRoomModal ─────────────────────────────────────────────────────────
const CreateRoomModal = ({ hotelId, onClose, queryClient }) => {
  const [form, setForm] = useState({
    roomType: '', price: '', capacity: '', description: '', amenities: '',
  });
  const [imageFiles, setImageFiles] = useState([]);

  const mutation = useMutation({
    mutationFn: (formData) => roomsAPI.create(hotelId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRooms', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', hotelId] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('roomType', form.roomType);
    fd.append('price', form.price);
    fd.append('capacity', form.capacity);
    if (form.description) fd.append('description', form.description);
    if (form.amenities) {
      form.amenities.split(',').map((a) => a.trim()).filter(Boolean).forEach((a) => fd.append('amenities', a));
    }
    imageFiles.forEach((f) => fd.append('images', f));
    mutation.mutate(fd);
  };

  return (
    <ModalWrapper title="Add Room" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Room Type" value={form.roomType} onChange={(v) => setForm({ ...form, roomType: v })} required />
        <FormField label="Price per Night ($)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
        <FormField label="Capacity (guests)" type="number" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} required />
        <FormField label="Description (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
        <FormField label="Amenities (comma-separated)" value={form.amenities} onChange={(v) => setForm({ ...form, amenities: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Images</label>
          <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
        </div>
        {mutation.isError && (
          <p className="text-red-600 text-sm">{mutation.error?.response?.data?.message || 'An error occurred'}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {mutation.isPending ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// ─── EditRoomModal ───────────────────────────────────────────────────────────
const EditRoomModal = ({ room, hotelId, onClose, queryClient }) => {
  const [form, setForm] = useState({
    roomType: room.roomType || '',
    price: room.price != null ? String(room.price) : '',
    capacity: room.capacity != null ? String(room.capacity) : '',
    description: room.description || '',
    amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : (room.amenities || ''),
  });
  const [imageFiles, setImageFiles] = useState([]);

  const mutation = useMutation({
    mutationFn: (formData) => roomsAPI.update(room.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRooms', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', hotelId] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('roomType', form.roomType);
    fd.append('price', form.price);
    fd.append('capacity', form.capacity);
    if (form.description) fd.append('description', form.description);
    if (form.amenities) {
      form.amenities.split(',').map((a) => a.trim()).filter(Boolean).forEach((a) => fd.append('amenities', a));
    }
    imageFiles.forEach((f) => fd.append('images', f));
    mutation.mutate(fd);
  };

  return (
    <ModalWrapper title="Edit Room" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Room Type" value={form.roomType} onChange={(v) => setForm({ ...form, roomType: v })} required />
        <FormField label="Price per Night ($)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
        <FormField label="Capacity (guests)" type="number" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} required />
        <FormField label="Description (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
        <FormField label="Amenities (comma-separated)" value={form.amenities} onChange={(v) => setForm({ ...form, amenities: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Replace Images (optional)</label>
          <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
        </div>
        {mutation.isError && (
          <p className="text-red-600 text-sm">{mutation.error?.response?.data?.message || 'An error occurred'}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// ─── HotelsTab ───────────────────────────────────────────────────────────────
const HotelsTab = () => {
  const queryClient = useQueryClient();
  const [showCreateHotel, setShowCreateHotel] = useState(false);
  const [editHotel, setEditHotel] = useState(null);
  const [expandedHotelId, setExpandedHotelId] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [editRoom, setEditRoom] = useState(null);

  const { data: hotelsData, isLoading: hotelsLoading } = useQuery({
    queryKey: ['adminHotels'],
    queryFn: () => hotelsAPI.getAll({ limit: 100 }),
  });

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['adminRooms', expandedHotelId],
    queryFn: () => roomsAPI.getByHotel(expandedHotelId),
    enabled: !!expandedHotelId,
  });

  const deleteHotelMutation = useMutation({
    mutationFn: (id) => hotelsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHotels'] });
      if (expandedHotelId) setExpandedHotelId(null);
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id) => roomsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRooms', expandedHotelId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', expandedHotelId] });
    },
  });

  const handleDeleteHotel = (hotel) => {
    if (window.confirm(`Delete hotel "${hotel.name}"? This will also delete all its rooms and bookings.`)) {
      deleteHotelMutation.mutate(hotel.id);
    }
  };

  const handleDeleteRoom = (room) => {
    if (window.confirm(`Delete room "${room.roomType}"? This will also delete associated bookings.`)) {
      deleteRoomMutation.mutate(room.id);
    }
  };

  const hotels = hotelsData?.data?.data?.hotels || hotelsData?.data?.data || [];
  const rooms = roomsData?.data?.data?.rooms || roomsData?.data?.data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hotels</h2>
        <button
          onClick={() => setShowCreateHotel(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Hotel
        </button>
      </div>

      {hotelsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No hotels found. Add your first hotel.</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Location</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Rooms</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((hotel) => (
                <>
                  <tr key={hotel.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{hotel.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{hotel.location}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {hotel._count?.rooms ?? hotel.rooms?.length ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setExpandedHotelId(expandedHotelId === hotel.id ? null : hotel.id)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                          title="View rooms"
                        >
                          {expandedHotelId === hotel.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setEditHotel(hotel)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                          title="Edit hotel"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteHotel(hotel)}
                          disabled={deleteHotelMutation.isPending}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-50"
                          title="Delete hotel"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedHotelId === hotel.id && (
                    <tr key={`${hotel.id}-rooms`} className="bg-gray-50 dark:bg-gray-700/20">
                      <td colSpan={4} className="px-6 py-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rooms for {hotel.name}</h3>
                          <button
                            onClick={() => setShowCreateRoom(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Room
                          </button>
                        </div>
                        {roomsLoading ? (
                          <div className="flex items-center gap-2 py-4 text-gray-500 dark:text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading rooms...</span>
                          </div>
                        ) : rooms.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No rooms yet. Add the first room.</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Room Type</th>
                                <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Price/Night</th>
                                <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Capacity</th>
                                <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rooms.map((room) => (
                                <tr key={room.id} className="border-b border-gray-100 dark:border-gray-600/50">
                                  <td className="py-2 pr-4 text-gray-900 dark:text-white">{room.roomType}</td>
                                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">${room.price}</td>
                                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{room.capacity} guests</td>
                                  <td className="py-2">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setEditRoom(room)}
                                        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                        title="Edit room"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRoom(room)}
                                        disabled={deleteRoomMutation.isPending}
                                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-50"
                                        title="Delete room"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateHotel && (
        <CreateHotelModal onClose={() => setShowCreateHotel(false)} queryClient={queryClient} />
      )}
      {editHotel && (
        <EditHotelModal hotel={editHotel} onClose={() => setEditHotel(null)} queryClient={queryClient} />
      )}
      {showCreateRoom && expandedHotelId && (
        <CreateRoomModal hotelId={expandedHotelId} onClose={() => setShowCreateRoom(false)} queryClient={queryClient} />
      )}
      {editRoom && expandedHotelId && (
        <EditRoomModal room={editRoom} hotelId={expandedHotelId} onClose={() => setEditRoom(null)} queryClient={queryClient} />
      )}
    </div>
  );
};

// ─── Main DashboardPage ──────────────────────────────────────────────────────
const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [period, setPeriod] = useState('30d');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics', period],
    queryFn: () => analyticsAPI.getDashboardStats(period),
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => analyticsAPI.getUserStats(),
  });

  const stats = analytics?.data?.data;
  const users = userStats?.data?.data;

  const periodOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your hotel booking performance</p>
          </div>
          {activeTab === 'analytics' && (
            <div className="mt-4 sm:mt-0">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                {periodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border border-b-white dark:border-gray-700 dark:border-b-gray-800 -mb-px'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('hotels')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'hotels'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border border-b-white dark:border-gray-700 dark:border-b-gray-800 -mb-px'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Hotels
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                  <span className="text-gray-600 dark:text-gray-300">Loading analytics...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats?.summary?.totalBookings || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(stats?.summary?.totalRevenue || 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">New Users</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats?.summary?.newUsers || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Occupancy Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(stats?.summary?.occupancyRate || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                        <Hotel className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Bookings Over Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bookings Over Time</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats?.bookingsOverTime || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis stroke="#6b7280" fontSize={12} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <Line
                            type="monotone"
                            dataKey="bookings"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Revenue Over Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Over Time</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.revenueOverTime || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis stroke="#6b7280" fontSize={12} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bookings by Status */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bookings by Status</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats?.bookingsByStatus || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="_count.id"
                            nameKey="status"
                          >
                            {(stats?.bookingsByStatus || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Hotels */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Hotels</h3>
                    <div className="space-y-4">
                      {(stats?.topHotels || []).map((hotel, idx) => (
                        <div key={hotel.hotelId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{idx + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{hotel.hotelName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{hotel._count.id} bookings</p>
                            </div>
                          </div>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(hotel._sum.totalPrice || 0)}
                          </p>
                        </div>
                      ))}
                      {(!stats?.topHotels || stats.topHotels.length === 0) && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Hotels Tab */}
        {activeTab === 'hotels' && <HotelsTab />}
      </div>
    </div>
  );
};

export default DashboardPage;
