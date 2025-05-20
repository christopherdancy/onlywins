import React from 'react';

interface IntroCardProps {
  onStart: () => void;
}

const IntroCard: React.FC<IntroCardProps> = ({ onStart }) => {
  return (
    <div className="intro-card">
      <div className="intro-content">
        <h2>OnlyWins!</h2>
        
        <div className="intro-description">
          <p>Start with $25. Trade 25 charts for maximum profit.</p>
        </div>
        
        <div className="intro-rules">
          <h3>How to Play:</h3>
          <ul>
            <li>
              <div className="rule-action">
                <span className="swipe-direction right">→</span>
                <span>Swipe Right</span>
              </div>
              <div className="rule-description">to enter a position</div>
            </li>
            <li>
              <div className="rule-action">
                <span className="swipe-direction right">→</span>
                <span>Swipe Right again</span>
              </div>
              <div className="rule-description">to double down on your position</div>
            </li>
            <li>
              <div className="rule-action">
                <span className="swipe-direction left">←</span>
                <span>Swipe Left</span>
              </div>
              <div className="rule-description">to exit your position and take profit</div>
            </li>
            <li>
              <div className="rule-action">
                <span className="swipe-direction left">←</span>
                <span>Swipe Left</span>
              </div>
              <div className="rule-description">to skip a chart if you don't want to trade it</div>
            </li>
          </ul>
          
          <div className="time-warning">
            <span className="timer-icon">⏱️</span>
            <span>Each position expires after 30 seconds. Watch your timing!</span>
          </div>
        </div>
        
        <div className="swipe-hint">
          <div className="swipe-arrow">→</div>
          <div>Swipe right to begin</div>
        </div>
      </div>
    </div>
  );
};

export default IntroCard; 