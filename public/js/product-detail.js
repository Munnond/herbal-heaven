document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.Tabs.init(document.querySelectorAll('.tabs'));
    M.FormSelect.init(document.querySelectorAll('select'));
    M.Textarea.init(document.querySelectorAll('.materialize-textarea'));

    // Get product ID from URL
    const productId = window.location.pathname.split('/').pop();
    
    // Load product details
    loadProductDetails(productId);

    // Setup event listeners
    setupEventListeners(productId);
});

// Event Listeners
function setupEventListeners(productId) {
    // Quantity controls
    document.getElementById('decrease-quantity').addEventListener('click', () => {
        const quantityInput = document.getElementById('quantity');
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });

    document.getElementById('increase-quantity').addEventListener('click', () => {
        const quantityInput = document.getElementById('quantity');
        const currentValue = parseInt(quantityInput.value);
        const maxStock = parseInt(quantityInput.dataset.maxStock);
        if (currentValue < maxStock) {
            quantityInput.value = currentValue + 1;
        }
    });

    // Add to cart
    document.getElementById('add-to-cart').addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('quantity').value);
        handleAddToCart(productId, quantity);
    });

    // Image thumbnails
    document.getElementById('image-thumbnails').addEventListener('click', (e) => {
        const thumbnail = e.target.closest('.thumbnail');
        if (thumbnail) {
            document.getElementById('main-product-image').src = thumbnail.src;
        }
    });

    // Submit review
    document.getElementById('submit-review').addEventListener('click', () => {
        handleSubmitReview(productId);
    });
}

// Load Product Details
async function loadProductDetails(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        const product = await response.json();

        // Update product information
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-price').textContent = `₹${product.price.toFixed(2)}`;
        document.getElementById('product-description').textContent = product.description;
        document.getElementById('stock-status').textContent = 
            product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock';
        
        // Set max stock for quantity input
        document.getElementById('quantity').dataset.maxStock = product.stock;

        // Update images
        if (product.images && product.images.length > 0) {
            document.getElementById('main-product-image').src = product.images[0];
            document.getElementById('image-thumbnails').innerHTML = product.images
                .map(image => `
                    <img src="${image}" alt="Product thumbnail" class="thumbnail">
                `).join('');
        }

        // Update benefits list
        if (product.benefits && product.benefits.length > 0) {
            document.getElementById('benefits-list').innerHTML = product.benefits
                .map(benefit => `<li><i class="material-icons tiny">check</i> ${benefit}</li>`)
                .join('');
        }

        // Update details tab
        document.getElementById('details-content').innerHTML = `
            <h5>Product Details</h5>
            <p>${product.description}</p>
            <ul>
                <li><strong>Category:</strong> ${product.category}</li>
                <li><strong>SKU:</strong> ${product._id}</li>
                <li><strong>Origin:</strong> ${product.origin || 'Not specified'}</li>
            </ul>
        `;

        // Update usage instructions tab
        document.getElementById('usage-content').innerHTML = `
            <h5>Usage Instructions</h5>
            <p>${product.usageInstructions || 'Please consult with a healthcare professional for usage instructions.'}</p>
            <div class="warning">
                <i class="material-icons left">warning</i>
                <p>Always read the label and use only as directed. If symptoms persist, please consult your healthcare professional.</p>
            </div>
        `;

        // Load reviews
        loadProductReviews(productId);

    } catch (error) {
        console.error('Error loading product details:', error);
        showToast('Error loading product details', 'red');
    }
}

// Load Product Reviews
async function loadProductReviews(productId) {
    try {
        const response = await fetch(`/api/products/${productId}/reviews`);
        const reviews = await response.json();

        const reviewsContent = document.getElementById('reviews-content');
        if (reviews.length === 0) {
            reviewsContent.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
            return;
        }

        reviewsContent.innerHTML = reviews.map(review => `
            <div class="review">
                <div class="review-header">
                    <span class="reviewer">${review.user.name}</span>
                    <span class="rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </span>
                    <span class="date">${new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p class="review-content">${review.content}</p>
            </div>
        `).join('<div class="divider"></div>');

    } catch (error) {
        console.error('Error loading reviews:', error);
        showToast('Error loading reviews', 'red');
    }
}

// Handle Add to Cart
async function handleAddToCart(productId, quantity) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login to add items to cart', 'orange');
            return;
        }

        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId,
                quantity
            })
        });

        if (response.ok) {
            showToast('Product added to cart');
        } else {
            throw new Error('Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Error adding to cart', 'red');
    }
}

// Handle Submit Review
async function handleSubmitReview(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login to submit a review', 'orange');
            return;
        }

        const rating = document.getElementById('rating').value;
        const content = document.getElementById('review-text').value;

        if (!content.trim()) {
            showToast('Please write your review', 'orange');
            return;
        }

        const response = await fetch(`/api/products/${productId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                rating,
                content
            })
        });

        if (response.ok) {
            showToast('Review submitted successfully');
            document.getElementById('review-text').value = '';
            loadProductReviews(productId);
        } else {
            throw new Error('Failed to submit review');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Error submitting review', 'red');
    }
}

// Utility Functions
function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
} 