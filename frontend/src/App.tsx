import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { CompanyResultPage } from './pages/CompanyResultPage';
import { ComparePeersPage } from './pages/ComparePeersPage';
import { HomePage } from './pages/HomePage';
import { NewsPage } from './pages/NewsPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { FinalListPage } from './pages/FinalListPage';
import { DashboardPage } from './pages/DashboardPage';
import { PeerComparisonPage } from './pages/PeerComparisonPage';

/**
 * Main App component - handles routing.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/assess" element={<LandingPage />} />
      <Route path="/result/:jobId" element={<CompanyResultPage />} />
      <Route path="/compare/:jobId" element={<ComparePeersPage />} />
      <Route path="/peer-comparison" element={<ComparePeersPage />} />
      <Route path="/monitor" element={<div>Watchlist monitor page (to be implemented)</div>} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/companies" element={<CompaniesPage />} />
      <Route path="/final" element={<FinalListPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/compare" element={<PeerComparisonPage />} />
    </Routes>
  )
}

export default App;
