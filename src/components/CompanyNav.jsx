import React from 'react';

const CompanyNav = ({ currentCompany, onSelectCompany }) => {
  const companies = [
    ['ALPHA1', 'ALPHA2', 'ALPHA3', 'ALPHA4'],
    ['BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT']
  ];

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
                  px-6 py-2 rounded text-sm font-semibold 
                  ${currentCompany === company 
                    ? 'bg-blue-900 text-white border border-blue-800' 
                    : 'bg-blue-950 text-gray-300 border border-blue-900'
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