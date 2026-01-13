import React from 'react';
import { CompanySnapshot } from '../../api/dashboard';

interface QuickSnapshotProps {
  data: CompanySnapshot;
}

const formatNumber = (num: number | null | undefined, prefix = '', suffix = ''): string => {
  if (num === null || num === undefined) return '-';
  
  // Handle big numbers for Market Cap / Volume
  if (num > 1_000_000_000) {
    return `${prefix}${(num / 1_000_000_000).toFixed(1)}B${suffix}`;
  }
  if (num > 1_000_000) {
    return `${prefix}${(num / 1_000_000).toFixed(1)}M${suffix}`;
  }
  
  return `${prefix}${num.toLocaleString()}${suffix}`;
};

const QuickSnapshot: React.FC<QuickSnapshotProps> = ({ data }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      padding: '24px',
      height: 'fit-content'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <span style={{ fontSize: '20px' }}>📸</span>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          margin: 0,
          color: '#111827'
        }}>
          Quick Snapshot
        </h2>
      </div>

      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: '24px',
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: '12px'
      }}>
        {data.name}
      </h3>

      {/* 2x2 Grid for Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Market Cap */}
        <div style={{ display: data.market_cap ? 'block' : 'none' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Market Cap</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            {formatNumber(data.market_cap, 'RM ')}
          </div>
        </div>

        {/* ROE */}
        <div style={{ display: data.roe ? 'block' : 'none' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>ROE</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            {data.roe?.toFixed(1)}%
          </div>
        </div>

        {/* P/E Ratio */}
        <div style={{ display: data.pe_ratio ? 'block' : 'none' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>P/E Ratio</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            {data.pe_ratio?.toFixed(1)}x
          </div>
        </div>

        {/* Dividend Yield */}
        <div style={{ display: data.dividend_yield ? 'block' : 'none' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Div. Yield</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
            {data.dividend_yield?.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Liquidity Row (Optional) */}
      {data.average_volume && (
        <div style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Avg Vol (3M)</span>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{formatNumber(data.average_volume)}</span>
        </div>
      )}

      {/* Annual Reports Links */}
      {data.annual_report_pdfs && data.annual_report_pdfs.length > 0 && (
        <div>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Evidence
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.annual_report_pdfs.slice(0, 2).map((pdfUrl, idx) => (
              <a 
                key={idx}
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #dbeafe',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#1d4ed8',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff' }}
              >
                <span>📄</span>
                <span>Annual Report {new Date().getFullYear() - idx}</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickSnapshot;
