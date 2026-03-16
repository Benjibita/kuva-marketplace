import React from 'react';
import './CategoryCard.css';

const CategoryCard = ({ category }) => {
  return (
    <div className="category-card">
      <div 
        className="category-image"
        style={{
          backgroundImage: `url(${category.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="category-overlay" />
      </div>
      <div className="category-info">
        <h3 className="category-name">{category.name}</h3>
        <p className="category-count">{category.count} Product</p>
      </div>
    </div>
  );
};

export default CategoryCard;

