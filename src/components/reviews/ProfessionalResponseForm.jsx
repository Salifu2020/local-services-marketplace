import React, { useState } from 'react';
import { auth, db, appId } from '../../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';

function ProfessionalResponseForm({ reviewId, professionalId, onResponseSubmitted }) {
  const { showSuccess, showError } = useToast();
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      showError('You must be logged in to respond');
      return;
    }

    // Verify user is the professional
    if (user.uid !== professionalId) {
      showError('Only the professional can respond to reviews');
      return;
    }

    if (!responseText.trim()) {
      showError('Please write a response');
      return;
    }

    setSubmitting(true);

    try {
      const reviewRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        professionalId,
        'reviews',
        reviewId
      );

      await updateDoc(reviewRef, {
        professionalResponse: {
          text: responseText.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      showSuccess('Response submitted successfully!');
      setResponseText('');
      
      if (onResponseSubmitted) {
        onResponseSubmitted();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      showError('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
        Respond to this review
      </label>
      <textarea
        id="response"
        value={responseText}
        onChange={(e) => setResponseText(e.target.value)}
        rows={3}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        placeholder="Thank the customer or address their concerns..."
        maxLength={500}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          {responseText.length}/500 characters
        </p>
        <button
          type="submit"
          disabled={submitting || !responseText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Response'}
        </button>
      </div>
    </form>
  );
}

export default ProfessionalResponseForm;


