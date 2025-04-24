import React, { useState, useEffect } from 'react';
import KeyGrid from './components/KeyGrid';
import CompanyNav from './components/CompanyNav';
import ReportButton from './components/ReportButton';
import Toast from './components/Toast';

// In-memory data store for keys
const generateInitialData = () => {
  const companies = ['ALPHA1', 'ALPHA2', 'ALPHA3', 'ALPHA4', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT'];
  const data = {};
  
  // Create initial keys (all available)
  companies.forEach(company => {
    data[company] = {};
    for (let i = 1; i <= 54; i++) {
      data[company][i] = 'True';
    }
  });
  
  // Set permanently missing keys
  const missingKeys = {
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
  
  // Apply missing keys
  Object.entries(missingKeys).forEach(([company, keys]) => {
    keys.forEach(key => {
      data[company][key] = 'Missing';
    });
  });
  
  return data;
};

// Load initial data or from localStorage if available
const loadInitialData = () => {
  try {
    const savedData = localStorage.getItem('keyData');
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (e) {
    console.error('Error loading data from localStorage:', e);
  }
  return generateInitialData();
};

function App() {
  const [currentCompany, setCurrentCompany] = useState('ALPHA1');
  const [allKeys, setAllKeys] = useState(loadInitialData);
  const [keys, setKeys] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Set current company's keys when company changes
  useEffect(() => {
    setKeys(allKeys[currentCompany] || {});
  }, [currentCompany, allKeys]);

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem('keyData', JSON.stringify(allKeys));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [allKeys]);

  // Update key status
  const updateKeyStatus = async (boxId, status) => {
    try {
      // Check if key is permanently missing
      const missingKeys = {
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
      
      const isPermanentlyMissing = missingKeys[currentCompany]?.includes(Number(boxId));
      if (isPermanentlyMissing) {
        setToast({
          show: true,
          message: "Cannot update permanently missing key",
          type: 'error',
        });
        return false;
      }
      
      // Update local state
      setAllKeys(prev => ({
        ...prev,
        [currentCompany]: {
          ...prev[currentCompany],
          [boxId]: status
        }
      }));
      
      setToast({
        show: true,
        message: `Key ${boxId} ${status === 'True' ? 'returned' : 'drawn out'}`,
        type: 'success',
      });
      
      return true;
    } catch (err) {
      setToast({
        show: true,
        message: err.message || "Error updating key status",
        type: 'error',
      });
      console.error(err);
      return false;
    }
  };

  // Generate report locally
  const generateReport = async () => {
    try {
      setToast({
        show: true,
        message: 'Generating report...',
        type: 'info',
      });
      
      const today = new Date();
      let report = "Key Status Report\n";
      report += `Date: ${today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}\n`;
      report += `Day: ${today.toLocaleDateString('en-GB', { weekday: 'long' })}\n\n`;
      
      const companies = ['ALPHA1', 'ALPHA2', 'ALPHA3', 'ALPHA4', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT'];
      
      for (const coy of companies) {
        const totalKeys = 54;
        const drawnKeys = [];
        const missingKeys = [];
        const classroomKeysDrawn = [];
        
        // Process keys
        Object.entries(allKeys[coy] || {}).forEach(([boxId, status]) => {
          const boxIdNum = Number(boxId);
          if (status === 'False') { // Drawn
            drawnKeys.push(boxIdNum);
            if (boxIdNum >= 51 && boxIdNum <= 54) {
              const level = boxIdNum - 50;
              classroomKeysDrawn.push(`• Level ${level} classroom`);
            }
          } else if (status === 'Missing') {
            missingKeys.push(boxIdNum);
          }
        });
        
        // Sort for consistent display
        drawnKeys.sort((a, b) => a - b);
        missingKeys.sort((a, b) => a - b);
        
        const holdingKeys = totalKeys - drawnKeys.length - missingKeys.length;
        
        // Add to report
        report += `${coy} – ${totalKeys} keys in total ✅\n`;
        report += `Currently holding: ${holdingKeys} keys\n`;
        report += `Drawn: ${formatLineNumbers(drawnKeys)} (${drawnKeys.length} keys)\n`;
        report += `Missing: ${formatLineNumbers(missingKeys)} (${missingKeys.length} keys)\n`;
        
        if (classroomKeysDrawn.length > 0) {
          report += "Classroom keys drawn:\n";
          classroomKeysDrawn.sort().forEach(key => {
            report += `${key}\n`;
          });
        }
        
        report += "\n";
      }
      
      // Copy to clipboard
      await navigator.clipboard.writeText(report).then(
        () => {
          setToast({
            show: true,
            message: 'Report copied to clipboard!',
            type: 'success',
          });
        },
        () => {
          // Fallback if clipboard API fails
          setToast({
            show: true,
            message: 'Please copy the report manually',
            type: 'warning',
          });
          // Show modal with report text
          alert(report);
        }
      );
    } catch (err) {
      setToast({
        show: true,
        message: 'Error generating report',
        type: 'error',
      });
      console.error(err);
    }
  };
  
  // Helper function to format line numbers like "1-3, 5, 7-9"
  const formatLineNumbers = (nums) => {
    if (!nums || nums.length === 0) return "None";
    
    nums = [...nums].sort((a, b) => a - b);
    const ranges = [];
    let rangeStart = nums[0];
    let rangeEnd = nums[0];
    
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === rangeEnd + 1) {
        rangeEnd = nums[i];
      } else {
        ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
        rangeStart = rangeEnd = nums[i];
      }
    }
    
    ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
    return ranges.join(', ');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <header className="py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-green-400 pl-4">{currentCompany} KEYS</h2>
            <div className="flex justify-end space-x-4 pr-4 pt-1">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span className="text-sm">Drawn</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
                <span className="text-sm">Missing</span>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading keys...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <KeyGrid keys={keys} onUpdateStatus={updateKeyStatus} />
          )}

          <div className="border-t border-gray-800">
            <CompanyNav currentCompany={currentCompany} onSelectCompany={setCurrentCompany} />
          </div>
          
          <div className="p-4 border-t border-gray-800">
            <ReportButton onGenerateReport={generateReport} />
          </div>
        </div>

        <footer className="text-center text-gray-500 text-xs py-8">
          <p className="mb-1">Made by 197 OBIC Irfan Mirzan</p>
          <p>Kindly PayNow to <span className="text-green-400">84810703</span></p>
        </footer>
      </div>
      
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({...toast, show: false})}
      />
    </div>
  );
}

export default App; 