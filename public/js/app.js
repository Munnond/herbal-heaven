document.addEventListener('DOMContentLoaded', () => {
    M.Sidenav.init(document.querySelectorAll('.sidenav'));
    M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'));
    M.Modal.init(document.querySelectorAll('.modal'));

    checkAuth();

    setupEventListeners();
});

async function checkAuth() {
    const token = localStorage.getItem('token');

    if (!token) return showLoggedOutUI();

    try {
        const response = await fetch('/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
            showLoggedInUI();
        } else {
            localStorage.removeItem('token');
            showLoggedOutUI();
        }
    } catch (err) {
        console.error('Auth check error:', err);
        showLoggedOutUI();
    }
}

function showLoggedInUI() {
    toggleVisibility('.logged-in', true);
    toggleVisibility('.logged-out', false);
}

function showLoggedOutUI() {
    toggleVisibility('.logged-in', false);
    toggleVisibility('.logged-out', true);
}

function toggleVisibility(selector, show) {
    document.querySelectorAll(selector).forEach(el => {
        el.style.display = show ? 'block' : 'none';
    });
}

function setupEventListeners() {
    document.querySelectorAll('#logout').forEach(btn =>
        btn.addEventListener('click', handleLogout)
    );

    document.querySelectorAll('.add-to-cart').forEach(btn =>
        btn.addEventListener('click', handleAddToCart)
    );

    const searchForm = document.querySelector('#search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    showLoggedOutUI();
    window.location.href = '/';
}

async function handleAddToCart(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const productId = e.target.dataset.productId;

    if (!token) {
        return showToast('Please login to add items to cart', 'orange');
    }

    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (!response.ok) throw new Error('Failed to add item');
        showToast('Item added to cart');
    } catch (err) {
        handleError(err);
    }
}


function handleSearch(e) {
    e.preventDefault();
    const input = document.querySelector('#search-input');
    const term = input?.value?.trim();
    if (term) {
        window.location.href = `/products?search=${encodeURIComponent(term)}`;
    }
}


let stripe = null;
let elements = null;

async function initializeStripe() {
    try {
        const response = await fetch('/api/payment/config');
        const { publishableKey } = await response.json();

        stripe = Stripe(publishableKey);
        elements = stripe.elements();

        const card = elements.create('card');
        card.mount('#card-element');

        card.on('change', event => {
            const errorEl = document.getElementById('card-errors');
            errorEl.textContent = event.error ? event.error.message : '';
        });
    } catch (err) {
        handleError(err);
    }
}

function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes,
        displayLength: 3000
    });
}

function handleError(error) {
    console.error(error);
    showToast(error.message || 'Something went wrong!', 'red');
}
