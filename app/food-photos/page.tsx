'use client';

import { useState, useEffect } from 'react';
import { foodPhotoAPI, dinnerMenuAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import LayoutWrapper from '@/components/LayoutWrapper';

interface Photo {
  url: string;
  filename: string;
  uploadedAt: string;
}

interface FoodPhoto {
  _id: string;
  menuId: {
    _id: string;
    date: string;
    mealType: string;
    menuItems: { name: string }[];
  };
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  photos: Photo[];
  caption?: string;
  tags?: string[];
  likes: any[];
  comments: any[];
  likesCount: number;
  commentsCount: number;
  photosCount: number;
  createdAt: string;
}

interface Menu {
  _id: string;
  date: string;
  mealType: string;
  menuItems: { name: string }[];
}

export default function FoodPhotosPage() {
  const [photos, setPhotos] = useState<FoodPhoto[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FoodPhoto | null>(null);
  const [commentText, setCommentText] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    menuId: '',
    files: [] as File[],
    caption: '',
    tags: '',
  });

  useEffect(() => {
    fetchPhotos();
    fetchMenus();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await foodPhotoAPI.getRecent({ limit: 50 });
      setPhotos(response.data.data.photos);
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await dinnerMenuAPI.getUpcoming({ days: 30 });
      setMenus(response.data.data.menus || response.data.data);
    } catch (error: any) {
      console.error('Error fetching menus:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Validate file count
      if (filesArray.length > 10) {
        toast.error('Maximum 10 photos allowed');
        e.target.value = ''; // Clear the input
        return;
      }

      // Validate each file is an image
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const invalidFiles = filesArray.filter(file => !validImageTypes.includes(file.type));

      if (invalidFiles.length > 0) {
        toast.error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
        e.target.value = ''; // Clear the input
        return;
      }

      // Validate file size (10MB max per file)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = filesArray.filter(file => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        toast.error('Each image must be less than 10MB');
        e.target.value = ''; // Clear the input
        return;
      }

      setUploadForm({ ...uploadForm, files: filesArray });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.menuId) {
      toast.error('Please select a menu');
      return;
    }

    if (uploadForm.files.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('menuId', uploadForm.menuId);

      uploadForm.files.forEach((file) => {
        formData.append('photos', file);
      });

      if (uploadForm.caption) {
        formData.append('caption', uploadForm.caption);
      }

      if (uploadForm.tags) {
        const tagsArray = uploadForm.tags.split(',').map(t => t.trim()).filter(t => t);
        formData.append('tags', JSON.stringify(tagsArray));
      }

      await foodPhotoAPI.upload(formData);
      toast.success('Photos uploaded successfully!');
      setShowUploadModal(false);
      resetUploadForm();
      fetchPhotos();
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      toast.error(error.response?.data?.message || 'Failed to upload photos');
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      menuId: '',
      files: [],
      caption: '',
      tags: '',
    });
  };

  const handleLike = async (photoId: string) => {
    try {
      await foodPhotoAPI.addLike(photoId);
      fetchPhotos();
      if (selectedPhoto?._id === photoId) {
        const response = await foodPhotoAPI.getById(photoId);
        setSelectedPhoto(response.data.data.photo);
      }
    } catch (error: any) {
      console.error('Error liking photo:', error);
      toast.error(error.response?.data?.message || 'Failed to like photo');
    }
  };

  const handleUnlike = async (photoId: string) => {
    try {
      await foodPhotoAPI.removeLike(photoId);
      fetchPhotos();
      if (selectedPhoto?._id === photoId) {
        const response = await foodPhotoAPI.getById(photoId);
        setSelectedPhoto(response.data.data.photo);
      }
    } catch (error: any) {
      console.error('Error unliking photo:', error);
      toast.error(error.response?.data?.message || 'Failed to unlike photo');
    }
  };

  const handleAddComment = async (photoId: string) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await foodPhotoAPI.addComment(photoId, commentText);
      setCommentText('');
      const response = await foodPhotoAPI.getById(photoId);
      setSelectedPhoto(response.data.data.photo);
      toast.success('Comment added');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    if (deleteConfirmText.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm');
      return;
    }

    try {
      await foodPhotoAPI.delete(photoToDelete);
      toast.success('Photo deleted successfully');
      setSelectedPhoto(null);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      setPhotoToDelete(null);
      fetchPhotos();
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast.error(error.response?.data?.message || 'Failed to delete photo');
    }
  };

  const initiateDelete = (photoId: string) => {
    setPhotoToDelete(photoId);
    setShowDeleteModal(true);
    setDeleteConfirmText('');
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setPhotoToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004/api/v1';
  };

  const getImageUrl = (url: string) => {
    // If URL is already a full URL (starts with http:// or https://), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Otherwise, prepend API base URL (for old local files)
    return getApiUrl().replace('/api/v1', '') + url;
  };

  return (
    <LayoutWrapper user={user}>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Food Photos</h1>
            <p className="mt-2 text-sm text-gray-600">
              Share photos of delicious meals prepared by the group
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
          >
            + Upload Photos
          </button>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No photos yet. Upload your first food photo!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative aspect-square">
                  <img
                    src={getImageUrl(photo.photos[0].url)}
                    alt={photo.caption || 'Food photo'}
                    className="w-full h-full object-cover"
                  />
                  {photo.photosCount > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      +{photo.photosCount - 1}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {photo.menuId.menuItems.map(i => i.name).join(', ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    by {photo.uploadedBy.name}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    <span>❤️ {photo.likesCount}</span>
                    <span>💬 {photo.commentsCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Food Photos</h2>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Menu *
                    </label>
                    <select
                      value={uploadForm.menuId}
                      onChange={(e) => setUploadForm({ ...uploadForm, menuId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      required
                    >
                      <option value="">Choose a menu...</option>
                      {menus.map((menu) => (
                        <option key={menu._id} value={menu._id}>
                          {formatDate(menu.date)} - {menu.menuItems.map(i => i.name).join(', ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Photos * (Max 10)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      required
                    />
                    {uploadForm.files.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        {uploadForm.files.length} file(s) selected
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Only image files (JPEG, PNG, GIF, WebP) are allowed. Max 10MB per image.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Caption
                    </label>
                    <textarea
                      value={uploadForm.caption}
                      onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      rows={3}
                      placeholder="Share your thoughts about this meal..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      placeholder="spicy, vegetarian, homemade"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                    >
                      Upload Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        resetUploadForm();
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this photo? This action cannot be undone.
              </p>
              <p className="text-sm text-gray-700 mb-2 font-medium">
                Type <span className="font-bold text-red-600">delete</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'delete' here"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePhoto}
                  disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedPhoto.menuId.menuItems.map(i => i.name).join(', ')}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Uploaded by {selectedPhoto.uploadedBy.name} on {formatDate(selectedPhoto.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Photos */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {selectedPhoto.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(photo.url)}
                      alt={`Photo ${idx + 1}`}
                      className="w-full rounded-lg"
                    />
                  ))}
                </div>

                {/* Caption */}
                {selectedPhoto.caption && (
                  <p className="text-gray-700 mb-4">{selectedPhoto.caption}</p>
                )}

                {/* Tags */}
                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedPhoto.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 mb-4 pb-4 border-b">
                  <button
                    onClick={() => handleLike(selectedPhoto._id)}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                  >
                    ❤️ {selectedPhoto.likesCount} Likes
                  </button>
                  <button
                    onClick={() => initiateDelete(selectedPhoto._id)}
                    className="ml-auto text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Comments ({selectedPhoto.commentsCount})
                  </h3>

                  <div className="space-y-3 mb-4">
                    {selectedPhoto.comments.map((comment: any) => (
                      <div key={comment._id} className="flex gap-2">
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-900">
                            {comment.userId.name}
                          </p>
                          <p className="text-sm text-gray-700">{comment.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment(selectedPhoto._id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(selectedPhoto._id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
