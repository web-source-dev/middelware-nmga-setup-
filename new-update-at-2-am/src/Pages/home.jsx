// Home.jsx or App.jsx or wherever your '/' route renders

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Always redirect on component mount
    navigate('/deals-catlog', { replace: true });
  }, [navigate]);

  return null; // Or loading spinner etc., if needed
};

export default Home;
