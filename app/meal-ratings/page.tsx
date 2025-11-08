'use client';

import { useState, useEffect } from 'react';
import { mealRatingAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface MealRating {
  _id: string;
  rating: number;
  taste?: number;
  presentation?: number;
  portion?: number;
  mealDate: string;
  mealType: string;
  dishName?: string;
  comment?: string;
  wouldEatAgain?: boolean;
  tags?: string[];
  ratedBy: User;
  cookedBy?: User;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  overall: {
    totalRatings: number;
    avgRating: number;
    avgTaste: number;
    avgPresentation: number;
    avgPortion: number;
    wouldEatAgainCount: number;
  };
  byMealType: Array<{
    _id: string;
    count: number;
    avgRating: number;
  }>;
  topDishes: Array<{
    _id: string;
    count: number;
    avgRating: number;
  }>;
}

export default function MealRatingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ratings, setRatings] = useState<MealRating[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    mealType: '',
    startDate: '',
    endDate: '',
    minRating: '',
    maxRating: '',
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ratingToDelete, setRatingToDelete] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    fetchRatings();
    fetchStats();
  }, [filter]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const params = {
        ...filter,
        sortBy: 'mealDate',
        sortOrder: 'desc',
      };
      const response = await mealRatingAPI.getMyRatings(params);
      setRatings(response.data.data.ratings);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {
        startDate: filter.startDate,
        endDate: filter.endDate,
      };
      const response = await mealRatingAPI.getStats(params);
      setStats(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDelete = async () => {
    if (!ratingToDelete) return;

    try {
      await mealRatingAPI.delete(ratingToDelete);
      setRatings(ratings.filter(r => r._id !== ratingToDelete));
      setDeleteModalOpen(false);
      setRatingToDelete(null);
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete rating');
    }
  };

  const openDeleteModal = (ratingId: string) => {
    setRatingToDelete(ratingId);
    setDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">½</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300">★</span>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getMealTypeBadgeColor = (mealType: string) => {
    const colors: { [key: string]: string } = {
      breakfast: 'bg-yellow-100 text-yellow-800',
      lunch: 'bg-orange-100 text-orange-800',
      dinner: 'bg-purple-100 text-purple-800',
      snack: 'bg-green-100 text-green-800',
    };
    return colors[mealType] || colors.dinner;
  };

  return (
    <LayoutWrapper user={user}>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meal Ratings</h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                {user?.organizationRole === 'cook' ? 'View meal ratings and feedback' : 'Rate your meals and track your dining experience'}
              </p>
            </div>
            {/* Hide "Rate a Meal" button for cook role */}
            {user?.organizationRole !== 'cook' && (
              <button
                onClick={() => router.push('/meal-ratings/add')}
                className="px-4 py-2 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors self-start sm:self-auto whitespace-nowrap"
              >
                + Rate a Meal
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Ratings</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.overall.totalRatings}
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Average Rating</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.overall.avgRating ? stats.overall.avgRating.toFixed(1) : '0.0'} ★
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Would Eat Again</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.overall.wouldEatAgainCount}
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Avg Taste Score</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.overall.avgTaste ? stats.overall.avgTaste.toFixed(1) : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Meal Type
              </label>
              <select
                value={filter.mealType}
                onChange={(e) => setFilter({ ...filter, mealType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">All Types</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Min Rating
              </label>
              <select
                value={filter.minRating}
                onChange={(e) => setFilter({ ...filter, minRating: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Any</option>
                <option value="1">1★</option>
                <option value="2">2★</option>
                <option value="3">3★</option>
                <option value="4">4★</option>
                <option value="5">5★</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Max Rating
              </label>
              <select
                value={filter.maxRating}
                onChange={(e) => setFilter({ ...filter, maxRating: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Any</option>
                <option value="1">1★</option>
                <option value="2">2★</option>
                <option value="3">3★</option>
                <option value="4">4★</option>
                <option value="5">5★</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Ratings Grid */}
        {loading ? (
          <div className="p-6 sm:p-8 text-center text-sm text-gray-500">Loading ratings...</div>
        ) : ratings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-sm text-gray-500">
            No ratings found. Start by rating your first meal!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {ratings.map((rating) => (
              <div key={rating._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        {rating.dishName || 'Unnamed Dish'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMealTypeBadgeColor(rating.mealType)}`}>
                          {rating.mealType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(rating.mealDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Overall Rating */}
                  <div className="mb-3 sm:mb-4">
                    {renderStars(rating.rating)}
                  </div>

                  {/* Detailed Ratings */}
                  {(rating.taste || rating.presentation || rating.portion) && (
                    <div className="mb-3 sm:mb-4 space-y-2">
                      {rating.taste && (
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Taste:</span>
                          <span className="font-medium">{rating.taste}/5</span>
                        </div>
                      )}
                      {rating.presentation && (
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Presentation:</span>
                          <span className="font-medium">{rating.presentation}/5</span>
                        </div>
                      )}
                      {rating.portion && (
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Portion:</span>
                          <span className="font-medium">{rating.portion}/5</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comment */}
                  {rating.comment && (
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-gray-700 italic">"{rating.comment}"</p>
                    </div>
                  )}

                  {/* Would Eat Again */}
                  {rating.wouldEatAgain !== null && rating.wouldEatAgain !== undefined && (
                    <div className="mb-3 sm:mb-4">
                      {rating.wouldEatAgain ? (
                        <span className="text-xs sm:text-sm text-green-600">✓ Would eat again</span>
                      ) : (
                        <span className="text-xs sm:text-sm text-red-600">✗ Would not eat again</span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {rating.tags && rating.tags.length > 0 && (
                    <div className="mb-3 sm:mb-4 flex flex-wrap gap-1">
                      {rating.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Cooked By */}
                  {rating.cookedBy && (
                    <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
                      Cooked by: <span className="font-medium">{rating.cookedBy.name}</span>
                    </div>
                  )}

                  {/* Actions - Hide for cook role (view only) */}
                  {user?.organizationRole !== 'cook' && (
                    <div className="flex justify-end gap-2 pt-3 sm:pt-4 border-t border-gray-200">
                      <button
                        onClick={() => router.push(`/meal-ratings/edit/${rating._id}`)}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(rating._id)}
                        className="text-xs sm:text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Delete Rating
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this rating? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setRatingToDelete(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}
