import React, { useState, useRef, useEffect } from 'react';

interface Citation {
    type: 'macro' | 'micro';
    title: string;
    source: string;
    date: string;
    url?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    type?: 'insight' | 'explanation' | 'peer_comparison' | 'risk_assessment' | 'general';
    data?: any;
    citations?: Citation[];
}

export const FloatingChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const analyzeQuery = (query: string): { type: Message['type'], intent: string } => {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('explain') && (lowerQuery.includes('insight') || lowerQuery.includes('conclusion'))) {
            return { type: 'insight', intent: 'explain_insight' };
        }
        if (lowerQuery.includes('explain') || lowerQuery.includes('why') || lowerQuery.includes('how')) {
            return { type: 'explanation', intent: 'explain_detail' };
        }
        if (lowerQuery.includes('peer') || lowerQuery.includes('compar') || lowerQuery.includes('vs')) {
            return { type: 'peer_comparison', intent: 'compare_peers' };
        }
        if (lowerQuery.includes('risk') || lowerQuery.includes('concern') || lowerQuery.includes('adverse')) {
            return { type: 'risk_assessment', intent: 'assess_risk' };
        }

        return { type: 'general', intent: 'general_query' };
    };

    const generateResponse = (type: Message['type']): { content: string, data?: any, citations?: Citation[] } => {
        switch (type) {
            case 'insight':
                return {
                    content: `**How this insight was reached:**

📊 **Step 1: Data Collection**
• Analyzed 20+ recent news articles
• Gathered macro and micro market signals
• Collected financial ratios (PE, ROE, Dividend Yield)

📈 **Step 2: Signal Analysis**
• Macro confidence: 75.2% (positive sentiment)
• Micro confidence: 68.5% (company-specific trends)
• Financial score: 72.0% (strong fundamentals)

🎯 **Step 3: Weighted Calculation**
• Applied 40% weight to macro signals
• Applied 30% weight to micro signals  
• Applied 30% weight to financial metrics

✅ **Final Conclusion:**
Overall score of 72.3 indicates a **moderately positive** outlook with strong fundamentals and favorable market sentiment.`,
                    data: {
                        steps: ['Data Collection', 'Signal Analysis', 'Weighted Calculation'],
                        confidence: 72.3
                    }
                };

            case 'explanation':
                return {
                    content: `**Detailed Explanation:**

🔍 **What the data shows:**
This metric indicates the company's performance relative to market expectations.

📊 **Key Factors:**
1. **Positive Signals (45%)**
   • Strong revenue growth
   • Expanding market share
   • Favorable regulatory environment

2. **Adverse Signals (25%)**
   • Supply chain concerns
   • Rising input costs
   • Competitive pressure

3. **Trend Signals (30%)**
   • Increasing institutional investment
   • Sector rotation patterns
   • Technical momentum

💡 **What this means:**
The balance of signals suggests cautious optimism. While fundamentals are strong, external factors warrant monitoring.`,
                    data: {
                        positive: 45,
                        adverse: 25,
                        trend: 30
                    }
                };

            case 'peer_comparison':
                return {
                    content: `**Peer Comparison Analysis:**

📊 **Performance vs Peers:**

**Main Company: 72.3**
• Macro: 75.2 (Above average)
• Micro: 68.5 (Average)
• Financial: 72.0 (Above average)

**Peer 1: DAYANG - 68.5**
• Macro: 70.1
• Micro: 65.0
• Financial: 70.0

**Peer 2: DELEUM - 65.2**
• Macro: 68.0
• Micro: 62.5
• Financial: 65.0

📈 **Key Insights:**
✅ Outperforming peers by 5.6% on average
✅ Stronger macro sentiment (+7.1% vs avg)
⚠️ Micro signals in line with sector
✅ Better financial fundamentals (+4.3% vs avg)

🎯 **Recommendation:**
Company shows relative strength vs peers, particularly in macro environment and financial health.`,
                    data: {
                        main: 72.3,
                        peers: [
                            { name: 'DAYANG', score: 68.5 },
                            { name: 'DELEUM', score: 65.2 }
                        ]
                    }
                };

            case 'risk_assessment':
                return {
                    content: `**Risk Assessment:**

⚠️ **Identified Risk Factors:**

**HIGH PRIORITY:**
🔴 **Market Volatility**
• Recent price swings indicate uncertainty
• Sector experiencing headwinds
• Impact: Could affect short-term performance

**MEDIUM PRIORITY:**
🟡 **Competitive Pressure**
• New entrants in the market
• Price competition intensifying
• Impact: May compress margins

🟡 **Regulatory Changes**
• Pending policy updates
• Compliance costs may increase
• Impact: Operational adjustments needed

**LOW PRIORITY:**
🟢 **Supply Chain**
• Minor disruptions possible
• Alternative suppliers available
• Impact: Limited exposure

📊 **Risk Score: 35/100** (Moderate)

🛡️ **Mitigation Strategies:**
1. Diversify revenue streams
2. Monitor regulatory developments
3. Strengthen competitive moat
4. Maintain healthy cash reserves

💡 **Overall Assessment:**
Risks are manageable with proper monitoring. No immediate red flags, but stay vigilant on market conditions.`,
                    data: {
                        riskScore: 35,
                        highRisks: 1,
                        mediumRisks: 2,
                        lowRisks: 1
                    }
                };

            default:
                return {
                    content: `I can help you with:

📊 **"Explain this insight"** - How conclusions are reached
📖 **"Explain [topic]"** - Detailed reasoning behind data
👥 **"Peer comparison"** - Performance vs competitors  
⚠️ **"Risk assessment"** - Identify potential concerns

What would you like to know?`
                };
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMessage = message;
        setMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        // Analyze query and generate appropriate response
        setTimeout(() => {
            const { type } = analyzeQuery(userMessage);
            const response = generateResponse(type);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.content,
                type,
                data: response.data
            }]);
            setIsLoading(false);
        }, 800);
    };

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        fontSize: '28px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 1000,
                        transition: 'transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    💬
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '420px',
                    height: '600px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Financial AI Assistant</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Actionable Insights</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: 'white',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        background: '#f9fafb'
                    }}>
                        {messages.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                color: '#6b7280',
                                fontSize: '14px',
                                marginTop: '40px'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                                <p style={{ fontWeight: '600', marginBottom: '8px' }}>Hi! I'm your Financial AI Assistant.</p>
                                <p style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                    Ask me to:<br />
                                    • Explain insights<br />
                                    • Compare with peers<br />
                                    • Assess risks<br />
                                    • Analyze trends
                                </p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    marginBottom: '12px',
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <div style={{
                                    maxWidth: '85%',
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    background: msg.role === 'user' ? '#667eea' : 'white',
                                    color: msg.role === 'user' ? 'white' : '#111827',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                                    whiteSpace: 'pre-line'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    background: 'white',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#d1d5db',
                                            animation: 'bounce 1.4s infinite ease-in-out both'
                                        }} />
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#d1d5db',
                                            animation: 'bounce 1.4s infinite ease-in-out both 0.2s'
                                        }} />
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#d1d5db',
                                            animation: 'bounce 1.4s infinite ease-in-out both 0.4s'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid #e5e7eb',
                        background: 'white'
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '12px',
                            flexWrap: 'wrap'
                        }}>
                            {['Explain insight', 'Peer comparison', 'Risk assessment'].map((action) => (
                                <button
                                    key={action}
                                    onClick={() => {
                                        setMessage(action);
                                        setTimeout(() => handleSend(), 100);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        background: '#f3f4f6',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        color: '#374151',
                                        fontWeight: '500'
                                    }}
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '16px',
                        borderTop: '1px solid #e5e7eb',
                        background: 'white'
                    }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about insights, risks, or comparisons..."
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim() || isLoading}
                                style={{
                                    padding: '10px 20px',
                                    background: message.trim() && !isLoading ? '#667eea' : '#e5e7eb',
                                    color: message.trim() && !isLoading ? 'white' : '#9ca3af',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: message.trim() && !isLoading ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 
          40% { 
            transform: scale(1);
          }
        }
      `}</style>
        </>
    );
};
