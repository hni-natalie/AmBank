import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { NewsPage } from './pages/NewsPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { FinalListPage } from './pages/FinalListPage';

/**
 * Main App component - handles routing.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/companies" element={<CompaniesPage />} />
      <Route path="/final" element={<FinalListPage />} />
    </Routes>
  );
}

export default App;
