import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface PeerData {
    ticker: string;
    positive_percentage: number;
    adverse_percentage: number;
    trend_percentage: number;
    overall_stance: string;
}

interface ComparisonData {
    main_company: PeerData & { company_name?: string };
    peers: PeerData[];
}

export const PeerComparisonPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [companyName, setCompanyName] = useState(searchParams.get('company') || '');
    const [ticker, setTicker] = useState(searchParams.get('ticker') || '');
    const [peers, setPeers] = useState<string[]>([]);
    const [peerInput, setPeerInput] = useState('');
    const [data, setData] = useState<ComparisonData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddPeer = () => {
        if (peerInput.trim() && peers.length < 2) {
            setPeers([...peers, peerInput.trim().toUpperCase()]);
            setPeerInput('');
        }
    };

    const handleRemovePeer = (index: number) => {
        setPeers(peers.filter((_, i) => i !== index));
    };

    const handleCompare = async () => {
        if (!ticker || !companyName || peers.length === 0) {
            setError('Please enter company name, ticker, and at least one peer');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/peer-comparison/compare-peers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker: ticker.includes('.KL') ? ticker : `${ticker}.KL`,
                    company_name: companyName,
                    peers: peers
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch comparison');
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to compare');
        } finally {
            setLoading(false);
        }
    };

    const getStanceColor = (stance: string) => {
        switch (stance) {
            case 'positive': return '#10b981';
            case 'negative': return '#ef4444';
            default: return '#f59e0b';
        }
    };

    const getStanceBg = (stance: string) => {
        switch (stance) {
            case 'positive': return '#d1fae5';
            case 'negative': return '#fee2e2';
            default: return '#fef3c7';
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px 20px'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '40px'
                }}>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '8px',
                        letterSpacing: '-0.02em'
                    }}>
                        📊 Peer Comparison
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '500'
                    }}>
                        Compare companies based on news signal analysis
                    </p>
                </div>

                {/* Input Form */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '32px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '20px',
                        marginBottom: '20px'
                    }}>
                        {/* Company Name */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g., DAYANG"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        {/* Ticker */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Ticker
                            </label>
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                placeholder="e.g., DAYANG or DAYANG.KL"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                    </div>

                    {/* Peers */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            Peers (Max 2)
                        </label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <input
                                type="text"
                                value={peerInput}
                                onChange={(e) => setPeerInput(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddPeer()}
                                placeholder="Enter peer ticker (e.g., WASCO)"
                                disabled={peers.length >= 2}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleAddPeer}
                                disabled={peers.length >= 2 || !peerInput.trim()}
                                style={{
                                    padding: '12px 24px',
                                    background: peers.length >= 2 ? '#d1d5db' : '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: peers.length >= 2 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Add
                            </button>
                        </div>

                        {/* Peer Tags */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {peers.map((peer, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    background: '#f3f4f6',
                                    borderRadius: '8px'
                                }}>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{peer}</span>
                                    <button
                                        onClick={() => handleRemovePeer(idx)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#6b7280',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            padding: '0 4px'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Compare Button */}
                    <button
                        onClick={handleCompare}
                        disabled={loading || !ticker || !companyName || peers.length === 0}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: loading ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {loading ? 'Analyzing...' : '📊 Compare'}
                    </button>

                    {error && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Results */}
                {data && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '24px'
                    }}>
                        {/* Main Company */}
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            border: '3px solid #667eea'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '16px'
                            }}>
                                <div>
                                    <h3 style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        color: '#111827',
                                        marginBottom: '4px'
                                    }}>
                                        {data.main_company.company_name || data.main_company.ticker}
                                    </h3>
                                </div>
                                <div style={{
                                    padding: '6px 12px',
                                    background: getStanceBg(data.main_company.overall_stance),
                                    color: getStanceColor(data.main_company.overall_stance),
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                }}>
                                    {data.main_company.overall_stance}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Positive */}
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                            Positive
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                                            {data.main_company.positive_percentage}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '8px',
                                        background: '#f3f4f6',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${data.main_company.positive_percentage}%`,
                                            background: '#10b981',
                                            transition: 'width 0.5s'
                                        }} />
                                    </div>
                                </div>

                                {/* Adverse */}
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                            Adverse
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                                            {data.main_company.adverse_percentage}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '8px',
                                        background: '#f3f4f6',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${data.main_company.adverse_percentage}%`,
                                            background: '#ef4444',
                                            transition: 'width 0.5s'
                                        }} />
                                    </div>
                                </div>

                                {/* Trend */}
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                            Trend
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>
                                            {data.main_company.trend_percentage}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '8px',
                                        background: '#f3f4f6',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${data.main_company.trend_percentage}%`,
                                            background: '#f59e0b',
                                            transition: 'width 0.5s'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Peer Companies */}
                        {data.peers.map((peer, idx) => (
                            <div key={idx} style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '24px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '16px'
                                }}>
                                    <div>
                                        <h3 style={{
                                            fontSize: '20px',
                                            fontWeight: '700',
                                            color: '#111827',
                                            marginBottom: '4px'
                                        }}>
                                            {peer.ticker}
                                        </h3>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            fontWeight: '500'
                                        }}>
                                            Peer {idx + 1}
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: '6px 12px',
                                        background: getStanceBg(peer.overall_stance),
                                        color: getStanceColor(peer.overall_stance),
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }}>
                                        {peer.overall_stance}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Positive */}
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '4px'
                                        }}>
                                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                                Positive
                                            </span>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                                                {peer.positive_percentage}%
                                            </span>
                                        </div>
                                        <div style={{
                                            height: '8px',
                                            background: '#f3f4f6',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${peer.positive_percentage}%`,
                                                background: '#10b981',
                                                transition: 'width 0.5s'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Adverse */}
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '4px'
                                        }}>
                                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                                Adverse
                                            </span>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                                                {peer.adverse_percentage}%
                                            </span>
                                        </div>
                                        <div style={{
                                            height: '8px',
                                            background: '#f3f4f6',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${peer.adverse_percentage}%`,
                                                background: '#ef4444',
                                                transition: 'width 0.5s'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Trend */}
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '4px'
                                        }}>
                                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                                Trend
                                            </span>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>
                                                {peer.trend_percentage}%
                                            </span>
                                        </div>
                                        <div style={{
                                            height: '8px',
                                            background: '#f3f4f6',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${peer.trend_percentage}%`,
                                                background: '#f59e0b',
                                                transition: 'width 0.5s'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
