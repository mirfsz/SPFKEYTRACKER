import React, { useState, useEffect } from 'react';

const CompanyNav = ({ currentCompany, onSelectCompany }) => {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Track window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowDropdown(false); // Close dropdown on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const companies = [
    ['ALPHA1', 'ALPHA2', 'ALPHA3', 'ALPHA4'],
    ['BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT']
  ];
  
  // Flatten array for mobile dropdown
  const allCompanies = companies.flat();

  // Handle company selection
  const selectCompany = (company) => {
    onSelectCompany(company);
    setShowDropdown(false); // Close dropdown after selection
  };

  // Mobile dropdown view
  if (isMobileView) {
    return (
      <div className="p-2">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between px-4 py-2 bg-blue-900 text-white rounded border border-blue-800"
          >
            <span>{currentCompany}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-blue-950 border border-blue-900 rounded-md shadow-lg">
              {allCompanies.map(company => (
                <button
                  key={company}
                  onClick={() => selectCompany(company)}
                  className={`
                    w-full text-left px-4 py-3 text-sm
                    ${currentCompany === company 
                      ? 'bg-blue-800 text-white' 
                      : 'text-gray-300 hover:bg-blue-900'
                    }
                    ${company.startsWith('ALPHA') ? 'border-l-4 border-blue-500' : ''}
                  `}
                >
                  {company}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop view with buttons
  return (
    <div className="p-4">
      <div className="flex flex-col space-y-2">
        {companies.map((row, idx) => (
          <div key={idx} className="flex flex-wrap gap-2 justify-center">
            {row.map(company => (
              <button
                key={company}
                onClick={() => onSelectCompany(company)}
                className={`
                  px-6 py-2 rounded text-sm font-semibold transition-colors 
                  ${currentCompany === company 
                    ? 'bg-blue-900 text-white border border-blue-800' 
                    : 'bg-blue-950 text-gray-300 border border-blue-900 hover:bg-blue-900'
                  }
                `}
              >
                {company}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyNav; 