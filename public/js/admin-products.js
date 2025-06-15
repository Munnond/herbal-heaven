let currentProductId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.Sidenav.init(document.querySelectorAll('.sidenav'));
    M.Modal.init(document.querySelectorAll('.modal'));
    M.FormSelect.init(document.querySelectorAll('select'));

    // Load initial data
    loadProducts();
    loadCategories();
});

// Load Products
async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await response.json();
        
        const tbody = document.getElementById('products-table');
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <img src="${product.images[0] || '/images/placeholder.jpg'}" 
                         alt="${product.name}" 
                         style="width: 50px; height: 50px; object-fit: cover;">
                </td>
                <td>${product.name}</td>
                <td>${product.category?.name || 'Uncategorized'}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="btn-small green" onclick="editProduct('${product._id}')">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn-small red" onclick="deleteProduct('${product._id}')">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'red');
    }
}

// Load Categories
async function loadCategories() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await response.json();
        
        const select = document.getElementById('product-category');
        select.innerHTML = `
            <option value="" disabled selected>Choose category</option>
            ${categories.map(category => `
                <option value="${category._id}">${category.name}</option>
            `).join('')}
        `;
        M.FormSelect.init(select);
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error loading categories', 'red');
    }
}

// Show Add Product Modal
function showAddProductModal() {
    currentProductId = null;
    const modal = M.Modal.getInstance(document.getElementById('product-modal'));
    document.getElementById('modal-title').textContent = 'Add Product';
    document.getElementById('product-form').reset();
    M.updateTextFields();
    modal.open();
}

// Edit Product
async function editProduct(productId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const product = await response.json();
        
        currentProductId = productId;
        const modal = M.Modal.getInstance(document.getElementById('product-modal'));
        document.getElementById('modal-title').textContent = 'Edit Product';
        
        // Fill form fields
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-category').value = product.category?._id;
        
        M.updateTextFields();
        M.FormSelect.init(document.getElementById('product-category'));
        modal.open();
    } catch (error) {
        console.error('Error loading product details:', error);
        showToast('Error loading product details', 'red');
    }
}

// Save Product
async function saveProduct() {
    try {
        // Get form values
        const name = document.getElementById('product-name').value;
        const description = document.getElementById('product-description').value;
        const price = document.getElementById('product-price').value;
        const stock = document.getElementById('product-stock').value;
        const category = document.getElementById('product-category').value;
        const imageUrl = document.getElementById('product-images').value;

        // Validate required fields
        if (!name || !description || !price || !stock || !category || !imageUrl) {
            showToast('Please fill in all required fields', 'red');
            return;
        }

        // Create product data
        const productData = {
            name: name,
            description: description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category: category,
            images: [imageUrl]
        };

        // Get the token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('You must be logged in to perform this action', 'red');
            return;
        }

        // Make API call to create product
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create product');
        }

        const savedProduct = await response.json();
        
        // Show success message
        showToast('Product created successfully', 'green');
        
        // Close the modal
        const modal = M.Modal.getInstance(document.getElementById('product-modal'));
        modal.close();
        
        // Refresh the product list
        loadProducts();
        
        // Reset the form
        document.getElementById('product-form').reset();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showToast(error.message || 'Error creating product', 'red');
    }
}

// Delete Product
function deleteProduct(productId) {
    currentProductId = productId;
    const modal = M.Modal.getInstance(document.getElementById('delete-modal'));
    modal.open();
}

// Confirm Delete
async function confirmDelete() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/products/${currentProductId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showToast('Product deleted successfully');
            M.Modal.getInstance(document.getElementById('delete-modal')).close();
            loadProducts();
        } else {
            throw new Error('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Error deleting product', 'red');
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Show toast message
function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
} 