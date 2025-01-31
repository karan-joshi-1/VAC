import React, { useState, useEffect } from 'react';
import logo from './assets/logo-wl.png';

const App = () => {
  const [formData, setFormData] = useState({
    // Git Parameters
    repoLocation: '',
    branchName: '',
    fileName: '',
    commitId: '',
    
    // Training Parameters
    lr: '',
    betas: '',
    batch_size: '',
    epochs: '',
    globalE: '',
    
    // Data Parameters
    datasetPath: '',
    rowHogel: '',
    columnHogel: '',
    
    // Logging Parameters
    checkpointPath: '',
    logInterval: ''
  });

  // Track additional parameters separately
  const [additionalParams, setAdditionalParams] = useState({});

  const parameterGroups = {
    'Git Configuration': ['repoLocation', 'branchName', 'fileName', 'commitId'],
    'Training Parameters': ['lr', 'betas', 'batch_size', 'epochs', 'globalE'],
    'Data Configuration': ['datasetPath', 'rowHogel', 'columnHogel'],
    'Logging Settings': ['checkpointPath', 'logInterval']
  };

  const [runId, setRunId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('VMES: Vac ML Experimental System');

  useEffect(() => {
    document.title = title;
  }, [title]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (Object.keys(formData).includes(name)) {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    } else {
      setAdditionalParams(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const parseMLflowParams = (params) => {
    const parsedParams = {};
    params.forEach(param => {
      if (param.key === 'gitParams' || param.key === 'modelParams') {
        try {
          const jsonParams = JSON.parse(param.value.replace(/'/g, '"'));
          Object.assign(parsedParams, jsonParams);
        } catch (err) {
          console.error(`Error parsing ${param.key}:`, err);
        }
      } else {
        parsedParams[param.key] = param.value;
      }
    });
    return parsedParams;
  };

  const fetchMLflowParams = async () => {
    if (!runId.trim()) {
      setError('Please enter a valid Run ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://10.220.115.68:5000/api/2.0/mlflow/runs/get?run_id=${runId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data?.run?.data?.params) {
        throw new Error('Unexpected response structure from MLflow');
      }
      
      const mlflowParams = data.run.data.params;
      const parsedParams = parseMLflowParams(mlflowParams);
      
      // Separate known and additional parameters
      const updatedFormData = { ...formData };
      const additionalParamsData = {};

      Object.entries(parsedParams).forEach(([key, value]) => {
        if (Object.keys(formData).includes(key)) {
          updatedFormData[key] = value?.toString() || '';
        } else {
          additionalParamsData[key] = value?.toString() || '';
        }
      });

      setFormData(updatedFormData);
      setAdditionalParams(additionalParamsData);
    } catch (err) {
      setError(`Failed to fetch MLflow parameters: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty values from both formData and additionalParams
    const filteredData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const filteredAdditionalParams = Object.entries(additionalParams).reduce((acc, [key, value]) => {
      if (value.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    // Combine both sets of parameters
    const combinedData = {
      ...filteredData,
      ...(Object.keys(filteredAdditionalParams).length > 0 && { additionalParameters: filteredAdditionalParams })
    };
    
    // Only proceed if there are non-empty values
    if (Object.keys(combinedData).length === 0) {
      setError('No parameters to export. Please fetch or enter some values first.');
      return;
    }
    
    const jsonOutput = JSON.stringify(combinedData, null, 2);
    
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ml_ops_parameters.json';
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatParamName = (name) => {
    return name
      .split(/(?=[A-Z])|_/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative w-[60px] h-[40px]">
                <img
                  src={logo}
                  alt="VAC Lab Logo"
                  className="absolute inset-0 w-full h-full object-contain transform transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 hover:scale-105 transform transition-transform duration-300">
              VMES
            </h1>
            <h2 className="text-xl mb-4 text-gray-400 hover:text-gray-300 transition-colors duration-300">
              Vac ML Experimental System
            </h2>
          </div>
          
          <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600 transition-all duration-300 hover:bg-gray-700/40 hover:border-gray-500 transform hover:-translate-y-1 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 hover:scale-105 transform transition-transform duration-300">
              MLflow Configuration
            </h2>
            <div className="relative group transition-all duration-300 ease-in-out">
              <label htmlFor="runId" className="block mb-2 text-sm font-medium text-gray-300 transition-colors duration-300 group-hover:text-gray-200">
                Run ID
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex-grow">
                  <input
                    type="text"
                    id="runId"
                    value={runId}
                    onChange={(e) => setRunId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-gray-700/70 transform hover:scale-[1.02]"
                    placeholder="Enter MLflow Run ID"
                  />
                  <a 
                    href="http://10.220.115.68:5000/#/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-300"
                  >
                    Open MLflow Server UI ↗
                  </a>
                </div>
                <button
                  onClick={fetchMLflowParams}
                  disabled={loading}
                  className="mb-7 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 hover:scale-105 transform active:scale-95"
                >
                  {loading ? (
                    <span className="inline-block animate-pulse">Loading...</span>
                  ) : (
                    'Fetch Parameters'
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-red-400 text-sm animate-bounce">
                  {error}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {Object.entries(parameterGroups).map(([groupName, params], index) => (
              <div 
                key={groupName} 
                className="bg-gray-700/30 rounded-xl p-6 border border-gray-600 transition-all duration-300 hover:bg-gray-700/40 hover:border-gray-500 transform hover:-translate-y-1"
              >
                <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 hover:scale-105 transform transition-transform duration-300">
                  {groupName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {params.map((param) => (
                    <div key={param} className="relative group transition-all duration-300 ease-in-out">
                      <label htmlFor={param} className="block mb-2 text-sm font-medium text-gray-300 transition-colors duration-300 group-hover:text-gray-200">
                        {formatParamName(param)}
                      </label>
                      <input
                        type="text"
                        id={param}
                        name={param}
                        value={formData[param]}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-gray-700/70 transform hover:scale-[1.02]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Additional Parameters Section - Only shown when there are additional parameters */}
            {Object.keys(additionalParams).length > 0 && (
              <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600 transition-all duration-300 hover:bg-gray-700/40 hover:border-gray-500 transform hover:-translate-y-1">
                <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 hover:scale-105 transform transition-transform duration-300">
                  Additional Parameters
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(additionalParams).map((param) => (
                    <div key={param} className="relative group transition-all duration-300 ease-in-out">
                      <label htmlFor={param} className="block mb-2 text-sm font-medium text-gray-300 transition-colors duration-300 group-hover:text-gray-200">
                        {formatParamName(param)}
                      </label>
                      <input
                        type="text"
                        id={param}
                        name={param}
                        value={additionalParams[param]}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-gray-700/70 transform hover:scale-[1.02]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 active:scale-95"
            >
              <span className="inline-block transform hover:scale-105 transition-transform duration-300">
                Generate and Download JSON
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
