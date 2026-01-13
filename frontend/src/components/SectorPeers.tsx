import React, { useState, useEffect } from 'react';

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
  annual_revenue?: number;
  annual_net?: number;
  annual_eps?: number;
  annual_dp_percent?: number;
  annual_net_percent?: number;
  financial_year?: string;
  financial_history?: FinancialData[];
}

interface SectorPeersResponse {
  sector: string;
  companies: Company[];
}

export const SectorPeers: React.FC = () => {
  const [companyName, setCompanyName] = useState('dayang');
  const [data, setData] = useState<SectorPeersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectorPeers();
  }, []);

  const formatNumber = (num?: number | null): string => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatPercent = (num?: number | null): string => {
    if (num === null || num === undefined) return '-';
    return `${num.toFixed(2)}%`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#000' }}>
      <h1 style={{ marginBottom: '20px', color: '#000' }}>Sector Peers Analysis</h1>
      
      {/* Search Section */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter company name..."
          style={{
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '300px'
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') fetchSectorPeers();
          }}
        />
        <button
          onClick={fetchSectorPeers}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div>
          <h2 style={{ marginBottom: '15px', color: '#000' }}>
            Sector: <span style={{ color: '#000', fontWeight: '600' }}>{data.sector}</span>
          </h2>
          <p style={{ color: '#000', marginBottom: '20px' }}>
            Found {data.companies.length} companies in this sector
          </p>

          {/* Companies Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={tableHeaderStyle}>Company</th>
                  <th style={tableHeaderStyle}>Code</th>
                  <th style={tableHeaderStyle}>Last Done</th>
                  <th style={tableHeaderStyle}>Change</th>
                  <th style={tableHeaderStyle}>Volume</th>
                  <th style={tableHeaderStyle}>FY</th>
                  <th style={tableHeaderStyle}>Revenue ('000)</th>
                  <th style={tableHeaderStyle}>Net ('000)</th>
                  <th style={tableHeaderStyle}>EPS</th>
                  <th style={tableHeaderStyle}>DP%</th>
                  <th style={tableHeaderStyle}>Net%</th>
                </tr>
              </thead>
              <tbody>
                {data.companies.map((company, index) => (
                  <React.Fragment key={index}>
                    <tr 
                      style={{
                        borderBottom: '1px solid #dee2e6',
                        backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                        cursor: company.financial_history ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (company.financial_history) {
                          setExpandedCompany(expandedCompany === company.code ? null : company.code);
                        }
                      }}
                    >
                      <td style={tableCellStyle}>
                        {company.financial_history && (
                          <span style={{ marginRight: '8px' }}>
                            {expandedCompany === company.code ? '▼' : '▶'}
                          </span>
                        )}
                        {company.name}
                      </td>
                      <td style={tableCellStyle}>{company.code}</td>
                      <td style={tableCellStyle}>{formatNumber(company.last_done)}</td>
                      <td style={{
                        ...tableCellStyle,
                        color: (company.change_points ?? 0) >= 0 ? '#28a745' : '#dc3545'
                      }}>
                        {company.change_points !== null && company.change_points !== undefined ? (
                          <>
                            {company.change_points >= 0 ? '+' : ''}{formatNumber(company.change_points)}
                            {' '}({formatPercent(company.change_percent)})
                          </>
                        ) : '-'}
                      </td>
                      <td style={tableCellStyle}>{formatNumber(company.volume)}</td>
                      <td style={tableCellStyle}>{company.financial_year || '-'}</td>
                      <td style={tableCellStyle}>{formatNumber(company.annual_revenue)}</td>
                      <td style={tableCellStyle}>{formatNumber(company.annual_net)}</td>
                      <td style={tableCellStyle}>{formatNumber(company.annual_eps)}</td>
                      <td style={tableCellStyle}>{formatPercent(company.annual_dp_percent)}</td>
                      <td style={tableCellStyle}>{formatPercent(company.annual_net_percent)}</td>
                    </tr>
                    
                    {/* Expanded financial history */}
                    {expandedCompany === company.code && company.financial_history && (
                      <tr>
                        <td colSpan={11} style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                          <div style={{ padding: '15px 30px', borderLeft: '3px solid #007bff' }}>
                            <h4 style={{ marginBottom: '10px', color: '#000' }}>Financial History</h4>
                            <table style={{ width: '100%', fontSize: '13px' }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '8px', textAlign: 'left', color: '#666' }}>Year</th>
                                  <th style={{ padding: '8px', textAlign: 'left', color: '#666' }}>Revenue ('000)</th>
                                  <th style={{ padding: '8px', textAlign: 'left', color: '#666' }}>Net ('000)</th>
                                  <th style={{ padding: '8px', textAlign: 'left', color: '#666' }}>EPS</th>
                                  <th style={{ padding: '8px', textAlign: 'left', color: '#666' }}>DP%</th>
                                  <th style={{ padding: '8px', textAlign: 'left', color: '#666' }}>Net%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {company.financial_history.map((year, yearIdx) => (
                                  <tr key={yearIdx} style={{ backgroundColor: yearIdx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                    <td style={{ padding: '8px', color: '#000' }}>{year.financial_year}</td>
                                    <td style={{ padding: '8px', color: '#000' }}>{formatNumber(year.revenue)}</td>
                                    <td style={{ padding: '8px', color: '#000' }}>{formatNumber(year.net)}</td>
                                    <td style={{ padding: '8px', color: '#000' }}>{formatNumber(year.eps)}</td>
                                    <td style={{ padding: '8px', color: '#000' }}>{formatPercent(year.dp_percent)}</td>
                                    <td style={{ padding: '8px', color: '#000' }}>{formatPercent(year.net_percent)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: '600',
  borderBottom: '2px solid #dee2e6',
  fontSize: '14px',
  whiteSpace: 'nowrap',
  color: '#000'
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: '14px',
  color: '#000'
};
