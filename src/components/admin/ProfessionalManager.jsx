import React, { useState, useEffect } from 'react';
import { auth, db, appId } from '../../firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';

function ProfessionalManager() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [selectedProfessionals, setSelectedProfessionals] = useState(new Set());
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const professionalsRef = collection(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals'
      );
      
      const q = query(professionalsRef, orderBy('serviceType', 'asc'));
      const snapshot = await getDocs(q);
      
      const professionalsList = [];
      snapshot.forEach((docSnapshot) => {
        professionalsList.push({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        });
      });
      
      setProfessionals(professionalsList);
    } catch (error) {
      console.error('Error fetching professionals:', error);
      showError('Failed to load professionals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (professionalId, professionalName) => {
    if (!window.confirm(`Are you sure you want to delete "${professionalName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(professionalId);
      
      // Delete the professional document
      const professionalRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        professionalId
      );
      
      await deleteDoc(professionalRef);
      
      // Remove from local state
      setProfessionals(professionals.filter(p => p.id !== professionalId));
      setSelectedProfessionals(prev => {
        const newSet = new Set(prev);
        newSet.delete(professionalId);
        return newSet;
      });
      
      showSuccess(`Professional "${professionalName}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting professional:', error);
      showError(`Failed to delete professional: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProfessionals.size === 0) {
      showError('Please select at least one professional to delete');
      return;
    }

    const count = selectedProfessionals.size;
    if (!window.confirm(`Are you sure you want to delete ${count} professional(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedProfessionals).map(async (professionalId) => {
        const professionalRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'professionals',
          professionalId
        );
        return deleteDoc(professionalRef);
      });

      await Promise.all(deletePromises);
      
      // Remove from local state
      setProfessionals(professionals.filter(p => !selectedProfessionals.has(p.id)));
      setSelectedProfessionals(new Set());
      
      showSuccess(`Successfully deleted ${count} professional(s)`);
    } catch (error) {
      console.error('Error bulk deleting professionals:', error);
      showError(`Failed to delete professionals: ${error.message}`);
    }
  };

  const toggleSelect = (professionalId) => {
    setSelectedProfessionals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(professionalId)) {
        newSet.delete(professionalId);
      } else {
        newSet.add(professionalId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedProfessionals.size === professionals.length) {
      setSelectedProfessionals(new Set());
    } else {
      setSelectedProfessionals(new Set(professionals.map(p => p.id)));
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Professional Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Manage and delete professional profiles. Total: {professionals.length}
          </p>
        </div>
        {selectedProfessionals.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Delete Selected ({selectedProfessionals.size})
          </button>
        )}
      </div>

      {professionals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👷</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            No Professionals Found
          </h3>
          <p className="text-gray-600 dark:text-slate-400">
            There are no professional profiles in the system.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {selectedProfessionals.size === professionals.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={fetchProfessionals}
              className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="space-y-3">
            {professionals.map((professional) => (
              <div
                key={professional.id}
                className={`p-4 rounded-lg border ${
                  selectedProfessionals.has(professional.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedProfessionals.has(professional.id)}
                      onChange={() => toggleSelect(professional.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                          {professional.serviceType || 'Professional'}
                        </h3>
                        {professional.hourlyRate && (
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            ${professional.hourlyRate.toFixed(2)}/hr
                          </span>
                        )}
                      </div>
                      {professional.location && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                          📍 {professional.location}
                        </p>
                      )}
                      {professional.bio && (
                        <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2">
                          {professional.bio}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                        ID: <span className="font-mono">{professional.id}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(professional.id, professional.serviceType || 'Professional')}
                    disabled={deleting === professional.id}
                    className="ml-4 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === professional.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ProfessionalManager;

