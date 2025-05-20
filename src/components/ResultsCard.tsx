import React from 'react';

interface ResultsCardProps {
  initialBalance: number;
  finalBalance: number;
  onRestart: () => void;
}

const ResultsCard: React.FC<ResultsCardProps> = ({ 
  initialBalance, 
  finalBalance, 
  onRestart 
}) => {
  const profit = finalBalance - initialBalance;
  const profitPercentage = (profit / initialBalance) * 100;
  const isProfit = profit >= 0;
  
  return (
    <div className="results-card">
      <div className="results-content">
        <h2>Game Complete!</h2>
        
        <div className="results-summary">
          <div className="result-item">
            <div className="result-label">Starting Balance:</div>
            <div className="result-value">${initialBalance.toFixed(2)}</div>
          </div>
          
          <div className="result-item">
            <div className="result-label">Final Balance:</div>
            <div className="result-value">${finalBalance.toFixed(2)}</div>
          </div>
          
          <div className="result-item">
            <div className="result-label">Profit/Loss:</div>
            <div className={`result-value ${isProfit ? 'profit' : 'loss'}`}>
              {isProfit ? '+' : ''}{profit.toFixed(2)} ({isProfit ? '+' : ''}{profitPercentage.toFixed(2)}%)
            </div>
          </div>
        </div>
        
        <div className="results-message">
          {profit > 20 ? 
            <h3>Impressive trading! You've got skills!</h3> :
            profit > 0 ? 
              <h3>Not bad! You made a profit!</h3> :
              <h3>Better luck next time!</h3>
          }
          <p>Can you do better on your next run?</p>
        </div>
        
        <div className="swipe-hint">
          <div className="swipe-arrow">→</div>
          <div>Swipe right to restart</div>
        </div>
      </div>
    </div>
  );
};

export default ResultsCard; 