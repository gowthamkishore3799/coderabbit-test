import React from 'react';
import { ProductSchema, type Product } from './zodv4-features';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  featured?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  featured = false
}) => {
  // Validate product with Zod v4
  const validatedProduct = ProductSchema.parse(product);

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border-2 ring-3 transition-all duration-300
        hover:shadow-xl hover:-translate-y-1
        ${featured ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}
        animate-fade-in
        @container
      `}
    >
      {/* Tailwind v4: Container queries with @container */}
      <div className="@sm:flex @sm:items-start p-4">

        {/* Product Image with Tailwind v4 gradient */}
        <div className="relative w-full @sm:w-1/3 aspect-square rounded-md overflow-hidden bg-gradient-to-br from-primary-100 via-accent-light to-primary-200">
          {featured && (
            <div className="absolute top-2 right-2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce-slow z-10">
              Featured
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center text-primary-700 font-mono text-sm">
            {validatedProduct.sku}
          </div>
        </div>

        {/* Product Details */}
        <div className="@sm:ml-4 @sm:flex-1 mt-4 @sm:mt-0 text-2xl">
          {/* Product Name with Tailwind v4 typography */}
          <h3 className="font-sans font-bold text-xl text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
            {validatedProduct.name}
          </h3>

          {/* Product Slug */}
          <p className="font-mono text-xs text-gray-500 mt-1">
            /{validatedProduct.slug}
          </p>

          {/* Category Badge */}
          <div className="mt-2 inline-block">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
              {validatedProduct.category}
            </span>
          </div>

          {/* Tags with Tailwind v4 spacing */}
          <div className="flex flex-wrap gap-2 mt-3">
            {validatedProduct.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                #{tag}
              </span>
            ))}
            {validatedProduct.tags.length > 3 && (
              <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-500">
                +{validatedProduct.tags.length - 3} more
              </span>
            )}
          </div>

          {/* Price and Quantity with Tailwind v4 colors */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary-600">
                ${validatedProduct.price.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Stock: {validatedProduct.quantity} units
              </div>
            </div>

            {/* Color indicator if available */}
            {validatedProduct.color && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Color:</span>
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: validatedProduct.color }}
                  title={validatedProduct.color}
                />
              </div>
            )}
          </div>

          {/* Dimensions if available - Tailwind v4 grid */}
          {validatedProduct.dimensions && (
            <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600 font-semibold mb-2">Dimensions</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">L:</span>{' '}
                  <span className="font-mono">{validatedProduct.dimensions.length}{validatedProduct.dimensions.unit}</span>
                </div>
                <div>
                  <span className="text-gray-500">W:</span>{' '}
                  <span className="font-mono">{validatedProduct.dimensions.width}{validatedProduct.dimensions.unit}</span>
                </div>
                <div>
                  <span className="text-gray-500">H:</span>{' '}
                  <span className="font-mono">{validatedProduct.dimensions.height}{validatedProduct.dimensions.unit}</span>
                </div>
              </div>
            </div>
          )}

          {/* Add to Cart Button - Tailwind v4 enhanced states */}
          <button
            onClick={() => onAddToCart?.(validatedProduct)}
            disabled={validatedProduct.quantity === 0}
            className={`
              mt-4 w-full py-3 px-4 rounded-lg font-semibold text-sm
              transition-all duration-200 transform
              focus:outline-none focus:ring-4 focus:ring-primary-300
              disabled:opacity-50 disabled:cursor-not-allowed
              ${validatedProduct.quantity > 0
                ? 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500'
              }
              supports-[backdrop-filter]:backdrop-blur-sm
            `}
          >
            {validatedProduct.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>

          {/* Low stock warning with Tailwind v4 animations */}
          {validatedProduct.quantity > 0 && validatedProduct.quantity < 10 && (
            <div className="mt-2 flex items-center text-xs text-amber-600 animate-pulse">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Only {validatedProduct.quantity} left in stock!
            </div>
          )}
        </div>
      </div>

      {/* Tailwind v4: Advanced hover effects */}
      <div className="absolute inset-0 border-2 border-transparent hover:border-primary-400 rounded-lg pointer-events-none transition-colors duration-300" />
    </div>
  );
};

export default ProductCard;
