document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.FormSelect.init(document.querySelectorAll('select'));

    // Load categories first, then products
    loadCategories().then(() => {
        // Load initial products
        loadProducts();
    });

    // Setup event listeners
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', debounce(loadProducts, 500));

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.addEventListener('change', loadProducts);

    // Sort filter
    const sortFilter = document.getElementById('sort-filter');
    sortFilter.addEventListener('change', loadProducts);

    // Add to cart buttons (delegated)
    document.getElementById('products-grid').addEventListener('click', async function(e) {
        const addToCartBtn = e.target.closest('.add-to-cart');
        if (addToCartBtn) {
            e.preventDefault();
            await handleAddToCart(addToCartBtn.dataset.productId);
        }
    });
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const categoryFilter = document.getElementById('category-filter');
        categoryFilter.innerHTML = `
            <option value="">All Categories</option>
            ${categories.map(category => `
                <option value="${category._id}">${category.name}</option>
            `).join('')}
        `;
        M.FormSelect.init(categoryFilter);
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error loading categories', 'red');
    }
}

// Load Products
async function loadProducts(page = 1) {
    try {
        const searchTerm = document.getElementById('search').value;
        const category = document.getElementById('category-filter').value;
        const sort = document.getElementById('sort-filter').value;

        const queryParams = new URLSearchParams({
            page,
            search: searchTerm,
            category,
            sort
        });

        const response = await fetch(`/api/products?${queryParams}`);
        const data = await response.json();

        displayProducts(data);
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'red');
    }
}

// Display Products
function displayProducts(products) {
    const grid = document.getElementById('products-grid');
    
    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div class="col s12 center-align">
                <h5>No products found</h5>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="col s12 m6 l4">
            <div class="card product-card">
                <div class="card-image">
                    <img src="${product.images[0] || '/images/placeholder.jpg'}" alt="${product.name}">
                    <a class="btn-floating halfway-fab waves-effect waves-light green add-to-cart" data-product-id="${product._id}">
                        <i class="material-icons">add_shopping_cart</i>
                    </a>
                </div>
                <div class="card-content">
                    <span class="card-title">${product.name}</span>
                    <p class="category-tag">${product.category ? product.category.name : 'Uncategorized'}</p>
                    <p class="truncate">${product.description}</p>
                    <div class="price">₹${product.price.toFixed(2)}</div>
                </div>
                <div class="card-action">
                    <a href="/product/${product._id}" class="green-text">View Details</a>
                </div>
            </div>
        </div>
    `).join('');
}

// Add to Cart Handler
async function handleAddToCart(productId) {
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
                quantity: 1
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

// Utility Functions
function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 