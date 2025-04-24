import React from 'react';

const ReportButton = ({ onGenerateReport }) => {
  return (
    <button
      onClick={onGenerateReport}
      className="w-full max-w-md mx-auto block py-3 px-6 bg-green-900 text-white font-bold rounded border border-green-500 transition-all duration-200 hover:border-green-400"
    >
      <div className="flex items-center justify-center text-sm tracking-wider">
        GENERATE REPORT
      </div>
    </button>
  );
};

export default ReportButton; 