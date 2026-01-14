import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store/appStore';
import { loadWatchlist, saveWatchlist, toggleWatchlist as toggleWatchlistUtil, WatchlistItem } from '../utils/watchlist';

interface FinancialData {
  financial_year: string;
  revenue?: number;
  net?: number;
  eps?: number;
  dp_percent?: number;
  net_percent?: number;
}

interface Company {
  name: string;
  code: string;
  sector: string;
  volume?: number;
  last_done?: number;
  change_points?: number;
  change_percent?: number;
  revenue?: number;
  pe_ratio?: number;
  roe?: number;
  annual_revenue?: number;
  annual_net?: number;
  annual_eps?: number;
  annual_dp_percent?: number;
  annual_net_percent?: number;
  financial_year?: string;
  financial_history?: FinancialData[];
  watchlist?: boolean;
}

interface SectorPeersResponse {
  sector: string;
  companies: Company[];
}

export const SectorPeers: React.FC = () => {
  const navigate = useNavigate();
  const storeInput = useAppStore((state) => state.userInput);
  const companyName = storeInput?.ticker || storeInput?.companyName || '';
  
  const [data, setData] = useState<SectorPeersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Auto-fetch on mount or when companyName changes
  useEffect(() => {
    if (companyName) {
      fetchSectorPeers();
    }
  }, [companyName]);

  const toggleWatchlist = async (company: Company) => {
    try {
      // Update backend watchlist status
      const response = await fetch(
        `/api/company/${company.code}/watchlist`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ watchlist: !company.watchlist })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update watchlist`);
      }

      // If adding to watchlist, update localStorage and show message
      if (!company.watchlist) {
        const currentWatchlist = loadWatchlist();
        const watchlistItem: WatchlistItem = {
          ticker: company.code,
          name: company.name,
          sector: company.sector
        };
        const { updated } = toggleWatchlistUtil(watchlistItem, currentWatchlist);
        saveWatchlist(updated);
        
        // Show success message
        setToastMessage(`${company.name} (${company.code}) added to watchlist`);
        setTimeout(() => setToastMessage(''), 3000);
        
        // Update local state to show star as filled
        setSelectedCompanies(prev => 
          prev.map(c => 
            c.code === company.code 
              ? { ...c, watchlist: true }
              : c
          )
        );

        if (data) {
          setData({
            ...data,
            companies: data.companies.map(c =>
              c.code === company.code
                ? { ...c, watchlist: true }
                : c
            )
          });
        }
      } else {
        // If removing from watchlist, update localStorage and local state
        const currentWatchlist = loadWatchlist();
        const updated = currentWatchlist.filter(item => item.ticker !== company.code);
        saveWatchlist(updated);
        
        setToastMessage(`${company.name} (${company.code}) removed from watchlist`);
        setTimeout(() => setToastMessage(''), 3000);
        
        setSelectedCompanies(prev => 
          prev.map(c => 
            c.code === company.code 
              ? { ...c, watchlist: false }
              : c
          )
        );

        if (data) {
          setData({
            ...data,
            companies: data.companies.map(c =>
              c.code === company.code
                ? { ...c, watchlist: false }
                : c
            )
          });
        }
      }
    } catch (err) {
      console.error('Error updating watchlist:', err);
      setToastMessage('Failed to update watchlist. Please try again.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const fetchSectorPeers = async () => {
    if (!companyName.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/company/sector-peers?company_name=${encodeURIComponent(companyName)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SectorPeersResponse = await response.json();
      setData(result);
      
      // Select the searched company + 2 random peers with financial history
      const companiesWithHistory = result.companies.filter(c => c.financial_history && c.financial_history.length > 0);
      
      // Find the searched company
      const searchedCompany = companiesWithHistory.find(c => 
        c.name.toLowerCase().includes(companyName.toLowerCase()) || 
        c.code.toLowerCase().includes(companyName.toLowerCase())
      );
      
      // Get other companies (excluding the searched one)
      const otherCompanies = companiesWithHistory.filter(c => c !== searchedCompany);
      
      // Randomly select 2 companies from others
      const shuffled = [...otherCompanies].sort(() => 0.5 - Math.random());
      const randomTwo = shuffled.slice(0, 2);
      
      // Combine: searched company first, then 2 random ones
      const selected = searchedCompany ? [searchedCompany, ...randomTwo] : randomTwo.slice(0, 3);
      setSelectedCompanies(selected);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num?: number | null): string => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatPercent = (num?: number | null): string => {
    if (num === null || num === undefined) return '-';
    return `${num.toFixed(2)}%`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '32px 24px',
      color: '#1f2937'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>

        {/* Loading State */}
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '20px',
            padding: '60px 20px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#10a37f',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              Loading sector peer data...
            </p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#991b1b',
            border: '1px solid #fecaca'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {data && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#111827',
                margin: '0 0 8px 0'
              }}>
                Sector: <span style={{ color: '#10a37f' }}>{data.sector}</span>
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                Showing financial history charts for 3 companies (searched company + 2 peers)
              </p>
            </div>


          {/* Summary Section with 3 Bar Charts */}
          {selectedCompanies.length > 0 && (() => {
            // Define colors for each company
            const companyColors = ['#ef4444', '#3b82f6', '#10b981']; // Red, Blue, Green
            const companyLightColors = ['#fee2e2', '#dbeafe', '#d1fae5']; // Light versions
            
            // Calculate Revenue Growth Rate for each company
            const growthData = selectedCompanies.map((company, idx) => {
              const history = company.financial_history;
              if (!history || history.length < 2) {
                return { 
                  company: company.name,
                  value: 0,
                  fill: companyColors[idx]
                };
              }
              
              const latestRevenue = history[history.length - 1]?.revenue || 0;
              const priorRevenue = history[history.length - 2]?.revenue || 0;
              
              const growthRate = priorRevenue !== 0 
                ? ((latestRevenue - priorRevenue) / priorRevenue) * 100 
                : 0;
              
              return { 
                company: company.name,
                value: growthRate,
                fill: companyColors[idx]
              };
            });

            // Extract PE Ratio for each company
            const peData = selectedCompanies.map((company, idx) => ({
              company: company.name,
              value: company.pe_ratio || 0,
              fill: companyColors[idx]
            }));

            // Extract ROE for each company
            const roeData = selectedCompanies.map((company, idx) => ({
              company: company.name,
              value: company.roe || 0,
              fill: companyColors[idx]
            }));

            return (
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ 
                  marginBottom: '24px', 
                  color: '#111827', 
                  fontSize: '18px', 
                  fontWeight: '600' 
                }}>
                  Key Metrics Comparison
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                  {/* Revenue Growth Rate Bar Chart */}
                  <div>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '12px', 
                      textAlign: 'center' 
                    }}>
                      Revenue Growth Rate
                    </h4>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="company" tick={{ fontSize: 12 }} />
                        <YAxis tick={false} label={{ value: 'Growth %', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                        <Bar dataKey="value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* PE Ratio Bar Chart */}
                  <div>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '12px', 
                      textAlign: 'center' 
                    }}>
                      PE Ratio
                    </h4>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={peData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="company" tick={{ fontSize: 12 }} />
                        <YAxis tick={false} label={{ value: 'PE Ratio', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => value.toFixed(2)} />
                        <Bar dataKey="value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ROE Bar Chart */}
                  <div>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '12px', 
                      textAlign: 'center' 
                    }}>
                      Return on Equity (ROE)
                    </h4>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={roeData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="company" tick={{ fontSize: 12 }} />
                        <YAxis tick={false} label={{ value: 'ROE %', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                        <Bar dataKey="value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Charts for Selected Companies */}
          {selectedCompanies.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {selectedCompanies.map((company, idx) => {
                // Define colors for each company
                const companyColors = ['#ef4444', '#3b82f6', '#10b981'];
                const companyLightColors = ['#fef2f2', '#eff6ff', '#f0fdf4'];
                
                // Transform data to show only year and reverse order (oldest to newest: 2021 -> 2025)
                const chartData = company.financial_history?.map(item => ({
                  ...item,
                  year: item.financial_year.split(',').pop()?.trim() || item.financial_year
                })).reverse();

                return (
                  <div 
                    key={company.code} 
                    style={{ 
                      padding: '20px',
                      backgroundColor: companyLightColors[idx],
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: `2px solid ${companyColors[idx]}`
                    }}
                  >
                    <h3 style={{ 
                      marginBottom: '20px', 
                      color: '#111827', 
                      borderBottom: `2px solid ${companyColors[idx]}`, 
                      paddingBottom: '12px', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px' 
                    }}>
                      <span style={{ flex: 1 }}>
                        {company.name} ({company.code})
                        {idx === 0 && (
                          <span style={{ 
                            fontSize: '11px', 
                            color: '#10a37f', 
                            marginLeft: '8px', 
                            display: 'inline-block',
                            backgroundColor: '#d1fae5',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            Searched
                          </span>
                        )}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(company);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '20px',
                          padding: '0',
                          marginLeft: 'auto',
                          transition: 'transform 0.2s',
                          color: company.watchlist ? '#FFD700' : '#ccc'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title={company.watchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        {company.watchlist ? '★' : '☆'}
                      </button>
                    </h3>

                  {/* Net Margin & EPS Line Chart */}
                  <div style={{ marginBottom: '28px' }}>
                    <h4 style={{ 
                      marginBottom: '12px', 
                      color: '#374151', 
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Net Margin % & EPS
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="year"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          style={{ fontSize: '10px' }}
                        />
                        <YAxis yAxisId="left" tick={false} style={{ fontSize: '10px' }} />
                        <YAxis yAxisId="right" tick={false} orientation="right" style={{ fontSize: '10px' }} />
                        <Tooltip 
                          formatter={(value: number | undefined, name: string) => {
                            if (value === undefined) return '-';
                            return name === 'Net Margin %' ? `${value.toFixed(2)}%` : formatNumber(value);
                          }}
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="net_percent" 
                          stroke="#ea4335" 
                          strokeWidth={2}
                          dot={{ fill: '#ea4335', r: 4 }}
                          name="Net Margin %"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="eps" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', r: 4 }}
                          name="EPS"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Dividend Payout Line Chart */}
                  <div>
                    <h4 style={{ 
                      marginBottom: '12px', 
                      color: '#374151', 
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Dividend Payout %
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="year"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          style={{ fontSize: '10px' }}
                        />
                        <YAxis tick={false} style={{ fontSize: '10px' }} />
                        <Tooltip 
                          formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(2)}%` : '-'}
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="dp_percent" 
                          stroke="#9333ea" 
                          strokeWidth={2}
                          dot={{ fill: '#9333ea', r: 4 }}
                          name="Dividend Payout %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              padding: '24px', 
              backgroundColor: '#fffbeb', 
              border: '1px solid #fcd34d', 
              borderRadius: '8px',
              color: '#92400e'
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                No companies with financial history data available in this sector.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toast Message */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#10a37f',
          color: 'white',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '400px',
          border: '1px solid #0d9468'
        }}>
          {toastMessage}
        </div>
      )}
      </div>
    </div>
  );
};
