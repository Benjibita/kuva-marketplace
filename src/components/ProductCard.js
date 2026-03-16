import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <div 
        className="product-image"
        style={{
          backgroundImage: `url(${product.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {product.discount && (
          <div className="discount-badge">
            -{product.discount}%
          </div>
        )}
        <button className="add-to-cart-btn">
          <span className="cart-icon">🛍️</span>
        </button>
      </div>
      <div className="product-info">
        {product.vendor && (
          <p className="product-vendor">{product.vendor.name}</p>
        )}
        <h3 className="product-name">{product.name}</h3>
        <p className="product-type">{product.type}</p>
        {product.rating && (
          <div className="product-rating">
            <span className="rating-stars">★★★★★</span>
            <span className="rating-value">{product.rating}</span>
            {product.reviews && (
              <span className="rating-reviews">({product.reviews})</span>
            )}
          </div>
        )}
        <div className="product-footer">
          <div className="price-container">
            <span className="product-price">{product.price}</span>
            {product.originalPrice && (
              <span className="product-original-price">{product.originalPrice}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
