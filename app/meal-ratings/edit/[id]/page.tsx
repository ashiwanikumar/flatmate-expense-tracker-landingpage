'use client';

import { useState, useEffect } from 'react';
import { mealRatingAPI, dinnerMenuAPI } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationMenu from '@/components/NavigationMenu';
import toast from 'react-hot-toast';

interface MenuItem {
  name: string;
  description: string;
  category: string;
  _id: string;
}

interface Menu {
  _id: string;
  date: string;
  mealType: string;
  menuItems: MenuItem[];
  preparedBy: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
}

interface Rating {
  _id: string;
  menuId?: {
    _id: string;
    date: string;
    mealType: string;
    menuItems: MenuItem[];
    preparedBy: {
      _id: string;
      name: string;
      email: string;
    };
  };
  rating: number;
  taste?: number;
  presentation?: number;
  portion?: number;
  mealDate: string;
  mealType: string;
  dishName?: string;
  comment?: string;
  wouldEatAgain?: boolean | null;
  tags?: string[];
  isAnonymous: boolean;
  ratedBy: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function EditMealRatingPage() {
  const router = useRouter();
  const params = useParams();
  const ratingId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRating, setLoadingRating] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [menus, setMenus] = useState<Menu[]>([]);
  const [rating, setRating] = useState<Rating | null>(null);

  const [formData, setFormData] = useState({
    menuId: '',
    rating: 0,
    taste: 0,
    presentation: 0,
    portion: 0,
    mealDate: new Date().toISOString().split('T')[0],
    mealType: 'dinner',
    dishName: '',
    comment: '',
    wouldEatAgain: null as boolean | null,
    tags: '',
    isAnonymous: false,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (ratingId) {
      fetchRating();
      fetchMenus();
    }
  }, [ratingId]);

