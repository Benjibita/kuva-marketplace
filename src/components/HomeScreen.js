import React, { useState } from 'react';
import './HomeScreen.css';
import PromoBanner from './PromoBanner';
import CategoryCard from './CategoryCard';
import ProductCard from './ProductCard';
import FeaturedBrands from './FeaturedBrands';
import BottomNav from './BottomNav';
import { categories, newArrivals, recommendations, vendors } from '../data/products';

const HomeScreen = () => {
  const [activeCategory, setActiveCategory] = useState('Men');
  const [currentView, setCurrentView] = useState('home');

  return (
    <div className="home-screen">
      {/* Mobile status bar */}
      <div className="status-bar mobile-only">
      </div>

      {/* Header */}
      <header className="app-header">
        <h1 className="app-logo">Kuva</h1>
        <div className="header-actions">
          <button className="notification-btn">
            <span className="bell-icon">🔔</span>
          </button>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="category-tabs">
        {['Men', 'Women', 'Kids', 'Baby'].map((category) => (
          <button
            key={category}
            className={`tab-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Promotional Banner */}
        <PromoBanner />

        {/* Featured Brands Section */}
        <FeaturedBrands vendors={vendors} />

        {/* Category Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Category</h2>
            <button className="see-all-btn">See all</button>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* New Arrival Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">New Arrival</h2>
            <button className="see-all-btn">See all</button>
          </div>
          <div className="product-scroll">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Recommendation Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recommendation</h2>
            <button className="see-all-btn">See all</button>
          </div>
          <div className="recommendation-grid">
            {recommendations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

export default HomeScreen;

