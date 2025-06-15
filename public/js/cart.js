document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login?redirect=/cart';
        return;
    }

    // Load cart data
    loadCart();

    // Setup event listeners
    setupEventListeners();
});

// Load Cart
async function loadCart() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const cart = await response.json();
        displayCart(cart);
        updateOrderSummary(cart);
    } catch (error) {
        console.error('Error loading cart:', error);
        showToast('Error loading cart', 'red');
    }
}

// Display Cart
function displayCart(cart) {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const template = document.getElementById('cart-item-template');

    if (!cart.items || cart.items.length === 0) {
        emptyCartMessage.style.display = 'block';
        return;
    }

    emptyCartMessage.style.display = 'none';
    cartItemsContainer.innerHTML = '';

    cart.items.forEach(item => {
        const cartItem = template.content.cloneNode(true);
        
        // Set item data
        cartItem.querySelector('.cart-item').dataset.itemId = item._id;
        cartItem.querySelector('img').src = item.product.images[0] || '/images/placeholder.jpg';
        cartItem.querySelector('.product-name').textContent = item.product.name;
        cartItem.querySelector('.product-price').textContent = `₹${item.product.price.toFixed(2)}`;
        cartItem.querySelector('.quantity').value = item.quantity;
        cartItem.querySelector('.quantity').dataset.maxStock = item.product.stock;

        cartItemsContainer.appendChild(cartItem);
    });
}

// Update Order Summary
function updateOrderSummary(cart) {
    let subtotal = 0;
    if (cart.items) {
        subtotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }

    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over ₹50
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `₹${shipping.toFixed(2)}`;
    document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;

    // Enable/disable checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = subtotal === 0;
}

// Setup Event Listeners
function setupEventListeners() {
    // Quantity controls
    document.addEventListener('click', async function(e) {
        if (e.target.closest('.decrease-quantity')) {
            const itemContainer = e.target.closest('.cart-item');
            const quantityInput = itemContainer.querySelector('.quantity');
            const decreaseBtn = itemContainer.querySelector('.decrease-quantity');
            decreaseBtn.disabled = true;
            if (parseInt(quantityInput.value) > 1) {
                // Optimistically update UI
                quantityInput.value = parseInt(quantityInput.value) - 1;
                await updateItemQuantity(
                    itemContainer.dataset.itemId,
                    parseInt(quantityInput.value)
                );
            }
            decreaseBtn.disabled = false;
        }

        if (e.target.closest('.increase-quantity')) {
            const itemContainer = e.target.closest('.cart-item');
            const quantityInput = itemContainer.querySelector('.quantity');
            const increaseBtn = itemContainer.querySelector('.increase-quantity');
            const maxStock = parseInt(quantityInput.dataset.maxStock);
            increaseBtn.disabled = true;
            if (parseInt(quantityInput.value) < maxStock) {
                // Optimistically update UI
                quantityInput.value = parseInt(quantityInput.value) + 1;
                await updateItemQuantity(
                    itemContainer.dataset.itemId,
                    parseInt(quantityInput.value)
                );
            }
            increaseBtn.disabled = false;
        }
    });

    // Remove item
    document.addEventListener('click', async function(e) {
        if (e.target.closest('.remove-item')) {
            const itemContainer = e.target.closest('.cart-item');
            // Optimistically remove from DOM
            itemContainer.remove();
            await removeItem(itemContainer.dataset.itemId);
        }
    });

    // Quantity manual input
    document.addEventListener('change', async function(e) {
        if (e.target.matches('.quantity')) {
            const itemContainer = e.target.closest('.cart-item');
            const maxStock = parseInt(e.target.dataset.maxStock);
            let quantity = parseInt(e.target.value);

            // Validate quantity
            if (isNaN(quantity) || quantity < 1) {
                quantity = 1;
            } else if (quantity > maxStock) {
                quantity = maxStock;
            }

            // Optimistically update UI
            e.target.value = quantity;
            await updateItemQuantity(itemContainer.dataset.itemId, quantity);
        }
    });

    // Apply promo code
    document.getElementById('apply-promo').addEventListener('click', applyPromoCode);

    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', proceedToCheckout);
}

// Update Item Quantity
async function updateItemQuantity(itemId, quantity) {
    // try {
    //     const token = localStorage.getItem('token');
    //     const response = await fetch(`/api/cart/update/${itemId}`, {
    //         method: 'PUT',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${token}`
    //         },
    //         body: JSON.stringify({ quantity })
    //     });

    //     if (response.ok) {
    //         loadCart(); // Refresh cart
    //     } else {
    //         const data = await response.json();
    //         throw new Error(data.message || data.error || 'Failed to update quantity');
    //     }
    // } catch (error) {
    //     console.error('Error updating quantity:', error);
    //     showToast(error.message || 'Error updating quantity', 'red');
    // }
}

// Remove Item
async function removeItem(itemId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cart/remove/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadCart(); // Refresh cart
            showToast('Item removed from cart');
        } else {
            const data = await response.json();
            throw new Error(data.message || data.error || 'Failed to remove item');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showToast(error.message || 'Error removing item', 'red');
    }
}

// Apply Promo Code
async function applyPromoCode() {
    const promoCode = document.getElementById('promo-code').value;
    if (!promoCode.trim()) {
        showToast('Please enter a promo code', 'orange');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/cart/promo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code: promoCode })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Promo code applied successfully', 'green');
            loadCart(); // Refresh cart with discount
        } else {
            throw new Error(data.message || 'Invalid promo code');
        }
    } catch (error) {
        console.error('Error applying promo code:', error);
        showToast(error.message || 'Error applying promo code', 'red');
    }
}

// Proceed to Checkout
async function proceedToCheckout() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
            window.location.href = '/login?redirect=/cart';
            return;
        }
        
        // Get user's address from profile or use a default one for now
        const deliveryAddress = {
            street: "Default Street",
            city: "Default City",
            state: "Default State",
            postalCode: "12345"
        };
        
        // Create order directly without payment
        const response = await fetch('/api/orders/direct-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                deliveryAddress
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success message
            showToast('Order placed successfully!', 'green');
            
            // Redirect to order confirmation page
            setTimeout(() => {
                window.location.href = `/order-confirmation.html?id=${data.order._id}`;
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to place order');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showToast(error.message || 'Error placing order', 'red');
    }
}

// Show Toast Message
function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
} 