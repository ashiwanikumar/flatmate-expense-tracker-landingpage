'use client';

import { useState, useEffect } from 'react';
import { dinnerMenuAPI } from '@/lib/api';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [viewMode, setViewMode] = useState<'weekly' | 'list'>('weekly');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [user, setUser] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    mealType: 'dinner' as 'dinner' | 'lunch',
    menuItems: [{ name: '', description: '', category: 'main' as MenuItem['category'] }],
    servings: '',
    notes: '',
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  function getWeekDays(startDate: Date): Date[] {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  }

  function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await dinnerMenuAPI.getAll();
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

  const handleDeleteMenu = (id: string) => {
    setMenuToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteMenu = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm');
      return;
    }

    if (!menuToDelete) return;

    try {
      await dinnerMenuAPI.delete(menuToDelete);
      toast.success('Menu deleted successfully');
      setShowDeleteModal(false);
      setMenuToDelete(null);
      setDeleteConfirmText('');
      fetchMenus();
    } catch (error: any) {
      console.error('Error deleting menu:', error);
      toast.error(error.response?.data?.message || 'Failed to delete menu');
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setMenuToDelete(null);
    setDeleteConfirmText('');
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

  const handleCopyMenu = (menu: Menu) => {
    setFormData({
      date: '',
      mealType: menu.mealType,
      menuItems: menu.menuItems.map(item => ({ ...item })),
      servings: menu.servings?.toString() || '',
      notes: menu.notes || '',
    });
    setShowCreateModal(true);
    toast.success('Menu copied! Select a new date to create.');
  };

  const resetForm = () => {
    setFormData({
      date: '',
      mealType: 'dinner',
      menuItems: [{ name: '', description: '', category: 'main' }],
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

  const getMenusForDate = (date: Date): Menu[] => {
    const dateKey = formatDateKey(date);
    return menus.filter(menu => menu.date.startsWith(dateKey));
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
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

  const weekDays = getWeekDays(currentWeekStart);
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Header user={user} />}
      <NavigationMenu />
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Menu Planner</h1>
          <p className="mt-2 text-sm text-gray-600">
            Plan and manage weekly meal menus for the group
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                viewMode === 'weekly'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Weekly View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List View
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Menu
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading menus...</p>
          </div>
        ) : viewMode === 'weekly' ? (
          <div>
            {/* Week Navigation */}
            <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition"
                  title="Previous week"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {' - '}
                    {weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h2>
                  <button
                    onClick={goToCurrentWeek}
                    className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Go to Current Week
                  </button>
                </div>

                <button
                  onClick={goToNextWeek}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition"
                  title="Next week"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Weekly Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              {weekDays.map((day, index) => {
                const dayMenus = getMenusForDate(day);
                const isToday = formatDateKey(day) === formatDateKey(new Date());

                return (
                  <div
                    key={index}
                    className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                      isToday ? 'border-purple-400 shadow-purple-100' : 'border-gray-200'
                    }`}
                  >
                    <div className={`p-3.5 border-b ${isToday ? 'bg-gradient-to-br from-purple-600 to-blue-600 border-purple-500' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-center">
                        <div className={`text-xs font-bold uppercase tracking-wide ${
                          isToday ? 'text-white' : 'text-gray-500'
                        }`}>
                          {day.toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                        <div className={`text-3xl font-bold mt-1.5 ${
                          isToday ? 'text-white' : 'text-gray-900'
                        }`}>
                          {day.getDate()}
                        </div>
                        <div className={`text-xs font-semibold mt-0.5 ${
                          isToday ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {day.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 min-h-[280px] bg-gradient-to-b from-white to-gray-50">
                      {dayMenus.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-16">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-400">No menu planned</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dayMenus.map((menu) => (
                            <div key={menu._id} className="border border-gray-200 rounded-lg hover:border-purple-300 transition-all shadow-sm hover:shadow-md bg-white">
                              <div className="flex items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
                                <span className="px-2 py-0.5 text-[10px] font-bold text-purple-700 uppercase bg-white rounded shadow-sm whitespace-nowrap">
                                  {menu.mealType}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(menu.status)} shadow-sm whitespace-nowrap`}>
                                  {menu.status}
                                </span>
                              </div>

                              <div className="p-2.5">
                                <ul className="space-y-1.5 mb-2.5">
                                  {menu.menuItems.slice(0, 3).map((item, idx) => (
                                    <li key={idx} className="text-[11px]">
                                      <div className="flex items-start gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                                          {item.description && (
                                            <div className="text-gray-500 text-[10px] mt-0.5 truncate">
                                              {item.description}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                  {menu.menuItems.length > 3 && (
                                    <li className="text-[10px] text-purple-600 font-medium pl-2.5">
                                      +{menu.menuItems.length - 3} more items
                                    </li>
                                  )}
                                </ul>

                              <div className="text-[10px] text-gray-600 pb-2 border-b border-gray-100 mb-2 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="truncate font-medium text-gray-700" title={menu.preparedBy.name}>
                                    {menu.preparedBy.name}
                                  </span>
                                </div>
                                {menu.servings && (
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="font-medium text-gray-700 truncate">{menu.servings} servings</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-1">
                                {menu.status === 'planned' && (
                                  <button
                                    onClick={() => handleUpdateStatus(menu._id, 'preparing')}
                                    className="flex-1 px-1.5 py-1 text-[10px] bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition font-bold border border-yellow-200"
                                    title="Start preparing this menu"
                                  >
                                    Start
                                  </button>
                                )}
                                {menu.status === 'preparing' && (
                                  <button
                                    onClick={() => handleUpdateStatus(menu._id, 'ready')}
                                    className="flex-1 px-1.5 py-1 text-[10px] bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-bold border border-green-200"
                                    title="Mark menu as ready"
                                  >
                                    Ready
                                  </button>
                                )}
                                {menu.status === 'ready' && (
                                  <button
                                    onClick={() => handleUpdateStatus(menu._id, 'served')}
                                    className="flex-1 px-1.5 py-1 text-[10px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-bold border border-blue-200"
                                    title="Mark menu as served"
                                  >
                                    Served
                                  </button>
                                )}
                                <button
                                  onClick={() => handleCopyMenu(menu)}
                                  className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition border border-purple-200 flex-shrink-0"
                                  title="Copy this menu to another date"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteMenu(menu._id)}
                                  className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition border border-red-200 flex-shrink-0"
                                  title="Delete this menu"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // List View
          <div>
            {menus.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">No menus found. Create your first menu!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {menus.map((menu) => (
                  <div key={menu._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {new Date(menu.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize font-medium">{menu.mealType}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(menu.status)}`}>
                        {menu.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Menu Items:</h4>
                      <ul className="space-y-1.5">
                        {menu.menuItems.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <div>
                              <span className="font-medium text-gray-900">{item.name}</span>
                              {item.description && (
                                <span className="text-gray-500"> - {item.description}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-sm text-gray-600 mb-4 space-y-1">
                      <p>
                        <span className="font-semibold">Prepared by:</span> {menu.preparedBy.name}
                      </p>
                      {menu.servings && (
                        <p>
                          <span className="font-semibold">Servings:</span> {menu.servings}
                        </p>
                      )}
                      {menu.notes && (
                        <p className="mt-2 italic text-gray-500 text-xs">{menu.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {menu.status === 'planned' && (
                          <button
                            onClick={() => handleUpdateStatus(menu._id, 'preparing')}
                            className="flex-1 px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition font-medium"
                            title="Start preparing"
                          >
                            Start Preparing
                          </button>
                        )}
                        {menu.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(menu._id, 'ready')}
                            className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium"
                            title="Mark as ready"
                          >
                            Mark Ready
                          </button>
                        )}
                        {menu.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(menu._id, 'served')}
                            className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium"
                            title="Mark as served"
                          >
                            Mark Served
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyMenu(menu)}
                          className="px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium"
                          title="Copy menu"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(menu._id)}
                          className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"
                          title="Delete menu"
                        >
                          Delete
                        </button>
                      </div>
                      <Link
                        href="/food-photos"
                        className="w-full px-3 py-2 text-sm bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 rounded-lg hover:from-purple-100 hover:to-blue-100 transition text-center font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Upload Photos
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Menu Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      <div key={index} className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          />
                          <select
                            value={item.category}
                            onChange={(e) => updateMenuItem(index, 'category', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          {formData.menuItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMenuItem(index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add Another Item
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servings
                    </label>
                    <input
                      type="number"
                      value={formData.servings}
                      onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      placeholder="Number of servings"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any special notes or instructions..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      Create Menu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Menu</h3>
                <p className="text-sm text-gray-600 text-center mb-6">
                  This action cannot be undone. Please type <span className="font-bold text-gray-900">delete</span> to confirm.
                </p>

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder='Type "delete" to confirm'
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                  autoFocus
                />

                <div className="flex gap-3">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteMenu}
                    disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
