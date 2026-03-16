import React from 'react';
import './FeaturedBrands.css';

const FeaturedBrands = ({ vendors }) => {
  return (
    <section className="featured-brands-section">
      <div className="section-header">
        <h2 className="section-title">Featured Brands</h2>
        <button className="see-all-btn">See all</button>
      </div>
      <div className="brands-grid">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="brand-card">
            <div className="brand-logo">{vendor.logo}</div>
            <p className="brand-name">{vendor.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedBrands;

