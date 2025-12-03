import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ChatMessageSkeleton, Skeleton } from '../components/Skeleton';

function ChatPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [chat, setChat] = useState(null);
  const [otherParticipant, setOtherParticipant] = useState(null);
  const [booking, setBooking] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch or create chat and listen to messages
  useEffect(() => {
    if (!bookingId) {
      setError('Booking ID is required');
      setLoading(false);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    const initializeChat = async () => {
      try {
        // Get booking to determine participants
        const bookingRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bookings',
          bookingId
        );

        const bookingDoc = await getDoc(bookingRef);

        if (!bookingDoc.exists()) {
          setError('Booking not found');
          setLoading(false);
          return;
        }

        const bookingData = bookingDoc.data();
        const participants = [bookingData.userId, bookingData.professionalId];
        setBooking(bookingData);

        // Determine the other participant's ID
        const otherParticipantId = user.uid === bookingData.userId 
          ? bookingData.professionalId 
          : bookingData.userId;

        // Fetch other participant's information
        let participantName = 'Unknown User';
        let participantType = null;

        // Try to fetch from professionals collection first
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
          // Try to fetch from users collection
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
            // Fallback: use participant ID
            participantName = `User ${otherParticipantId.substring(0, 8)}...`;
          }
        }

        setOtherParticipant({
          id: otherParticipantId,
          name: participantName,
          type: participantType,
        });

        // Check if chat exists, create if not
        const chatRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'chats',
          bookingId
        );

        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
          // Create chat document
          try {
            await setDoc(chatRef, {
              participants: participants,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            console.log('Chat document created successfully');
          } catch (createError) {
            console.error('Error creating chat document:', createError);
            // If creation fails due to permissions, try to continue anyway
            // The security rules might allow message creation even if chat doesn't exist
            if (createError.code === 'permission-denied') {
              console.warn('Chat creation failed due to permissions. This might be okay if rules allow message creation without chat document.');
            } else {
              throw createError;
            }
          }
        }

        // Set chat data
        const chatData = chatDoc.exists() ? chatDoc.data() : {
          participants: participants,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setChat({ id: bookingId, ...chatData });

        // Set up real-time listener for messages
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

        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const messagesList = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              messagesList.push({
                id: doc.id,
                ...data,
              });
            });
            setMessages(messagesList);
            setLoading(false);
          },
          (err) => {
            console.error('Error listening to messages:', err);
            setError('Failed to load messages');
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError(err.message || 'Failed to initialize chat');
        setLoading(false);
      }
    };

    initializeChat();
  }, [bookingId, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to send messages');
      return;
    }

    // Ensure chat document exists before sending message
    if (!chat) {
      setError('Chat not initialized. Please refresh the page.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Ensure chat document exists (double-check)
      const chatRefCheck = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'chats',
        bookingId
      );

      const chatDoc = await getDoc(chatRefCheck);
      if (!chatDoc.exists()) {
        // Try to create it again
        const bookingDoc = await getDoc(doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bookings',
          bookingId
        ));
        
        if (bookingDoc.exists()) {
          const bookingData = bookingDoc.data();
          const participants = [bookingData.userId, bookingData.professionalId];
          
          try {
            await setDoc(chatRef, {
              participants: participants,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (createError) {
            console.error('Failed to create chat document:', createError);
            if (createError.code === 'permission-denied') {
              setError('Permission denied: Unable to create chat. Please check Firestore security rules are deployed.');
              setSending(false);
              return;
            }
            throw createError;
          }
        }
      }

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

      await addDoc(messagesRef, {
        senderId: user.uid,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
      });

      // Update chat's updatedAt timestamp
      const chatRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'chats',
        bookingId
      );

      await setDoc(
        chatRef,
        { updatedAt: serverTimestamp() },
        { merge: true }
      );

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

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
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <>
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold text-gray-900">
                ExpertNextDoor
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="bg-white rounded-lg shadow-md h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <Skeleton variant="text" lines={2} className="h-6" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <ChatMessageSkeleton key={i} />
              ))}
            </div>
            <div className="p-3 sm:p-4 border-t border-gray-200">
              <Skeleton variant="button" className="h-12 w-full" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error && !chat) {
    return (
      <>
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold text-gray-900">
                ExpertNextDoor
              </Link>
            </div>
          </div>
        </nav>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  const currentUserId = auth.currentUser?.uid;
  const isCurrentUser = (senderId) => senderId === currentUserId;

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-gray-900">
              ExpertNextDoor
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/pro-dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow-md h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {otherParticipant ? (
                    <>
                      Chat with {otherParticipant.name}
                      {otherParticipant.type === 'professional' && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({booking?.serviceType || 'Professional'})
                        </span>
                      )}
                    </>
                  ) : (
                    'Chat'
                  )}
                </h1>
                {booking && (
                  <p className="text-sm text-gray-500 mt-1">
                    {booking.date && (
                      <>
                        {new Date(booking.date.toDate ? booking.date.toDate() : booking.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' • '}
                      </>
                    )}
                    {booking.time && (
                      <>
                        {(() => {
                          const [hours, minutes] = booking.time.split(':').map(Number);
                          const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                        })()}
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-gray-600 font-medium mb-1">No messages yet</p>
                  <p className="text-sm text-gray-500">Start the conversation by sending a message below!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isCurrentUser(message.senderId)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser(message.senderId)
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3 sm:p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-w-[80px]"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

export default ChatPage;

