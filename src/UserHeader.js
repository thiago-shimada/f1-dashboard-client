import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from './utils/api';

function UserHeader({ userRole, onLogout, showLogout = true, title = "Dashboard" }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth('/api/user-info');
        if (!response.ok) {
          throw new Error('Failed to fetch user information');
        }
        const data = await response.json();
        setUserInfo(data.userInfo);
        setError('');
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const getRoleDisplayName = (tipo) => {
    switch (tipo) {
      case 'Administrador': 
        return 'Administrador';
      case 'Escuderia': 
        return 'Escuderia';
      case 'Piloto': 
        return 'Piloto';
      default: return tipo;
    }
  };

  const renderUserSpecificInfo = () => {
    if (loading) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-200"></div>
          <span className="ml-2 text-indigo-200 text-sm">Carregando...</span>
        </div>
      );
    }

    if (error || !userInfo) {
      return (
        <p className="text-indigo-200 text-sm">
          Painel {getRoleDisplayName(userRole)}
        </p>
      );
    }

    switch (userInfo.tipo) {
      case 'Administrador':
        return (
          <div className="flex items-center space-x-2">
            {/* Admin Shield Icon */}
            <svg 
              className="w-5 h-5 text-yellow-300" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-indigo-200 text-sm font-medium">Administrador</p>
              <p className="text-indigo-100 text-xs">Acesso Total ao Sistema</p>
            </div>
          </div>
        );

      case 'Piloto':
        return (
          <div className="flex items-center space-x-2">
            {/* F1 Racing Helmet Icon */}
            <svg  
                xmlns="http://www.w3.org/2000/svg"  
                width="24"  
                height="24"  
                viewBox="0 0 24 24"  
                fill="none"  
                stroke="currentColor"  
                stroke-width="2"  
                stroke-linecap="round"  
                stroke-linejoin="round"  
                class="icon icon-tabler icons-tabler-outline icon-tabler-helmet text-red-600"
            >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 4a9 9 0 0 1 5.656 16h-11.312a9 9 0 0 1 5.656 -16z" />
                <path d="M20 9h-8.8a1 1 0 0 0 -.968 1.246c.507 2 1.596 3.418 3.268 4.254c2 1 4.333 1.5 7 1.5" />
            </svg>
            <div>
              <p className="text-indigo-200 text-sm font-medium">
                {userInfo.nomePiloto || 'Piloto'}
              </p>
              <p className="text-indigo-100 text-xs">
                {userInfo.pilotoEscuderiaAtual ? `Última Equipe: ${userInfo.pilotoEscuderiaAtual}` : 'Painel do Piloto'}
              </p>
            </div>
          </div>
        );

      case 'Escuderia':
        return (
          <div className="flex items-center space-x-2">
            {/* Team/Group Icon */}
            <svg 
              className="w-5 h-5 text-green-300" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
            </svg>
            <div>
              <p className="text-indigo-200 text-sm font-medium">
                {userInfo.nomeEscuderia || 'Escuderia'}
              </p>
              <p className="text-indigo-100 text-xs">
                {userInfo.quantidadePilotos !== null 
                  ? `${userInfo.quantidadePilotos} Piloto${userInfo.quantidadePilotos !== 1 ? 's' : ''}`
                  : 'Painel da Escuderia'
                }
              </p>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-indigo-200 text-sm">
            Painel {getRoleDisplayName(userInfo.tipo)}
          </p>
        );
    }
  };

  return (
    <header className="bg-indigo-600 p-6 flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-white mb-1">{title}</h2>
        {renderUserSpecificInfo()}
      </div>
      {showLogout && (
        <button 
          onClick={onLogout} 
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-indigo-600 transition duration-150 ease-in-out"
        >
          Sair
        </button>
      )}
    </header>
  );
}

export default UserHeader;
