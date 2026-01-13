import { useState, useRef, useEffect } from 'react';
import { CopilotMessage } from './CopilotMessage';
import { getCopilotResponse, CopilotResponse } from '../../mock/copilot';
import styles from './CopilotWidget.module.css';

interface CopilotWidgetProps {
  sector?: string;
}

export function CopilotWidget({ sector }: CopilotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; response?: CopilotResponse }>>([
    {
      text: `Hello! I can help you analyze news and signals for ${sector || 'this sector'}. Ask me anything!`,
      isUser: false,
      response: {
        answer: `Hello! I can help you analyze news and signals for ${sector || 'this sector'}. Ask me anything!`,
        steps: [],
        citations: []
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    const newUserMessage = {
      text: userMessage,
      isUser: true
    };

    setMessages((prev) => [...prev, newUserMessage]);

    // Simulate async response
    setTimeout(() => {
      const response = getCopilotResponse(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          text: response.answer,
          isUser: false,
          response
        }
      ]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      {isOpen ? (
        <div className={styles.widget}>
          <div className={styles.header}>
            <h3 className={styles.title}>Copilot</h3>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className={styles.messages}>
            {messages.map((msg, index) => (
              <CopilotMessage
                key={index}
                message={msg.text}
                isUser={msg.isUser}
                citations={msg.response?.citations}
                steps={msg.response?.steps}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              className={styles.input}
            />
            <button onClick={handleSend} className={styles.sendButton} disabled={!inputValue.trim()}>
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={styles.toggleButton}
          aria-label="Open Copilot"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
