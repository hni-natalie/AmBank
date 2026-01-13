import React, { useState, useEffect, useRef } from 'react';

interface NotionAIProps {
    isOpen: boolean;
    onClose: () => void;
    context: {
        ticker: string;
        signal: string;
        signalType: string;
        details?: any[];
        analysis?: any; // Full analysis object for "Explain This Insight"
        company_name?: string;
    } | null;
    position?: { x: number; y: number };
}

interface AIResponse {
    explanation: string | Array<{
        step: number;
        title: string;
        description: string;
    }>;
    timestamp: string;
    sources?: Array<{
        title: string;
        link: string;
        source: string;
        date: string;
    }>;
    summary?: string;
}

export const NotionAI: React.FC<NotionAIProps> = ({ isOpen, onClose, context, position }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [showSources, setShowSources] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleQuickAction = async (action: string) => {
        setLoading(true);
        setResponse(null);

        try {
            // Handle "Explain This Insight" differently
            if (action === 'explain-insight' && context?.analysis) {
                const res = await fetch('/api/dashboard/explain-insight', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticker: context.ticker,
                        company_name: context.company_name,
                        analysis: context.analysis
                    })
                });

                if (!res.ok) throw new Error('Failed to fetch insight explanation');

                const data = await res.json();
                setResponse({
                    explanation: data.explanation,
                    timestamp: "Just now",
                    summary: data.summary
                });
            } else {
                // Original signal explanation
                const res = await fetch('/api/dashboard/explain-signal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticker: context?.ticker,
                        signal: context?.signal,
                        signal_type: context?.signalType,
                        prompt: action,
                        context: context?.details ? JSON.stringify(context.details.slice(0, 3)) : undefined
                    })
                });

                if (!res.ok) throw new Error('Failed to fetch explanation');

                const data = await res.json();
                setResponse(data);
            }
        } catch (err) {
            console.error(err);
            setResponse({
                explanation: "**Analysis Unavailable**\n\n- Could not connect to AI service\n- Please try again later",
                timestamp: "Now"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setResponse(null);

        try {
            const res = await fetch('/api/dashboard/explain-signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker: context?.ticker,
                    signal: context?.signal,
                    signal_type: context?.signalType,
                    prompt: prompt,
                    context: context?.details ? JSON.stringify(context.details.slice(0, 3)) : undefined
                })
            });

            if (!res.ok) throw new Error('Failed to fetch explanation');

            const data = await res.json();
            setResponse(data);
            setPrompt('');
        } catch (err) {
            console.error(err);
            setResponse({
                explanation: "**Analysis Unavailable**\n\n- Could not connect to AI service\n- Please try again later",
                timestamp: "Now"
            });
        } finally {
            setLoading(false);
        }
    };

    const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, i) => {
            const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            if (line.startsWith('- ') || line.startsWith('• ')) {
                return (
                    <li
                        key={i}
                        style={{
                            marginLeft: '20px',
                            marginBottom: '6px',
                            color: '#334155',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}
                        dangerouslySetInnerHTML={{ __html: cleanLine.substring(2) }}
                    />
                );
            }

            if (line.trim() === '') {
                return <div key={i} style={{ height: '8px' }} />;
            }

            return (
                <p
                    key={i}
                    style={{
                        marginBottom: '8px',
                        color: '#334155',
                        fontSize: '14px',
                        lineHeight: '1.6'
                    }}
                    dangerouslySetInnerHTML={{ __html: cleanLine }}
                />
            );
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                zIndex: 999,
                animation: 'fadeIn 0.15s ease-out'
            }} />

            {/* AI Panel */}
            <div
                ref={containerRef}
                style={{
                    position: 'fixed',
                    top: position ? `${position.y}px` : '50%',
                    left: position ? `${position.x}px` : '50%',
                    transform: position ? 'none' : 'translate(-50%, -50%)',
                    width: '520px',
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.2s ease-out',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '16px' }}>✨</span>
                        AI Assistant
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px',
                            lineHeight: 1
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Quick Actions */}
                {!response && !loading && (
                    <div style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        {context?.analysis && (
                            <button
                                onClick={() => handleQuickAction('explain-insight')}
                                style={quickActionStyle}
                            >
                                Explain This Insight
                            </button>
                        )}
                        <button
                            onClick={() => handleQuickAction('explain')}
                            style={quickActionStyle}
                        >
                            Explain
                        </button>
                        <button
                            onClick={() => handleQuickAction('compare')}
                            style={quickActionStyle}
                        >
                            Compare peers
                        </button>
                        <button
                            onClick={() => handleQuickAction('risks')}
                            style={quickActionStyle}
                        >
                            Risks
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    {loading && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#6b7280',
                            fontSize: '13px'
                        }}>
                            <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid #e5e7eb',
                                borderTopColor: '#6b7280',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                            }} />
                            Analyzing...
                        </div>
                    )}

                    {response && (
                        <div>
                            {response.summary && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '6px',
                                    marginBottom: '16px',
                                    fontSize: '13px',
                                    color: '#4b5563',
                                    lineHeight: '1.5'
                                }}>
                                    {response.summary}
                                </div>
                            )}
                            <div style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                                {Array.isArray(response.explanation) ? (
                                    // Render numbered list for insight explanation
                                    <div>
                                        {response.explanation.map((step, idx) => (
                                            <div key={idx} style={{
                                                marginBottom: '20px',
                                                paddingBottom: '20px',
                                                borderBottom: idx < response.explanation.length - 1 ? '1px solid #e5e7eb' : 'none'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '12px'
                                                }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#111827',
                                                        color: '#ffffff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        flexShrink: 0
                                                    }}>
                                                        {step.step}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h3 style={{
                                                            fontSize: '15px',
                                                            fontWeight: '600',
                                                            color: '#111827',
                                                            margin: '0 0 6px 0'
                                                        }}>
                                                            {step.title}
                                                        </h3>
                                                        <p style={{
                                                            fontSize: '14px',
                                                            color: '#4b5563',
                                                            lineHeight: '1.6',
                                                            margin: 0
                                                        }}>
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    renderMarkdown(response.explanation as string)
                                )}
                            </div>

                            {/* Sources Section */}
                            {response && response.sources && response.sources.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <button
                                        onClick={() => setShowSources(!showSources)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#6b7280',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span style={{ transform: showSources ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
                                        Sources ({response.sources.length})
                                    </button>

                                    {showSources && (
                                        <div style={{
                                            marginTop: '8px',
                                            paddingLeft: '16px',
                                            fontSize: '12px',
                                            color: '#6b7280'
                                        }}>
                                            {response.sources.map((source: any, idx: number) => (
                                                <div key={idx} style={{ marginBottom: '6px' }}>
                                                    • <a
                                                        href={source.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#3b82f6',
                                                            textDecoration: 'none'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                    >
                                                        {source.title}
                                                    </a>
                                                    {source.date && (
                                                        <span style={{ color: '#9ca3af', marginLeft: '6px' }}>
                                                            ({source.date})
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid #f3f4f6',
                                display: 'flex',
                                gap: '12px'
                            }}>
                                <button
                                    onClick={() => console.log('Insert to notes')}
                                    style={actionButtonStyle}
                                >
                                    Insert into notes
                                </button>
                                <button
                                    onClick={() => setResponse(null)}
                                    style={actionButtonStyle}
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => setResponse(null)}
                                    style={{ ...actionButtonStyle, marginLeft: 'auto' }}
                                >
                                    Ask follow-up
                                </button>
                            </div>
                        </div>
                    )}

                    {!loading && !response && (
                        <div style={{
                            color: '#9ca3af',
                            fontSize: '13px',
                            textAlign: 'center',
                            padding: '20px 0'
                        }}>
                            Ask a question or select a quick action above
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#fafafa'
                }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && prompt.trim()) {
                                    handleSubmit();
                                }
                            }}
                            placeholder="Ask AI about this signal..."
                            style={{
                                flex: 1,
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                backgroundColor: '#ffffff'
                            }}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!prompt.trim() || loading}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: prompt.trim() && !loading ? '#111827' : '#e5e7eb',
                                color: prompt.trim() && !loading ? '#ffffff' : '#9ca3af',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: prompt.trim() && !loading ? 'pointer' : 'not-allowed',
                                transition: 'all 0.15s'
                            }}
                        >
                            Ask
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: ${position ? 'translateY(10px)' : 'translate(-50%, -48%)'};
          }
          to { 
            opacity: 1;
            transform: ${position ? 'translateY(0)' : 'translate(-50%, -50%)'};
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
};

const quickActionStyle: React.CSSProperties = {
    padding: '6px 12px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.15s'
};

const actionButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '13px',
    color: '#6b7280',
    cursor: 'pointer',
    fontWeight: '500'
};
