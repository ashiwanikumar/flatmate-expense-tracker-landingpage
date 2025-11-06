'use client';

import { useState, useEffect } from 'react';
import { dinnerMenuAPI, foodPhotoAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationMenu from '@/components/NavigationMenu';

interface MenuItem {
  name: string;
  description?: string;
  category: 'main' | 'side' | 'dessert' | 'beverage' | 'other';
}

interface Menu {
  _id: string;
  date: string;
  mealType: 'dinner' | 'lunch';
  menuItems: MenuItem[];
  preparedBy: {
    _id: string;
    name: string;
    email: string;
  };
  estimatedCost?: number;
  actualCost?: number;
  servings?: number;
  notes?: string;
  status: 'planned' | 'preparing' | 'ready' | 'served' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'upcoming' | 'all'>('upcoming');
  const [days, setDays] = useState(7);
  const [user, setUser] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    mealType: 'dinner' as 'dinner' | 'lunch',
    menuItems: [{ name: '', description: '', category: 'main' as MenuItem['category'] }],
    estimatedCost: '',
    servings: '',
    notes: '',
  });

  useEffect(() => {
    fetchMenus();
  }, [viewMode, days]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      let response;

      if (viewMode === 'upcoming') {
        response = await dinnerMenuAPI.getUpcoming({ days });
      } else {
        response = await dinnerMenuAPI.getAll();
      }

      setMenus(response.data.data.menus || response.data.data);
    } catch (error: any) {
      console.error('Error fetching menus:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch menus');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate
      if (!formData.date) {
        toast.error('Please select a date');
        return;
      }

      if (formData.menuItems.length === 0 || !formData.menuItems[0].name) {
        toast.error('Please add at least one menu item');
        return;
      }

      const menuData = {
        date: formData.date,
        mealType: formData.mealType,
        menuItems: formData.menuItems.filter(item => item.name.trim() !== ''),
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        servings: formData.servings ? parseInt(formData.servings) : undefined,
        notes: formData.notes || undefined,
      };

      await dinnerMenuAPI.create(menuData);
      toast.success('Menu created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchMenus();
    } catch (error: any) {
      console.error('Error creating menu:', error);
      toast.error(error.response?.data?.message || 'Failed to create menu');
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu?')) return;

    try {
      await dinnerMenuAPI.delete(id);
      toast.success('Menu deleted successfully');
      fetchMenus();
    } catch (error: any) {
      console.error('Error deleting menu:', error);
      toast.error(error.response?.data?.message || 'Failed to delete menu');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await dinnerMenuAPI.updateStatus(id, status);
      toast.success('Menu status updated');
      fetchMenus();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      mealType: 'dinner',
      menuItems: [{ name: '', description: '', category: 'main' }],
      estimatedCost: '',
      servings: '',
      notes: '',
    });
  };

  const addMenuItem = () => {
    setFormData({
      ...formData,
      menuItems: [...formData.menuItems, { name: '', description: '', category: 'main' }],
    });
  };

  const removeMenuItem = (index: number) => {
    setFormData({
      ...formData,
      menuItems: formData.menuItems.filter((_, i) => i !== index),
    });
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string) => {
    const updatedItems = [...formData.menuItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, menuItems: updatedItems });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Header user={user} />}
      <NavigationMenu />
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dinner Menu</h1>
          <p className="mt-2 text-sm text-gray-600">
            Plan and manage upcoming meal menus for the group
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'upcoming'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Menus
            </button>
          </div>

          {viewMode === 'upcoming' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show next</label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
          >
            + Create Menu
          </button>
        </div>

        {/* Menus List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading menus...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No menus found. Create your first menu!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => (
              <div key={menu._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatDate(menu.date)}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">{menu.mealType}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(menu.status)}`}>
                    {menu.status}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Menu Items:</h4>
                  <ul className="space-y-1">
                    {menu.menuItems.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        <span className="font-medium">{item.name}</span>
                        {item.description && (
                          <span className="text-gray-500"> - {item.description}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p>
                    <span className="font-medium">Prepared by:</span> {menu.preparedBy.name}
                  </p>
                  {menu.servings && (
                    <p>
                      <span className="font-medium">Servings:</span> {menu.servings}
                    </p>
                  )}
                  {menu.estimatedCost && (
                    <p>
                      <span className="font-medium">Estimated Cost:</span> ₹{menu.estimatedCost}
                    </p>
                  )}
                  {menu.notes && (
                    <p className="mt-2 italic text-gray-500">{menu.notes}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {menu.status === 'planned' && (
                      <button
                        onClick={() => handleUpdateStatus(menu._id, 'preparing')}
                        className="flex-1 px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition"
                      >
                        Start Preparing
                      </button>
                    )}
                    {menu.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(menu._id, 'ready')}
                        className="flex-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 transition"
                      >
                        Mark Ready
                      </button>
                    )}
                    {menu.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(menu._id, 'served')}
                        className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition"
                      >
                        Mark Served
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMenu(menu._id)}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                  <Link
                    href="/food-photos"
                    className="w-full px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition text-center"
                  >
                    📸 Upload Photos
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Menu Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Menu</h2>

                <form onSubmit={handleCreateMenu} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meal Type *
                      </label>
                      <select
                        value={formData.mealType}
                        onChange={(e) => setFormData({ ...formData, mealType: e.target.value as 'dinner' | 'lunch' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      >
                        <option value="dinner">Dinner</option>
                        <option value="lunch">Lunch</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Menu Items *
                    </label>
                    {formData.menuItems.map((item, index) => (
                      <div key={index} className="mb-3 p-3 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                            required
                          />
                          <select
                            value={item.category}
                            onChange={(e) => updateMenuItem(index, 'category', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                          >
                            <option value="main">Main</option>
                            <option value="side">Side</option>
                            <option value="dessert">Dessert</option>
                            <option value="beverage">Beverage</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            value={item.description}
                            onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                          />
                          {formData.menuItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMenuItem(index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addMenuItem}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      + Add Another Item
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Servings
                      </label>
                      <input
                        type="number"
                        value={formData.servings}
                        onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      rows={3}
                      placeholder="Any special notes or instructions..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                    >
                      Create Menu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
