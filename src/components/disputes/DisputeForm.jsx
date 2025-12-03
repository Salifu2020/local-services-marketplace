import React, { useState } from 'react';
import { auth, db, appId, storage } from '../../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';

/**
 * Dispute Form Component
 * Allows users to file disputes related to bookings
 */
function DisputeForm({ booking, onClose, onSubmitted }) {
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [disputeType, setDisputeType] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const disputeTypes = [
    { value: 'service_not_provided', label: 'Service Not Provided', description: 'Professional did not complete the service' },
    { value: 'poor_quality', label: 'Poor Quality Work', description: 'Service quality was below expectations' },
    { value: 'payment_issue', label: 'Payment Issue', description: 'Problem with payment or charges' },
    { value: 'scheduling_issue', label: 'Scheduling Issue', description: 'No-show, late arrival, or cancellation' },
    { value: 'damage', label: 'Property Damage', description: 'Damage occurred during service' },
    { value: 'behavior', label: 'Unprofessional Behavior', description: 'Inappropriate conduct or communication' },
    { value: 'other', label: 'Other', description: 'Other issue not listed' },
  ];

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 files
    if (evidence.length + files.length > 5) {
      showError('Maximum 5 files allowed');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
          throw new Error(`${file.name} is not a valid file type. Only images and PDFs are allowed.`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB.`);
        }

        // Compress images
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
          fileToUpload = await compressImage(file);
        }

        // Upload to Firebase Storage
        const user = auth.currentUser;
        const fileName = `disputes/${booking.id}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, fileToUpload);
        const downloadURL = await getDownloadURL(storageRef);

        return {
          name: file.name,
          url: downloadURL,
          type: file.type,
          size: file.size,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setEvidence([...evidence, ...uploadedFiles]);
      showSuccess(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading files:', error);
      showError(error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1920;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
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
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.8
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveEvidence = (index) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!disputeType) {
      showError('Please select a dispute type');
      return;
    }

    if (!description.trim() || description.trim().length < 20) {
      showError('Please provide a detailed description (at least 20 characters)');
      return;
    }

    await withLoading(async () => {
      setSubmitting(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }

        const disputesRef = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'disputes'
        );

        const disputeData = {
          bookingId: booking.id,
          professionalId: booking.professionalId,
          userId: booking.userId,
          filedBy: user.uid,
          disputeType,
          description: description.trim(),
          evidence,
          status: 'Pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(disputesRef, disputeData);

        // Update booking to mark as disputed
        const bookingRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bookings',
          booking.id
        );
        await updateDoc(bookingRef, {
          hasDispute: true,
          disputeStatus: 'Pending',
          updatedAt: serverTimestamp(),
        });

        showSuccess('Dispute filed successfully. Our team will review it shortly.');
        if (onSubmitted) {
          onSubmitted();
        }
        if (onClose) {
          onClose();
        }
      } catch (error) {
        console.error('Error filing dispute:', error);
        showError(error.message || 'Failed to file dispute. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }, 'Filing dispute...');
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">File a Dispute</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Booking Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Booking ID:</strong> {booking.id}</p>
            <p><strong>Date:</strong> {new Date(booking.date?.toDate?.() || booking.date).toLocaleDateString()}</p>
            {booking.time && <p><strong>Time:</strong> {booking.time}</p>}
            {booking.amount && <p><strong>Amount:</strong> ${booking.amount.toFixed(2)}</p>}
          </div>
        </div>

        {/* Dispute Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dispute Type <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {disputeTypes.map((type) => (
              <label
                key={type.value}
                className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  disputeType === type.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="disputeType"
                  value={type.value}
                  checked={disputeType === type.value}
                  onChange={(e) => setDisputeType(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Please provide a detailed description of the issue. Include dates, times, and any relevant information..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
            minLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/500 characters (minimum 20)
          </p>
        </div>

        {/* Evidence Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evidence (Optional)
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Upload photos, receipts, screenshots, or documents that support your dispute (max 5 files, 5MB each)
          </p>
          
          <input
            type="file"
            id="evidence"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            disabled={uploading || evidence.length >= 5}
            className="hidden"
          />
          <label
            htmlFor="evidence"
            className={`inline-block px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
              uploading || evidence.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Uploading...' : evidence.length >= 5 ? 'Maximum files reached' : '+ Upload Files'}
          </label>

          {/* Evidence Preview */}
          {evidence.length > 0 && (
            <div className="mt-4 space-y-2">
              {evidence.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-600 text-xs">PDF</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvidence(index)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !disputeType || !description.trim() || description.trim().length < 20}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? 'Submitting...' : 'File Dispute'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DisputeForm;

