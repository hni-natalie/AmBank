import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { SectorPeers } from '../components/SectorPeers';

/**
 * Analysis Page - Container for various analysis tools
 * Currently includes:
 * - Sector Peers Analysis
 * 
 * More analysis tools can be added here later
 */
export const AnalysisPage: React.FC = () => {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Navigation Tabs */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '2px solid #e0e0e0',
        padding: '0 20px'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '30px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <Link
            to="/analysis/sector-peers"
            style={{
              padding: '15px 20px',
              textDecoration: 'none',
              color: location.pathname.includes('sector-peers') ? '#007bff' : '#666',
              borderBottom: location.pathname.includes('sector-peers') ? '3px solid #007bff' : '3px solid transparent',
              fontWeight: location.pathname.includes('sector-peers') ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            Sector Peers
          </Link>
          {/* Add more tabs here later */}
        </div>
      </div>

      {/* Content Area */}
      <Routes>
        <Route path="sector-peers" element={<SectorPeers />} />
        {/* Add more routes here later */}
      </Routes>
    </div>
  );
};
