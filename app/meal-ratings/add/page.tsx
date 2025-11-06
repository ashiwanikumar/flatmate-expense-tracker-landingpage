'use client';

import { useState, useEffect } from 'react';
import { mealRatingAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationMenu from '@/components/NavigationMenu';

export default function AddMealRatingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
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

      await mealRatingAPI.create(data);
      setSuccess('Meal rating created successfully!');

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/meal-ratings');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create rating');
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Header user={user} />}
      <NavigationMenu />
      <div className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-800 mb-4 flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Rate a Meal</h1>
          <p className="mt-2 text-sm text-gray-600">
            Share your dining experience and rate the meal
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Overall Rating */}
            <div className="pb-6 border-b border-gray-200">
              {renderStarRating('rating', formData.rating, 'Overall Rating', true)}
            </div>

            {/* Detailed Ratings */}
            <div className="pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detailed Ratings (Optional)
              </h3>
              <div className="space-y-4">
                {renderStarRating('taste', formData.taste, 'Taste')}
                {renderStarRating('presentation', formData.presentation, 'Presentation')}
                {renderStarRating('portion', formData.portion, 'Portion Size')}
              </div>
            </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
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

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comment (Optional)
              </label>
              <textarea
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                rows={4}
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
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleWouldEatAgainChange(true)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    formData.wouldEatAgain === null
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Not Sure
                </button>
              </div>
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

            {/* Anonymous Rating */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">
                Submit as anonymous rating
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
