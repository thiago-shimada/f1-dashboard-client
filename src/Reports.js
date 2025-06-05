import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserHeader from './UserHeader';
import { fetchWithAuth, logout } from './utils/api';

function Reports() {
  const [reports, setReports] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [executingReport, setExecutingReport] = useState(null);
  const [reportResults, setReportResults] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [reportParams, setReportParams] = useState({});
  
  const navigate = useNavigate();

  // Helper function to format cell values, especially PostgreSQL intervals
  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Handle PostgreSQL interval objects
    if (typeof value === 'object' && value !== null) {
      // Check if it's an interval-like object
      if (value.days !== undefined || value.hours !== undefined || value.minutes !== undefined || value.seconds !== undefined) {
        const parts = [];
        if (value.days) parts.push(`${value.days}d`);
        if (value.hours) parts.push(`${value.hours}h`);
        if (value.minutes) parts.push(`${value.minutes}m`);
        if (value.seconds) parts.push(`${value.seconds}s`);
        if (value.milliseconds) parts.push(`${value.milliseconds}ms`);
        return parts.length > 0 ? parts.join(' ') : '0';
      }
      
      // For other objects, try to stringify safely
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  };

  useEffect(() => {
    fetchReports();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/reports');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch reports');
      }
      const data = await response.json();
      setReports(data.reports);
      setUserRole(data.userRole);
      setError('');
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
      if (err.message.includes('Unauthorized')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const executeReport = async (reportId, params = {}) => {
    try {
      setExecutingReport(reportId);
      setError('');
      
      const response = await fetchWithAuth('/api/reports/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          params
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to execute report');
      }
      
      const data = await response.json();
      setReportResults(prev => ({
        ...prev,
        [reportId]: data
      }));
      
    } catch (err) {
      console.error('Error executing report:', err);
      setError(err.message);
    } finally {
      setExecutingReport(null);
    }
  };

  const handleLogout = () => {
    logout(navigate);
  };

  const openDetailModal = (reportData) => {
    setModalData(reportData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  const handleParamChange = (reportId, paramName, value) => {
    setReportParams(prev => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [paramName]: value
      }
    }));
  };

  const renderTable = (data, reportId) => {
    if (!data || !data.columns || !data.data || data.data.length === 0) {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Nenhum dado disponível para este relatório
        </div>
      );
    }

    const showFirst5 = data.data.length > 5;
    const displayData = showFirst5 ? data.data.slice(0, 5) : data.data;

    return (
      <div className="overflow-x-auto mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-600">
            {data.data.length} resultado{data.data.length !== 1 ? 's' : ''} encontrado{data.data.length !== 1 ? 's' : ''}
          </span>
          {showFirst5 && (
            <button
              onClick={() => openDetailModal(data)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-medium transition duration-150 ease-in-out"
            >
              Ver Todos →
            </button>
          )}
        </div>
        
        <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {data.columns.map((column, columnIndex) => (
                <th
                  key={`${column}-${columnIndex}`}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {data.columns.map((column, columnIndex) => (
                  <td
                    key={`${column}-${columnIndex}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                  >
                    {row[column] !== null && row[column] !== undefined 
                      ? formatCellValue(row[column]) 
                      : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {showFirst5 && (
          <div className="bg-gray-50 px-4 py-3 text-center">
            <p className="text-sm text-gray-600">
              Mostrando os primeiros 5 resultados. 
              <button 
                onClick={() => openDetailModal(data)}
                className="text-indigo-600 hover:text-indigo-800 font-medium ml-1"
              >
                Clique em "Ver Todos" para visualizar todos os resultados.
              </button>
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderReportCard = (report) => {
    const result = reportResults[report.id];
    const isExecuting = executingReport === report.id;
    const params = reportParams[report.id] || {};

    return (
      <div key={report.id} className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">{report.name}</h3>
            <div className="flex space-x-3">
              {report.requiresParams && report.params.map((param) => (
                <div key={param.name} className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    {param.label}:
                  </label>
                  <input
                    type={param.type || 'text'}
                    value={params[param.name] || ''}
                    onChange={(e) => handleParamChange(report.id, param.name, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={param.placeholder}
                  />
                </div>
              ))}
              <button
                onClick={() => executeReport(report.id, params)}
                disabled={isExecuting || (report.requiresParams && report.params.some(p => p.required && !params[p.name]))}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isExecuting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Executando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6 4h6" />
                    </svg>
                    Executar Relatório
                  </>
                )}
              </button>
            </div>
          </div>
          {report.description && (
            <p className="mt-2 text-sm text-gray-600">{report.description}</p>
          )}
        </div>
        
        <div className="px-6 py-4">
          {result && renderTable(result, report.id)}
          {!result && !isExecuting && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Clique em "Executar Relatório" para ver os resultados
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal || !modalData) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-4 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Resultados Completos do Relatório</h3>
            <button
              onClick={closeModal}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded text-sm"
            >
              ✕
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {modalData.columns.map((column, columnIndex) => (
                    <th
                      key={`${column}-${columnIndex}`}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modalData.data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {modalData.columns.map((column, columnIndex) => (
                      <td
                        key={`${column}-${columnIndex}`}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                      >
                        {row[column] !== null && row[column] !== undefined 
                          ? formatCellValue(row[column]) 
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <UserHeader userRole={userRole} onLogout={handleLogout} title="Relatórios" />
        
        {/* Navigation Section */}
        <div className="bg-indigo-500 px-6 py-3">
          <Link 
            to="/dashboard"
            className="bg-indigo-400 hover:bg-indigo-300 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 focus:ring-offset-indigo-500 transition duration-150 ease-in-out inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Dashboard
          </Link>
        </div>

        <main className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              Erro: {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Carregando relatórios...</span>
            </div>
          ) : reports.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">
                  Relatórios disponíveis para {userRole === 'admin' || userRole === 'Administrador' ? 'Administrador' : 
                                                   userRole === 'escuderia' || userRole === 'Escuderia' ? 'Escuderia' : 
                                                   userRole === 'piloto' || userRole === 'Piloto' ? 'Piloto' : userRole}
                </h3>
              </div>
              {reports.map(report => renderReportCard(report))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum relatório disponível para o seu perfil.</p>
            </div>
          )}
        </main>
      </div>
      
      {renderModal()}
    </div>
  );
}

export default Reports;
