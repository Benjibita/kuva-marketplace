// Sample product data with vendors/brands (Zalora-style)
export const vendors = [
  { id: 1, name: 'Sisera', logo: '✓' },
  { id: 2, name: 'Girley', logo: '✓' },
  { id: 3, name: 'Sanctuary Scents', logo: '✓' },
  { id: 4, name: 'Lux Designs', logo: '✓' },
  { id: 5, name: 'Shades Vogue', logo: '✓' },
  { id: 6, name: 'MobiVerse', logo: '✓' },
  { id: 7, name: 'Sky Gadgets', logo: '✓' },
  { id: 8, name: 'Iconic UG', logo: '✓' },
];

export const categories = [
  {
    id: 1,
    name: 'Shirt',
    count: 170,
    image: 'https://images.unsplash.com/photo-1594938291221-94f18dd6d426?w=400&h=400&fit=crop'
  },
  {
    id: 2,
    name: 'Jacket',
    count: 124,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop'
  },
  {
    id: 3,
    name: 'T-Shirt',
    count: 238,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'
  },
  {
    id: 4,
    name: 'Shoes',
    count: 85,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'
  }
];

export const newArrivals = [
  {
    id: 1,
    name: 'Brown Top',
    type: 'TOP',
    price: '$45.99',
    originalPrice: '$59.99',
    discount: 23,
    vendor: vendors[2], // Zara
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
    rating: 4.5,
    reviews: 124
  },
  {
    id: 2,
    name: 'Yellow Hoodie',
    type: 'HOODIE',
    price: '$59.99',
    originalPrice: '$79.99',
    discount: 25,
    vendor: vendors[3], // H&M
    image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&h=500&fit=crop',
    rating: 4.3,
    reviews: 89
  },
  {
    id: 3,
    name: 'Blue Puffer Vest',
    type: 'VEST',
    price: '$79.99',
    originalPrice: '$99.99',
    discount: 20,
    vendor: vendors[4], // Uniqlo
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
    rating: 4.7,
    reviews: 203
  },
  {
    id: 4,
    name: 'White T-Shirt',
    type: 'T-SHIRT',
    price: '$29.99',
    vendor: vendors[7], // Levi's
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
    rating: 4.6,
    reviews: 156
  },
  {
    id: 5,
    name: 'Denim Jacket',
    type: 'JACKET',
    price: '$89.99',
    originalPrice: '$119.99',
    discount: 25,
    vendor: vendors[7], // Levi's
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
    rating: 4.8,
    reviews: 312
  },
  {
    id: 6,
    name: 'Slim Fit Shirt',
    type: 'SHIRT',
    price: '$54.99',
    vendor: vendors[6], // Topman
    image: 'https://images.unsplash.com/photo-1594938291221-94f18dd6d426?w=400&h=500&fit=crop',
    rating: 4.4,
    reviews: 98
  }
];

export const recommendations = [
  {
    id: 1,
    name: 'Stripped Oxford',
    type: 'SHIRT',
    price: '$51.06',
    originalPrice: '$69.99',
    discount: 27,
    vendor: vendors[6], // Topman
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=500&fit=crop',
    rating: 4.5,
    reviews: 167
  },
  {
    id: 2,
    name: 'Multitempelan',
    type: 'SHOES',
    price: '$31.74',
    originalPrice: '$49.99',
    discount: 36,
    vendor: vendors[1], // Adidas
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop',
    rating: 4.6,
    reviews: 245
  },
  {
    id: 3,
    name: 'L. Pant Linen',
    type: 'PANTS',
    price: '$42.50',
    vendor: vendors[4], // Uniqlo
    image: 'https://images.unsplash.com/photo-1594938291221-94f18dd6d426?w=400&h=500&fit=crop',
    rating: 4.3,
    reviews: 112
  },
  {
    id: 4,
    name: 'Abstract Motif',
    type: 'SHIRT',
    price: '$46.22',
    originalPrice: '$59.99',
    discount: 23,
    vendor: vendors[2], // Zara
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop',
    rating: 4.7,
    reviews: 189
  },
  {
    id: 5,
    name: 'Running Shoes',
    type: 'SHOES',
    price: '$89.99',
    originalPrice: '$129.99',
    discount: 31,
    vendor: vendors[0], // Nike
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop',
    rating: 4.8,
    reviews: 456
  },
  {
    id: 6,
    name: 'Classic Sneakers',
    type: 'SHOES',
    price: '$74.99',
    vendor: vendors[5], // Puma
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop',
    rating: 4.5,
    reviews: 278
  },
  {
    id: 7,
    name: 'Casual T-Shirt',
    type: 'T-SHIRT',
    price: '$24.99',
    originalPrice: '$34.99',
    discount: 29,
    vendor: vendors[3], // H&M
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
    rating: 4.4,
    reviews: 201
  },
  {
    id: 8,
    name: 'Sport Jacket',
    type: 'JACKET',
    price: '$99.99',
    originalPrice: '$139.99',
    discount: 29,
    vendor: vendors[1], // Adidas
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
    rating: 4.6,
    reviews: 334
  }
];
