// Helper function to make authenticated API requests
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
    },
  };

  // Don't set Content-Type if body is FormData, let browser handle it
  if (!(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  
  // If token is expired or invalid, redirect to login
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  
  return response;
};

// Helper function to handle logout
export const logout = async () => {
  try {
    await fetchWithAuth('/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};
