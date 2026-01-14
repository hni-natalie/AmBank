import React, { useState } from 'react';

interface FloatingChatbotProps {
    onClose?: () => void;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMessage = message;
        setMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I can help you analyze company data and answer questions about the dashboard. What would you like to know?'
            }]);
            setIsLoading(false);
        }, 1000);
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
                    width: '380px',
                    height: '500px',
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
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>AI Assistant</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Ask me anything</p>
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
                                <p>Hi! I'm your AI assistant.</p>
                                <p>Ask me about company analysis, signals, or trends.</p>
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
                                    maxWidth: '80%',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    background: msg.role === 'user' ? '#667eea' : 'white',
                                    color: msg.role === 'user' ? 'white' : '#111827',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    boxShadow: msg.role === 'assistant' ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'
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
                                placeholder="Type your message..."
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
