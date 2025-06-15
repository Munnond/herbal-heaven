document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login?redirect=/checkout';
        return;
    }

    // Initialize Stripe
    initializeStripe();

    // Load cart data
    loadOrderSummary();

    // Setup event listeners
    setupEventListeners();
});

// Global variables
let stripe;
let elements;
let card;
let shippingData;

// Initialize Stripe
async function initializeStripe() {
    try {
        const response = await fetch('/api/payment/config');
        const { publishableKey } = await response.json();
        
        stripe = Stripe(publishableKey);
        elements = stripe.elements();

        // Create card element
        card = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#32325d',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a'
                }
            }
        });

        // Mount card element
        card.mount('#card-element');

        // Handle card errors
        card.addEventListener('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        showToast('Error initializing payment system', 'red');
    }
}

// Load Order Summary
async function loadOrderSummary() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const cart = await response.json();
        displayOrderSummary(cart);
    } catch (error) {
        console.error('Error loading order summary:', error);
        showToast('Error loading order summary', 'red');
    }
}

// Display Order Summary
function displayOrderSummary(cart) {
    const orderItems = document.getElementById('order-items');
    
    // Display items
    orderItems.innerHTML = cart.items.map(item => `
        <div class="order-item">
            <div class="item-details">
                <span class="item-name">${item.product.name}</span>
                <span class="item-quantity">x${item.quantity}</span>
            </div>
            <span class="item-price">₹${(item.product.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => 
        total + (item.product.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over ₹50
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    // Update summary
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `₹${shipping.toFixed(2)}`;
    document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

// Setup Event Listeners
function setupEventListeners() {
    // Shipping form submission
    document.getElementById('shipping-details').addEventListener('submit', handleShippingSubmit);

    // Payment form submission
    document.getElementById('payment-details').addEventListener('submit', handlePaymentSubmit);

    // Back button
    document.getElementById('back-to-shipping').addEventListener('click', () => {
        showSection('shipping-form');
        updateProgressBar('shipping-step');
    });
}

// Handle Shipping Form Submit
function handleShippingSubmit(e) {
    e.preventDefault();

    // Collect shipping data
    shippingData = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('postal-code').value,
        phone: document.getElementById('phone').value
    };

    // Proceed to payment section
    showSection('payment-form');
    updateProgressBar('payment-step');
}

// Handle Payment Form Submit
async function handlePaymentSubmit(e) {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        // Create payment intent
        const token = localStorage.getItem('token');
        const response = await fetch('/api/payment/create-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ shippingData })
        });

        const { clientSecret } = await response.json();

        // Confirm payment
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: `${shippingData.firstName} ${shippingData.lastName}`,
                    address: {
                        line1: shippingData.address,
                        city: shippingData.city,
                        state: shippingData.state,
                        postal_code: shippingData.postalCode
                    }
                }
            }
        });

        if (result.error) {
            throw new Error(result.error.message);
        }

        // Handle successful payment
        await handleSuccessfulPayment(result.paymentIntent);

    } catch (error) {
        console.error('Payment error:', error);
        showToast(error.message || 'Payment failed', 'red');
        submitButton.disabled = false;
    }
}

// Handle Successful Payment
async function handleSuccessfulPayment(paymentIntent) {
    try {
        // Create order
        const token = localStorage.getItem('token');
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                shippingDetails: shippingData
            })
        });

        const order = await response.json();

        // Display confirmation
        document.getElementById('order-number').textContent = order._id;
        showSection('confirmation-section');
        updateProgressBar('confirmation-step');

        // Clear cart
        localStorage.removeItem('cart');

    } catch (error) {
        console.error('Error creating order:', error);
        showToast('Error creating order', 'red');
    }
}

// Show Section
function showSection(sectionId) {
    document.querySelectorAll('.checkout-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

// Update Progress Bar
function updateProgressBar(stepId) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    const currentStep = document.getElementById(stepId);
    currentStep.classList.add('active');
    
    // Also activate previous steps
    let prevStep = currentStep.previousElementSibling;
    while (prevStep) {
        prevStep.classList.add('active');
        prevStep = prevStep.previousElementSibling;
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