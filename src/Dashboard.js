import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserHeader from './UserHeader';

function Dashboard() {
  const [views, setViews] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchViews();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchViews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/views');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch views');
      }
      const data = await response.json();
      console.log('Fetched views:', data);
      setViews(data.views);
      setUserRole(data.userRole);
      setError('');
    } catch (err) {
      console.error('Error fetching views:', err);
      setError(err.message);
      if (err.message.includes('Unauthorized')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/logout', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.message || 'Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    }
  };

  // Modal management functions
  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
    setFormData({});
    setSearchResults([]);
    setError('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setFormData({});
    setSearchResults([]);
    setActionLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFormData(prev => ({
      ...prev,
      file: file
    }));
  };

  // Form submission handlers
  const handleInsertDriver = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao inserir piloto');
      }
      
      await response.json();
      alert('Piloto inserido com sucesso!');
      closeModal();
      // Refresh views
      fetchViews();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInsertConstructor = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch('/api/constructors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao inserir construtor');
      }
      
      await response.json();
      alert('Construtor inserido com sucesso!');
      closeModal();
      // Refresh views
      fetchViews();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearchDrivers = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/search-drivers?surname=${encodeURIComponent(formData.surname)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha na busca de pilotos');
      }
      
      const result = await response.json();
      setSearchResults(result.drivers || []);
      setError('');
    } catch (err) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Por favor, selecione um arquivo');
      return;
    }
    
    setActionLoading(true);
    setError('');
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      
      const response = await fetch('/api/upload-drivers', {
        method: 'POST',
        body: uploadFormData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Provide specific error messages based on status code
        let errorMessage = errorData.message || 'Falha no upload do arquivo';
        
        if (response.status === 409) {
          errorMessage = `❌ Conflito de dados: ${errorData.message}\n\nAlguns pilotos podem já existir no banco de dados.`;
        } else if (response.status === 400) {
          if (errorData.message.includes('format')) {
            errorMessage = `❌ Formato inválido: ${errorData.message}\n\nVerifique se o arquivo CSV está no formato correto:\ndriverref,code,forename,surname,dob,nationality,number,url`;
          } else {
            errorMessage = `❌ Dados inválidos: ${errorData.message}`;
          }
        } else if (response.status === 403) {
          errorMessage = `🚫 Acesso negado: ${errorData.message}`;
        } else if (response.status === 500) {
          errorMessage = `⚠️ Erro do servidor: ${errorData.message}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Create detailed success message from the new response format
      const successMessage = `✅ ${result.message}

📁 Arquivo: ${result.fileName || 'arquivo'}
📊 Linhas estimadas: ${result.estimatedRows || 0}
✔️ Pilotos inseridos: ${result.inserted || 0}
⏭️ Registros ignorados: ${result.skipped || 0}
🚀 Método: ${result.uploadMethod || 'Upload padrão'}

${result.inserted > 0 ? `Sucesso! ${result.inserted} piloto(s) adicionado(s) ao banco de dados.` : 'Nenhum piloto novo foi adicionado.'}`;
      
      alert(successMessage);
      closeModal();
      // Refresh views
      fetchViews();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': 
      case 'Administrador': 
        return 'Administrador';
      case 'escuderia': 
      case 'Escuderia': 
        return 'Escuderia';
      case 'piloto': 
      case 'Piloto': 
        return 'Piloto';
      default: return role;
    }
  };

  // Render action buttons based on user role
  const renderActionButtons = () => {
    if (userRole === 'admin' || userRole === 'Administrador') {
      return (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            to="/reports"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Relatórios
          </Link>
          <button
            onClick={() => openModal('insertDriver')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Inserir Novo Piloto
          </button>
          <button
            onClick={() => openModal('insertConstructor')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Inserir Novo Construtor
          </button>
        </div>
      );
    } else if (userRole === 'escuderia' || userRole === 'Escuderia') {
      return (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            to="/reports"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Relatórios
          </Link>
          <button
            onClick={() => openModal('searchDrivers')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar Pilotos por Sobrenome
          </button>
          <button
            onClick={() => openModal('uploadFile')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Inserir Pilotos de Arquivo
          </button>
        </div>
      );
    } else if (userRole === 'piloto' || userRole === 'Piloto') {
      return (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            to="/reports"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Relatórios
          </Link>
        </div>
      );
    }
    return null;
  };

  // Render modals based on modal type
  const renderModal = () => {
    if (!modalOpen) return null;

    const modalContent = () => {
      switch (modalType) {
        case 'insertDriver':
          return (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inserir Novo Piloto</h3>
              <form onSubmit={handleInsertDriver} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Ref</label>
                  <input
                    type="text"
                    required
                    value={formData.driverRef || ''}
                    onChange={(e) => handleInputChange('driverRef', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input
                    type="number"
                    required
                    value={formData.number || ''}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.forename || ''}
                    onChange={(e) => handleInputChange('forename', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
                  <input
                    type="text"
                    required
                    value={formData.surname || ''}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date" 
                    required
                    value={formData.dob || ''}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidade</label>
                  <input
                    type="text"
                    required
                    value={formData.nationality || ''}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-150 ease-in-out"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
                  >
                    {actionLoading ? 'Inserindo...' : 'Inserir Piloto'}
                  </button>
                </div>
              </form>
            </div>
          );

        case 'insertConstructor':
          return (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inserir Novo Construtor</h3>
              <form onSubmit={handleInsertConstructor} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Constructor Ref</label>
                  <input
                    type="text"
                    required
                    value={formData.constructorRef || ''}
                    onChange={(e) => handleInputChange('constructorRef', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidade</label>
                  <input
                    type="text"
                    required
                    value={formData.nationality || ''}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    required
                    value={formData.url || ''}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-150 ease-in-out"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
                  >
                    {actionLoading ? 'Inserindo...' : 'Inserir Construtor'}
                  </button>
                </div>
              </form>
            </div>
          );

        case 'searchDrivers':
          return (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Buscar Pilotos por Sobrenome</h3>
              <form onSubmit={handleSearchDrivers} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
                  <input
                    type="text"
                    required
                    value={formData.surname || ''}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Digite o sobrenome do piloto"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-150 ease-in-out"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
                  >
                    {actionLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </form>

              {searchResults.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Resultados da Busca ({searchResults.length} encontrados)
                  </h4>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Nasc.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nacionalidade</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {searchResults.map((driver, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-700">{driver['Nome']}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {driver['Data de Nascimento'] ? new Date(driver['Data de Nascimento']).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">{driver['Nacionalidade'] || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );

        case 'uploadFile':
          return (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inserir Pilotos de Arquivo</h3>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Arquivo</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato aceito: CSV apenas<br/>
                    Colunas esperadas: driverref,code,forename,surname,dob,nationality,number,url
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-150 ease-in-out"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !formData.file}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
                  >
                    {actionLoading ? 'Enviando...' : 'Enviar Arquivo'}
                  </button>
                </div>
              </form>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Erro: {error}
            </div>
          )}
          {modalContent()}
        </div>
      </div>
    );
  };

  const renderTable = (view) => {
    if (view.error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Erro ao carregar {view.name}: {view.error}
        </div>
      );
    }

    if (!view.data || view.data.length === 0) {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Nenhum dado disponível para {view.name}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto mb-8">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold text-gray-800 capitalize">
            {view.name.replace(/_/g, ' ')}
          </h4>
          <Link 
            to={`/view/${view.name}`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Ver Todos ({view.data.length}+ registros) →
          </Link>
        </div>
        <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {view.columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {view.data.slice(0, 5).map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {view.columns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                  >
                    {row[column] !== null && row[column] !== undefined 
                      ? String(row[column]) 
                      : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {view.data.length > 5 && (
          <div className="bg-gray-50 px-4 py-3 text-center">
            <p className="text-sm text-gray-600">
              Mostrando as primeiras 5 linhas. 
              <Link 
                to={`/view/${view.name}`}
                className="text-indigo-600 hover:text-indigo-800 font-medium ml-1"
              >
                Clique em "Ver Todos" para visualizar todos os registros com paginação.
              </Link>
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <UserHeader userRole={userRole} onLogout={handleLogout} />

        <main className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              Erro: {error}
            </div>
          )}
          
          {/* Render action buttons before the content */}
          {renderActionButtons()}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Carregando Views do dashboard...</span>
            </div>
          ) : views.length > 0 ? (
            <div className="space-y-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                Dashboards disponíveis para {getRoleDisplayName(userRole)}
              </h3>
              {views.map((view) => renderTable(view))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhuma visualização disponível para o seu perfil.</p>
            </div>
          )}

          {renderModal()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
