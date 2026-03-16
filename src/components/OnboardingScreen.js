import React from 'react';
import './OnboardingScreen.css';

const OnboardingScreen = ({ onGetStarted, onLogin }) => {
  // Sample fashion images - using Unsplash API with fashion queries
  const fashionImageIds = [
    '1520006400000', '1520066400000', '1520126400000',
    '1520186400000', '1520246400000', '1520306400000',
    '1520366400000', '1520426400000', '1520486400000'
  ];
  
  const fashionImages = fashionImageIds.map((id, i) => ({
    id: i + 1,
    url: `https://source.unsplash.com/400x400/?fashion,model,${i + 1}`
  }));

  return (
    <div className="onboarding-screen">
      {/* Mobile status bar */}
      <div className="status-bar mobile-only">
        <span className="time">9:41</span>
        <div className="status-icons">
          <span className="carrier">Chevron</span>
          <div className="signal-icon">📶</div>
          <div className="battery-icon">🔋</div>
        </div>
      </div>

      {/* Image Grid */}
      <div className="image-grid">
        {fashionImages.map((image, index) => (
          <div 
            key={image.id} 
            className={`grid-item grid-item-${index + 1}`}
            style={{
              backgroundImage: `url(${image.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#e0e0e0'
            }}
          />
        ))}
      </div>

      {/* Footer CTA Section */}
      <div className="onboarding-footer">
        <div className="footer-content">
          <p className="footer-subtitle">EXPLORE NEW COLLECTION</p>
          <h1 className="footer-title">
            Upgrade Your Style ✨ With <span className="brand-name">Clothink.</span>
          </h1>
          <button className="get-started-btn" onClick={onGetStarted}>
            Get Started
          </button>
          <p className="login-prompt">
            Already have an account? <span className="login-link" onClick={onLogin}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;

