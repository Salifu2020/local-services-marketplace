import { useState, useEffect } from 'react';

/**
 * Custom hook for better mobile keyboard handling
 * Provides utilities for managing keyboard visibility and input focus
 */
export function useMobileKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    // Detect keyboard visibility by monitoring viewport height changes
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = viewportHeight - currentHeight;
      
      // If viewport shrinks significantly (usually > 150px), keyboard is likely open
      if (heightDifference > 150) {
        setIsKeyboardVisible(true);
      } else if (heightDifference < -50) {
        // Viewport expanded, keyboard likely closed
        setIsKeyboardVisible(false);
      }
      
      setViewportHeight(currentHeight);
    };

    window.addEventListener('resize', handleResize);
    
    // Also check on focus/blur events
    const handleFocus = () => {
      // Small delay to allow keyboard to appear
      setTimeout(() => {
        const currentHeight = window.innerHeight;
        if (viewportHeight - currentHeight > 150) {
          setIsKeyboardVisible(true);
        }
      }, 300);
    };

    const handleBlur = () => {
      setTimeout(() => {
        setIsKeyboardVisible(false);
      }, 300);
    };

    // Add focus/blur listeners to all inputs
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      inputs.forEach((input) => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      });
    };
  }, [viewportHeight]);

  /**
   * Scroll input into view when keyboard appears
   */
  const scrollInputIntoView = (inputElement) => {
    if (!inputElement) return;

    // Wait for keyboard to appear
    setTimeout(() => {
      inputElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 300);
  };

  /**
   * Auto-focus and scroll input into view
   */
  const focusInput = (inputElement) => {
    if (!inputElement) return;
    
    inputElement.focus();
    scrollInputIntoView(inputElement);
  };

  return {
    isKeyboardVisible,
    scrollInputIntoView,
    focusInput,
  };
}

