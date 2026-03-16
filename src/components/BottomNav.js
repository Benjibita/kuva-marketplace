import React from 'react';
import './BottomNav.css';

const BottomNav = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'camera', label: 'Camera', icon: '📷' },
    { id: 'bag', label: 'Bag', icon: '🛍️' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="bottom-nav mobile-only">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${currentView === item.id ? 'active' : ''}`}
          onClick={() => setCurrentView(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;

