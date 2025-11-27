import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

function MyMessages() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    const userId = user.uid;

    const chatsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'chats'
    );

    // Query chats where participants array contains the current user's ID
    // Note: Firestore array-contains query
    const chatsQuery = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      async (snapshot) => {
        setLoading(false);
        setError(null);

        const chatsList = [];
        
        // Process each chat document
        for (const chatDoc of snapshot.docs) {
          const chatData = chatDoc.data();
          const bookingId = chatDoc.id;

          // Find the other participant's ID
          const otherParticipantId = chatData.participants.find(id => id !== userId);
          
          if (!otherParticipantId) continue;

          // Fetch other participant's name
          let participantName = 'Unknown User';
          let participantType = null;

          // Try professionals collection first
          const professionalRef = doc(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'professionals',
            otherParticipantId
          );

          const professionalDoc = await getDoc(professionalRef);

          if (professionalDoc.exists()) {
            const proData = professionalDoc.data();
            participantName = proData.serviceType || proData.name || 'Professional';
            participantType = 'professional';
          } else {
            // Try users collection
            const userRef = doc(
              db,
              'artifacts',
              appId,
              'public',
              'data',
              'users',
              otherParticipantId
            );

            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              participantName = userData.name || 'Customer';
              participantType = 'user';
            } else {
              participantName = `User ${otherParticipantId.substring(0, 8)}...`;
            }
          }

          // Fetch last message
          const messagesRef = collection(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'chats',
            bookingId,
            'messages'
          );

          const messagesQuery = query(
            messagesRef,
            orderBy('timestamp', 'desc'),
            limit(1)
          );

          let lastMessage = null;
          try {
            const messagesSnapshot = await getDocs(messagesQuery);
            if (!messagesSnapshot.empty) {
              const lastMsgDoc = messagesSnapshot.docs[0];
              const lastMsgData = lastMsgDoc.data();
              lastMessage = {
                text: lastMsgData.text,
                timestamp: lastMsgData.timestamp,
                senderId: lastMsgData.senderId,
              };
            }
          } catch (err) {
            console.error('Error fetching last message:', err);
          }

          chatsList.push({
            id: bookingId,
            bookingId: bookingId,
            otherParticipant: {
              id: otherParticipantId,
              name: participantName,
              type: participantType,
            },
            lastMessage: lastMessage,
            updatedAt: chatData.updatedAt,
          });
        }

        setChats(chatsList);
      },
      (err) => {
        console.error('onSnapshot error for chats:', err);
        setError(`Error loading chats: ${err.message}`);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Customer Portal
              </Link>
            </div>
          </div>
        </nav>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your messages...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Customer Portal
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Messages</h1>
          <p className="text-gray-600">Your active conversations</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-medium text-red-800 mb-1">Error Loading Messages</p>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chats List */}
        {!loading && !error && chats.length > 0 ? (
          <div className="space-y-3">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                to={`/chat/${chat.bookingId}`}
                className="block bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {chat.otherParticipant.name}
                      </h3>
                      {chat.otherParticipant.type === 'professional' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Pro
                        </span>
                      )}
                    </div>
                    
                    {chat.lastMessage ? (
                      <>
                        <p className="text-sm text-gray-700 truncate mb-1">
                          {chat.lastMessage.senderId === auth.currentUser?.uid ? (
                            <span className="text-gray-500">You: </span>
                          ) : null}
                          {chat.lastMessage.text}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatMessageTime(chat.lastMessage.timestamp)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No messages yet</p>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don't have any active conversations yet. Start chatting with a professional after booking a service!
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Find a Pro
              </Link>
              <Link
                to="/my-bookings"
                className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                View Bookings
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}

export default MyMessages;

