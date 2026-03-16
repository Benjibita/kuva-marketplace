import React from 'react';
import './PromoBanner.css';

const PromoBanner = () => {
  return (
    <div className="promo-banner">
      <div className="promo-content">
        <div className="promo-text">
          <h3 className="promo-title">Women Fashion Collection</h3>
          <p className="promo-subtitle">Super Sale Discount</p>
          <p className="promo-discount">Up to 60%</p>
          <button className="explore-btn">Explore Now</button>
        </div>
        <div 
          className="promo-image"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="promo-image-overlay">
            <div className="denim-text">DENIM</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;

