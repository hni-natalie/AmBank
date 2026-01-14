import React, { useState } from 'react';
import styles from './LandingPage.module.css';

interface LandingPageProps {
  onCardClick: (cardType: string) => void;
  onMessageSend?: (message: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Card {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const cards: Card[] = [
  {
    id: 'pick-stock',
    title: 'Help me pick stock',
    description: 'Get personalized stock recommendations based on your preferences',
    icon: '📈'
  },
  {
    id: 'portfolio-analysis',
    title: 'Analyze my portfolio',
    description: 'Get insights and recommendations for your current investments',
    icon: '💼'
  },
  {
    id: 'risk-assessment',
    title: 'Assess my risk',
    description: 'Understand your risk tolerance and get suitable investment options',
    icon: '⚖️'
  },
  {
    id: 'investment-strategy',
    title: 'Build investment strategy',
    description: 'Create a comprehensive investment strategy tailored to your goals',
    icon: '🎯'
  }
];


/**
 * LandingPage component - ChatGPT-style interface with message column, cards, and chat input
 * Desktop-width layout with white and dark blue theme
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onCardClick, onMessageSend }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Handle card click if message matches a card
    const matchingCard = cards.find(card => 
      messageText.toLowerCase().includes(card.title.toLowerCase())
    );
    if (matchingCard) {
      setTimeout(() => onCardClick(matchingCard.id), 500);
    } else if (onMessageSend) {
      onMessageSend(messageText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {/* Header with Logo and Product Name - Upper Middle */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            💼
          </div>
          <h1 className={styles.title}>
            InvestAI
          </h1>
        </div>
        <p className={styles.subtitle}>
          Your intelligent investment assistant
        </p>
      </div>

      {/* Suggested Messages and Message Column */}
      {messages.length === 0 ? (
        <>
          {/* Suggested Messages Section */}
          <div className={styles.suggestedSection}>
            {/* Welcome Message */}
            <div className={styles.welcomeMessage}>
              <div className={styles.avatar}>
                💼
              </div>
              <div className={styles.messageBubble}>
                <p className={styles.messageText}>
                  Hello! I'm InvestAI, your investment assistant. How can I help you today?
                </p>
              </div>
            </div>
          </div>

          {/* Cards Grid - Below Suggested Messages */}
          <div className={styles.cardsSection}>
            <div className={styles.cardsGrid}>
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => onCardClick(card.id)}
                  className={styles.card}
                >
                  <div className={styles.cardIcon}>
                    {card.icon}
                  </div>
                  <h3 className={styles.cardTitle}>
                    {card.title}
                  </h3>
                  <p className={styles.cardDescription}>
                    {card.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Message History Column */
        <div className={styles.messageColumn}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${
                msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant
              }`}
            >
              {msg.role === 'assistant' && (
                <div className={styles.avatar}>
                  💼
                </div>
              )}
              <div
                className={`${styles.messageContent} ${
                  msg.role === 'user' ? styles.messageUser : styles.messageAssistant
                }`}
              >
                <p className={styles.messageTextContent}>
                  {msg.content}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className={styles.userAvatar}>
                  👤
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat Input Box - Large Desktop Size */}
      <div className={styles.chatInputSection}>
        <div className={styles.chatInputContainer}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message InvestAI..."
            className={styles.chatTextarea}
            rows={2}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
            className={styles.sendButton}
          >
            <svg className={styles.sendIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.5 8L14.5 1L10.5 8L14.5 15L1.5 8Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
