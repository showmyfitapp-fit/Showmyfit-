import React from 'react';

const EnvTest: React.FC = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800">Environment Variable Test</h3>
      <p className="text-yellow-700">
        VITE_GOOGLE_MAPS_API_KEY: {apiKey || 'NOT FOUND'}
      </p>
      <p className="text-yellow-700">
        All env vars: {JSON.stringify(import.meta.env, null, 2)}
      </p>
    </div>
  );
};

export default EnvTest;
