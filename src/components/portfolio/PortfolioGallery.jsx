import React, { useState, useEffect } from 'react';
import { db, appId, storage } from '../../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';

/**
 * Portfolio Gallery Component
 * Displays professional's portfolio photos in a grid
 */
function PortfolioGallery({ professionalId, isOwner = false }) {
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!professionalId) return;

    const portfolioRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      professionalId,
      'portfolio'
    );

    const portfolioQuery = query(portfolioRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      portfolioQuery,
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setPortfolioItems(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching portfolio:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [professionalId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Portfolio Gallery</h2>
        {isOwner && <PortfolioUploadButton professionalId={professionalId} />}
      </div>

      {portfolioItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-600 mb-2">No portfolio items yet</p>
          {isOwner && (
            <p className="text-sm text-gray-500">Upload photos to showcase your work</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {portfolioItems.map((item) => (
            <PortfolioItem
              key={item.id}
              item={item}
              isOwner={isOwner}
              onDelete={() => {
                setPortfolioItems((prev) => prev.filter((p) => p.id !== item.id));
              }}
              onClick={() => setSelectedImage(item)}
            />
          ))}
        </div>
      )}

      {selectedImage && (
        <ImageLightbox
          image={selectedImage}
          images={portfolioItems}
          currentIndex={portfolioItems.findIndex((i) => i.id === selectedImage.id)}
          onClose={() => setSelectedImage(null)}
          onNext={() => {
            const currentIndex = portfolioItems.findIndex((i) => i.id === selectedImage.id);
            const nextIndex = (currentIndex + 1) % portfolioItems.length;
            setSelectedImage(portfolioItems[nextIndex]);
          }}
          onPrev={() => {
            const currentIndex = portfolioItems.findIndex((i) => i.id === selectedImage.id);
            const prevIndex = currentIndex === 0 ? portfolioItems.length - 1 : currentIndex - 1;
            setSelectedImage(portfolioItems[prevIndex]);
          }}
        />
      )}
    </div>
  );
}

/**
 * Portfolio Item Component
 */
function PortfolioItem({ item, isOwner, onDelete, onClick }) {
  const { showError } = useToast();
  const [imageError, setImageError] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;

    try {
      // Delete from Firestore
      const portfolioRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        item.professionalId,
        'portfolio',
        item.id
      );
      await deleteDoc(portfolioRef);

      // Delete from Storage
      if (item.imageUrl) {
        const imageRef = ref(storage, item.imageUrl);
        await deleteObject(imageRef);
      }

      onDelete();
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      showError('Failed to delete portfolio item');
    }
  };

  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
      <img
        src={item.imageUrl || item.thumbnailUrl}
        alt={item.title || 'Portfolio item'}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        onClick={onClick}
      />
      {imageError ? (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-2xl">📷</span>
        </div>
      ) : null}
      
      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white text-sm font-medium truncate">{item.title}</p>
          {item.description && (
            <p className="text-white/80 text-xs truncate">{item.description}</p>
          )}
        </div>
      )}

      {isOwner && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          aria-label="Delete portfolio item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Portfolio Upload Button Component
 */
function PortfolioUploadButton({ professionalId }) {
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showError(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError(`${file.name} is too large. Maximum 10MB per image.`);
        return;
      }
    }

    await withLoading(async () => {
      setUploading(true);
      try {
        for (const file of files) {
          await uploadPortfolioItem(professionalId, file);
        }
        showSuccess(`Successfully uploaded ${files.length} ${files.length === 1 ? 'photo' : 'photos'}`);
      } catch (error) {
        console.error('Error uploading portfolio item:', error);
        showError('Failed to upload portfolio item');
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id="portfolio-upload"
        disabled={uploading}
      />
      <label
        htmlFor="portfolio-upload"
        className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer ${
          uploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {uploading ? (
          <>
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            Uploading...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Photos
          </>
        )}
      </label>
    </>
  );
}

/**
 * Upload portfolio item to Firebase Storage and Firestore
 */
async function uploadPortfolioItem(professionalId, file, title = '', description = '') {
  try {
    // Compress image
    const compressedFile = await compressImage(file);

    // Upload to Firebase Storage
    const timestamp = Date.now();
    const fileName = `${professionalId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, `portfolio/${fileName}`);
    
    await uploadBytes(storageRef, compressedFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Create thumbnail (optional - for now use same image)
    const thumbnailUrl = imageUrl;

    // Save to Firestore
    const portfolioRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      professionalId,
      'portfolio'
    );

    await addDoc(portfolioRef, {
      professionalId,
      imageUrl,
      thumbnailUrl,
      title: title || file.name,
      description,
      serviceType: null, // Can be set later
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error uploading portfolio item:', error);
    throw error;
  }
}

/**
 * Compress image before upload
 */
function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: file.type }));
          },
          file.type,
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Image Lightbox Component for full-screen viewing
 */
function ImageLightbox({ image, images, currentIndex, onClose, onNext, onPrev }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onNext, onPrev]);

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-3"
              aria-label="Previous"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-3"
              aria-label="Next"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <img
          src={image.imageUrl}
          alt={image.title || 'Portfolio image'}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />

        {(image.title || image.description) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
            {image.title && <h3 className="text-white text-xl font-semibold mb-2">{image.title}</h3>}
            {image.description && <p className="text-white/90">{image.description}</p>}
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}

export default PortfolioGallery;

