import React, { useState, useRef, useEffect } from 'react';

// Constant missing keys by company
const MISSING_KEYS = {
  'ALPHA1': [1, 3, 7, 12, 15],
  'ALPHA2': [2, 8, 11],
  'ALPHA3': [4, 9, 14, 22],
  'ALPHA4': [6, 13, 19],
  'BRAVO': [5, 17, 23, 31],
  'CHARLIE': [16, 25, 33],
  'DELTA': [21, 27, 35],
  'ECHO': [29, 37, 42],
  'FOXTROT': [32, 39, 44, 48]
};

const KeyGrid = ({ keys, onUpdateStatus }) => {
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStartKey, setSelectStartKey] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const gridRef = useRef(null);
  const touchMoveRef = useRef(null);

  // Track window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Setup touch event monitoring for the whole document
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!isSelecting || !touchMoveRef.current) return;
      
      // Get the touch position
      const touch = e.touches[0];
      
      // Find the element at the touch position
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Check if the element has a data-key attribute
      if (element && element.hasAttribute('data-key')) {
        const keyId = parseInt(element.getAttribute('data-key'));
        if (!isNaN(keyId)) {
          handleSelectionMove(keyId);
        }
      } else if (element) {
        // Look for parent with data-key attribute
        const keyButton = element.closest('[data-key]');
        if (keyButton) {
          const keyId = parseInt(keyButton.getAttribute('data-key'));
          if (!isNaN(keyId)) {
            handleSelectionMove(keyId);
          }
        }
      }
    };

    // Register for touch events on the document
    if (isMobileView) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isSelecting, isMobileView]);

  // Get current company
  const getCurrentCompany = () => {
    return window.location.pathname.split('/')[1]?.toUpperCase() || 'ALPHA1';
  };

  // Handle single key click
  const handleKeyClick = (boxId) => {
    const company = getCurrentCompany();
    
    // Check if key is permanently missing
    if (MISSING_KEYS[company]?.includes(boxId)) {
      return; // Do nothing for permanently missing keys
    }
    
    // If we have selected keys and not in selection mode, update all selected keys
    if (selectedKeys.length > 0 && !isSelecting) {
      // Toggle all selected keys to the opposite of the last clicked key's status
      const targetStatus = keys[boxId] === 'True' ? 'False' : 'True';
      updateSelectedKeys(targetStatus);
      return;
    }
    
    // Toggle status between True and False for single key
    const currentStatus = keys[boxId];
    const newStatus = currentStatus === 'True' ? 'False' : 'True';
    
    onUpdateStatus(boxId, newStatus);
  };

  // Start selection (mouse down or touch start)
  const handleSelectionStart = (boxId) => {
    const company = getCurrentCompany();
    
    // Don't start selection on permanently missing keys
    if (MISSING_KEYS[company]?.includes(boxId)) {
      return;
    }
    
    console.log('Selection started with key:', boxId);
    setIsSelecting(true);
    setSelectStartKey(boxId);
    setSelectedKeys([boxId]);
    
    // For touch events, store reference that selection is active
    touchMoveRef.current = true;
  };

  // Continue selection (mouse enter while selecting)
  const handleSelectionMove = (boxId) => {
    if (!isSelecting || !selectStartKey) return;
    
    const company = getCurrentCompany();
    
    // Don't include permanently missing keys
    if (MISSING_KEYS[company]?.includes(boxId)) {
      return;
    }
    
    console.log('Selection moved to key:', boxId);
    
    // Calculate range between start key and current key
    const start = Math.min(selectStartKey, boxId);
    const end = Math.max(selectStartKey, boxId);
    
    // Create array of selected keys within range, excluding missing keys
    const newSelectedKeys = [];
    for (let i = start; i <= end; i++) {
      if (!MISSING_KEYS[company]?.includes(i)) {
        newSelectedKeys.push(i);
      }
    }
    
    setSelectedKeys(newSelectedKeys);
  };

  // End selection (mouse up or touch end)
  const handleSelectionEnd = () => {
    if (isSelecting && selectedKeys.length > 0) {
      console.log('Selection ended with keys:', selectedKeys);
      // Prepare for bulk update but don't update yet - wait for user to click a button
      setIsSelecting(false);
      touchMoveRef.current = false;
    }
  };

  // Update all selected keys to specified status
  const updateSelectedKeys = (status) => {
    if (selectedKeys.length === 0) return;
    
    console.log(`Updating ${selectedKeys.length} keys to ${status}`);
    
    // Update each selected key
    selectedKeys.forEach(boxId => {
      if (keys[boxId] !== status) {
        onUpdateStatus(boxId, status);
      }
    });
    
    // Clear selection after update
    setSelectedKeys([]);
  };

  // Cancel selection
  const cancelSelection = () => {
    setSelectedKeys([]);
    setIsSelecting(false);
    setSelectStartKey(null);
    touchMoveRef.current = false;
  };

  // Get CSS class for a key based on its status and selection state
  const getKeyClass = (boxId, status) => {
    const company = getCurrentCompany();
    const isSelected = selectedKeys.includes(boxId);
    
    // Check if key is permanently missing
    if (MISSING_KEYS[company]?.includes(parseInt(boxId))) {
      return "bg-gray-600 border-gray-500";
    }
    
    // Selected keys get a highlight border
    if (isSelected) {
      return `${status === 'True' ? 'bg-green-800' : 'bg-red-800'} border-yellow-400 border-2`;
    }
    
    // Status-based classes
    if (status === 'True') {
      return "bg-green-950 border-green-800";
    } else if (status === 'False') {
      return "bg-red-900 border-red-800";
    } else if (status === 'Missing') {
      return "bg-gray-600 border-gray-500";
    }
    
    return "bg-green-950 border-green-800";
  };

  // Generate array of keys from 1 to 54
  const keyIds = Array.from({ length: 54 }, (_, i) => i + 1);

  return (
    <div>
      {/* Key grid with improved mobile responsiveness */}
      <div 
        ref={gridRef}
        className="p-2 md:p-4 grid grid-cols-6 md:grid-cols-9 gap-1 md:gap-3"
        onMouseUp={handleSelectionEnd}
        onMouseLeave={handleSelectionEnd}
        onTouchEnd={handleSelectionEnd}
      >
        {keyIds.map(boxId => {
          const status = keys[boxId] || 'True';
          const isClassroomKey = boxId >= 51 && boxId <= 54;
          const company = getCurrentCompany();
          const isPermanentlyMissing = MISSING_KEYS[company]?.includes(boxId);
          
          return (
            <button
              key={boxId}
              data-key={boxId}
              onClick={() => handleKeyClick(boxId)}
              onMouseDown={() => handleSelectionStart(boxId)}
              onMouseEnter={() => handleSelectionMove(boxId)}
              onTouchStart={() => handleSelectionStart(boxId)}
              disabled={status === 'Missing' || isPermanentlyMissing}
              className={`
                flex items-center justify-center
                ${isMobileView ? 'h-12 text-sm' : 'h-14'}
                rounded border font-semibold text-white
                ${getKeyClass(boxId, status)}
                ${isSelecting ? 'cursor-pointer' : ''}
                transition-colors duration-150
                touch-none
              `}
            >
              <span data-key={boxId}>{boxId}</span>
              {isClassroomKey && (
                <span className="text-xs ml-1 opacity-70" data-key={boxId}>(L{boxId - 50})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk action controls */}
      {selectedKeys.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-3 border-t border-gray-700 flex justify-center space-x-4 z-10">
          <span className="text-white self-center">
            {selectedKeys.length} keys selected
          </span>
          <button
            onClick={() => updateSelectedKeys('True')}
            className="px-4 py-2 bg-green-800 text-white rounded"
          >
            Make Available
          </button>
          <button
            onClick={() => updateSelectedKeys('False')}
            className="px-4 py-2 bg-red-800 text-white rounded"
          >
            Mark Drawn
          </button>
          <button
            onClick={cancelSelection}
            className="px-4 py-2 bg-gray-700 text-white rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default KeyGrid; 