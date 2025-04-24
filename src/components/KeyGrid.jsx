import React from 'react';

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
  const handleKeyClick = (boxId) => {
    const company = window.location.pathname.split('/')[1]?.toUpperCase() || 'ALPHA1';
    
    // Check if key is permanently missing
    if (MISSING_KEYS[company]?.includes(boxId)) {
      return; // Do nothing for permanently missing keys
    }
    
    // Toggle status between True and False
    const currentStatus = keys[boxId];
    const newStatus = currentStatus === 'True' ? 'False' : 'True';
    
    onUpdateStatus(boxId, newStatus);
  };

  const getKeyClass = (boxId, status) => {
    const company = window.location.pathname.split('/')[1]?.toUpperCase() || 'ALPHA1';
    
    // Check if key is permanently missing
    if (MISSING_KEYS[company]?.includes(parseInt(boxId))) {
      return "bg-gray-600 border-gray-500";
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
    <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
      {keyIds.map(boxId => {
        const status = keys[boxId] || 'True';
        const isClassroomKey = boxId >= 51 && boxId <= 54;
        const company = window.location.pathname.split('/')[1]?.toUpperCase() || 'ALPHA1';
        const isPermanentlyMissing = MISSING_KEYS[company]?.includes(boxId);
        
        return (
          <button
            key={boxId}
            onClick={() => handleKeyClick(boxId)}
            disabled={status === 'Missing' || isPermanentlyMissing}
            className={`
              flex items-center justify-center h-14
              rounded border font-semibold text-white
              ${getKeyClass(boxId, status)}
            `}
          >
            <span>{boxId}</span>
            {isClassroomKey && (
              <span className="text-xs ml-1 opacity-70">(L{boxId - 50})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default KeyGrid; 