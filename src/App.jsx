import React, { useState, useEffect } from 'react';
import KeyGrid from './components/KeyGrid';
import CompanyNav from './components/CompanyNav';
import ReportButton from './components/ReportButton';
import Toast from './components/Toast';

// Get API URL from environment variables or use default for local development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [currentCompany, setCurrentCompany] = useState('ALPHA1');
  const [keys, setKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Fetch keys for the current company
  useEffect(() => {
    const fetchKeys = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/keys/${currentCompany.toLowerCase()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch keys');
        }
        const data = await response.json();
        setKeys(data);
        setError(null);
      } catch (err) {
        setError('Error loading keys. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, [currentCompany]);

  // Update key status
  const updateKeyStatus = async (boxId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/keys/${currentCompany.toLowerCase()}/${boxId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update key status');
      }
      
      // Update local state
      setKeys(prevKeys => ({
        ...prevKeys,
        [boxId]: status,
      }));
      
      return true;
    } catch (err) {
      setToast({
        show: true,
        message: err.message,
        type: 'error',
      });
      console.error(err);
      return false;
    }
  };

  // Generate and copy report
  const generateReport = async () => {
    try {
      setToast({
        show: true,
        message: 'Generating report...',
        type: 'info',
      });
      
      const response = await fetch(`${API_URL}/api/report`);
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const data = await response.json();
      const reportText = data.report;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(reportText).then(
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
          // Show modal with report text (would implement in a real app)
          alert(reportText);
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