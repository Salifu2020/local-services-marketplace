import React, { useState, useEffect } from 'react';
import { db, appId, storage } from '../../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';

/**
 * Document Sharing Component
 * Allows professionals to upload and share documents with customers
 */
function DocumentSharing({ professionalId, bookingId = null, isOwner = false, customerId = null }) {
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    if (!professionalId) return;

    // Determine collection path based on context
    const collectionPath = bookingId
      ? ['artifacts', appId, 'public', 'data', 'bookings', bookingId, 'documents']
      : ['artifacts', appId, 'public', 'data', 'professionals', professionalId, 'documents'];

    const documentsRef = collection(db, ...collectionPath);
    const documentsQuery = query(documentsRef, orderBy('uploadedAt', 'desc'));

    const unsubscribe = onSnapshot(
      documentsQuery,
      (snapshot) => {
        const docsList = [];
        snapshot.forEach((docSnapshot) => {
          docsList.push({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          });
        });
        setDocuments(docsList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching documents:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [professionalId, bookingId]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        showError(`${file.name} is not a supported file type`);
        return;
      }
      if (file.size > maxSize) {
        showError(`${file.name} is too large. Maximum 10MB per file.`);
        return;
      }
    }

    await withLoading(async () => {
      setUploading(true);
      try {
        for (const file of files) {
          await uploadDocument(file);
        }
        showSuccess(`Successfully uploaded ${files.length} ${files.length === 1 ? 'document' : 'documents'}`);
      } catch (error) {
        console.error('Error uploading document:', error);
        showError('Failed to upload document');
      } finally {
        setUploading(false);
        // Reset file input
        e.target.value = '';
      }
    });
  };

  const uploadDocument = async (file) => {
    try {
      // Determine storage path
      const storagePath = bookingId
        ? `documents/bookings/${bookingId}/${Date.now()}_${file.name}`
        : `documents/professionals/${professionalId}/${Date.now()}_${file.name}`;

      const storageRef = ref(storage, storagePath);

      // Upload file
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Determine Firestore collection path
      const collectionPath = bookingId
        ? ['artifacts', appId, 'public', 'data', 'bookings', bookingId, 'documents']
        : ['artifacts', appId, 'public', 'data', 'professionals', professionalId, 'documents'];

      const documentsRef = collection(db, ...collectionPath);

      // Save document metadata to Firestore
      await addDoc(documentsRef, {
        professionalId,
        bookingId: bookingId || null,
        customerId: customerId || null,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        downloadURL,
        storagePath,
        uploadedBy: professionalId,
        uploadedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const handleDelete = async (documentId, storagePath) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Determine collection path
      const collectionPath = bookingId
        ? ['artifacts', appId, 'public', 'data', 'bookings', bookingId, 'documents']
        : ['artifacts', appId, 'public', 'data', 'professionals', professionalId, 'documents'];

      const documentRef = doc(db, ...collectionPath, documentId);

      // Delete from Firestore
      await deleteDoc(documentRef);

      // Delete from Storage
      if (storagePath) {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      }

      showSuccess('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document');
    }
  };

  const handleDownload = (downloadURL, fileName) => {
    // Open in new tab for download
    window.open(downloadURL, '_blank');
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {bookingId ? 'Booking Documents' : 'Shared Documents'}
        </h2>
        {isOwner && (
          <>
            <input
              type="file"
              id="document-upload"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              disabled={uploading}
            />
            <label
              htmlFor="document-upload"
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
                  Upload Documents
                </>
              )}
            </label>
          </>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-gray-600 mb-2">No documents shared yet</p>
          {isOwner && (
            <p className="text-sm text-gray-500">Upload documents to share with customers</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <DocumentItem
              key={document.id}
              document={document}
              isOwner={isOwner}
              onDelete={() => handleDelete(document.id, document.storagePath)}
              onDownload={() => handleDownload(document.downloadURL, document.fileName)}
              onView={() => setSelectedDocument(document)}
              getFileIcon={getFileIcon}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}

/**
 * Document Item Component
 */
function DocumentItem({ document, isOwner, onDelete, onDownload, onView, getFileIcon, formatFileSize }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors group">
      <div className="flex items-center gap-4 flex-1">
        <div className="text-4xl">{getFileIcon(document.fileType)}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{document.fileName}</h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>{formatFileSize(document.fileSize)}</span>
            <span>•</span>
            <span>Uploaded {formatDate(document.uploadedAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
          title="View document"
        >
          View
        </button>
        <button
          onClick={onDownload}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          title="Download document"
        >
          Download
        </button>
        {isOwner && (
          <button
            onClick={onDelete}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium"
            title="Delete document"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Document Viewer Modal
 */
function DocumentViewer({ document, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const isImage = document.fileType?.startsWith('image/');
  const isPDF = document.fileType === 'application/pdf';

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{document.fileName}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <a
              href={document.downloadURL}
              download={document.fileName}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Download
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg overflow-hidden">
          {isImage ? (
            <img
              src={document.downloadURL}
              alt={document.fileName}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
          ) : isPDF ? (
            <iframe
              src={document.downloadURL}
              className="w-full h-[80vh] border-0"
              title={document.fileName}
            />
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-600 mb-4">Preview not available for this file type</p>
              <a
                href={document.downloadURL}
                download={document.fileName}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download to View
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentSharing;

