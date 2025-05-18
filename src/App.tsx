import React from 'react';
import CardStack from './components/CardStack';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>OnlyWins</h1>
      </header>
      <main className="app-main">
        <CardStack />
      </main>
    </div>
  );
};

export default App;