  const fetchRating = async () => {
    try {
      setLoadingRating(true);
      const response = await mealRatingAPI.getById(ratingId);
      const ratingData = response.data.data.rating;
      setRating(ratingData);

      // Pre-populate form
      setFormData({
        menuId: ratingData.menuId?._id || '',
        rating: ratingData.rating || 0,
        taste: ratingData.taste || 0,
        presentation: ratingData.presentation || 0,
        portion: ratingData.portion || 0,
        mealDate: new Date(ratingData.mealDate).toISOString().split('T')[0],
        mealType: ratingData.mealType || 'dinner',
        dishName: ratingData.dishName || '',
        comment: ratingData.comment || '',
        wouldEatAgain: ratingData.wouldEatAgain ?? null,
        tags: ratingData.tags?.join(', ') || '',
        isAnonymous: ratingData.isAnonymous || false,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch rating');
      toast.error('Failed to load rating');
    } finally {
      setLoadingRating(false);
    }
  };

  const fetchMenus = async () => {
    try {
      setLoadingMenus(true);
      const response = await dinnerMenuAPI.getAll({
        limit: 50,
        sortBy: 'date',
        sortOrder: 'desc'
      });
      setMenus(response.data.data.menus || []);
    } catch (err) {
      console.error('Error fetching menus:', err);
    } finally {
      setLoadingMenus(false);
    }
  };

  const handleMenuSelection = (menuId: string) => {
    const selectedMenu = menus.find(m => m._id === menuId);
    if (selectedMenu) {
      setFormData({
        ...formData,
        menuId: menuId,
        mealDate: new Date(selectedMenu.date).toISOString().split('T')[0],
        mealType: selectedMenu.mealType,
      });
    } else {
      setFormData({
        ...formData,
        menuId: '',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRatingChange = (field: string, value: number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleWouldEatAgainChange = (value: boolean | null) => {
    setFormData({ ...formData, wouldEatAgain: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
        setError('Overall rating is required (1-5)');
        setLoading(false);
        return;
      }

      // Prepare data
      const data: any = {
        rating: parseFloat(formData.rating.toString()),
        mealDate: formData.mealDate,
        mealType: formData.mealType,
        isAnonymous: formData.isAnonymous,
      };

      if (formData.menuId) data.menuId = formData.menuId;
      if (formData.taste > 0) data.taste = parseFloat(formData.taste.toString());
      if (formData.presentation > 0) data.presentation = parseFloat(formData.presentation.toString());
      if (formData.portion > 0) data.portion = parseFloat(formData.portion.toString());
      if (formData.dishName) data.dishName = formData.dishName;
      if (formData.comment) data.comment = formData.comment;
      if (formData.wouldEatAgain !== null) data.wouldEatAgain = formData.wouldEatAgain;

      // Parse tags
      if (formData.tags) {
        data.tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }

      await mealRatingAPI.update(ratingId, data);
      setSuccess('Meal rating updated successfully!');
      toast.success('Rating updated successfully!');

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/meal-ratings');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update rating');
      toast.error(err.response?.data?.message || 'Failed to update rating');
      setLoading(false);
    }
  };

  const renderStarRating = (field: string, currentValue: number, label: string, required: boolean = false) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(field, star)}
              className="text-3xl focus:outline-none transition-colors"
            >
              <span className={star <= currentValue ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {currentValue > 0 ? `${currentValue}/5` : 'Not rated'}
          </span>
        </div>
      </div>
    );
  };

  const selectedMenu = menus.find(m => m._id === formData.menuId);

  // Check if user can edit this rating
  const canEdit = user && rating && (user._id === rating.ratedBy._id || user.id === rating.ratedBy._id);

  if (loadingRating) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {user && <Header user={user} />}
        <NavigationMenu />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-gray-500">Loading rating...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {user && <Header user={user} />}
        <NavigationMenu />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You can only edit your own ratings.</p>
            <button
              onClick={() => router.push('/meal-ratings')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Ratings
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Header user={user} />}
      <NavigationMenu />
      <div className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-purple-600 hover:text-purple-800 mb-4 flex items-center"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Meal Rating</h1>
            <p className="mt-2 text-sm text-gray-600">
              Update your dining experience and rating
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Form - Full Width Layout */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Menu Selection & Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Menu Selection Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Menu (Optional)
                  </h3>

                  {loadingMenus ? (
                    <div className="text-center py-8 text-gray-500">Loading menus...</div>
                  ) : (
                    <div>
                      <select
                        name="menuId"
                        value={formData.menuId}
                        onChange={(e) => handleMenuSelection(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                      >
                        <option value="">-- Select a menu to rate --</option>
                        {menus.map((menu) => (
                          <option key={menu._id} value={menu._id}>
                            {new Date(menu.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })} - {menu.mealType.charAt(0).toUpperCase() + menu.mealType.slice(1)}
                            ({menu.menuItems.map(item => item.name).join(', ')})
                          </option>
                        ))}
                      </select>

                      {/* Selected Menu Details */}
                      {selectedMenu && (
                        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="font-medium text-purple-900 mb-2">Selected Menu Details</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Date:</span> {new Date(selectedMenu.date).toLocaleDateString()}</p>
                            <p><span className="font-medium">Meal Type:</span> {selectedMenu.mealType.charAt(0).toUpperCase() + selectedMenu.mealType.slice(1)}</p>
                            <p><span className="font-medium">Prepared By:</span> {selectedMenu.preparedBy.name}</p>
                            <div>
                              <span className="font-medium">Menu Items:</span>
                              <ul className="list-disc list-inside ml-4 mt-1">
                                {selectedMenu.menuItems.map((item) => (
                                  <li key={item._id}>{item.name}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ratings Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Ratings
                  </h3>

                  {/* Overall Rating */}
                  <div className="pb-6 border-b border-gray-200">
                    {renderStarRating('rating', formData.rating, 'Overall Rating', true)}
                  </div>

                  {/* Detailed Ratings */}
                  <div className="pt-6">
                    <h4 className="text-base font-medium text-gray-900 mb-4">
                      Detailed Ratings (Optional)
                    </h4>
                    <div className="space-y-4">
                      {renderStarRating('taste', formData.taste, 'Taste')}
                      {renderStarRating('presentation', formData.presentation, 'Presentation')}
                      {renderStarRating('portion', formData.portion, 'Portion Size')}
                    </div>
                  </div>
                </div>

                {/* Additional Details Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Additional Details
                  </h3>

                  <div className="space-y-4">
                    {/* Meal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 mb-2">
                          Meal Type
                        </label>
                        <select
                          id="mealType"
                          name="mealType"
                          value={formData.mealType}
                          onChange={handleInputChange}
                          disabled={!!formData.menuId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100"
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="mealDate" className="block text-sm font-medium text-gray-700 mb-2">
                          Meal Date
                        </label>
                        <input
                          type="date"
                          id="mealDate"
                          name="mealDate"
                          value={formData.mealDate}
                          onChange={handleInputChange}
                          disabled={!!formData.menuId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    {/* Dish Name */}
                    <div>
                      <label htmlFor="dishName" className="block text-sm font-medium text-gray-700 mb-2">
                        Dish Name (Optional)
                      </label>
                      <input
                        type="text"
                        id="dishName"
                        name="dishName"
                        value={formData.dishName}
                        onChange={handleInputChange}
                        maxLength={200}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                        placeholder="e.g., Chicken Biryani"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (Optional)
                      </label>
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                        placeholder="e.g., spicy, vegetarian, rice (comma-separated)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate multiple tags with commas
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Comments & Preferences */}
              <div className="space-y-6">
                {/* Comment Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Feedback
                  </h3>

                  {/* Comment */}
                  <div className="mb-6">
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                      Comment (Optional)
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      rows={6}
                      maxLength={1000}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                      placeholder="Share your thoughts about this meal..."
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {formData.comment.length}/1000
                    </div>
                  </div>

                  {/* Would Eat Again */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Would you eat this again?
                    </label>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleWouldEatAgainChange(true)}
                        className={`px-4 py-3 rounded-lg transition-colors text-center ${
                          formData.wouldEatAgain === true
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWouldEatAgainChange(false)}
                        className={`px-4 py-3 rounded-lg transition-colors text-center ${
                          formData.wouldEatAgain === false
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWouldEatAgainChange(null)}
                        className={`px-4 py-3 rounded-lg transition-colors text-center ${
                          formData.wouldEatAgain === null
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Not Sure
                      </button>
                    </div>
                  </div>
                </div>

                {/* Privacy Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Privacy
                  </h3>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="isAnonymous"
                      name="isAnonymous"
                      checked={formData.isAnonymous}
                      onChange={handleInputChange}
                      className="h-4 w-4 mt-1 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isAnonymous" className="ml-3 text-sm text-gray-700">
                      Submit as anonymous rating
                      <p className="text-xs text-gray-500 mt-1">
                        Your name won't be shown with this rating
                      </p>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Updating...' : 'Update Rating'}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="w-full px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
