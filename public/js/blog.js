document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.FormSelect.init(document.querySelectorAll('select'));

    // Load initial articles
    loadArticles();

    // Setup event listeners
    setupEventListeners();
});

// Global variables
let currentPage = 1;
let totalPages = 1;
let currentCategory = '';
let currentSearch = '';

// Setup Event Listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', debounce(() => {
        currentSearch = searchInput.value;
        currentPage = 1;
        loadArticles();
    }, 500));

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.addEventListener('change', () => {
        currentCategory = categoryFilter.value;
        currentPage = 1;
        loadArticles();
    });

    // Newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    newsletterForm.addEventListener('submit', handleNewsletterSignup);
}

// Load Articles
async function loadArticles() {
    try {
        // Show loading state
        document.getElementById('article-grid').innerHTML = `
            <div class="center-align">
                <div class="preloader-wrapper big active">
                    <div class="spinner-layer spinner-green-only">
                        <div class="circle-clipper left">
                            <div class="circle"></div>
                        </div>
                        <div class="gap-patch">
                            <div class="circle"></div>
                        </div>
                        <div class="circle-clipper right">
                            <div class="circle"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Build query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: 9
        });

        if (currentCategory) params.append('category', currentCategory);
        if (currentSearch) params.append('search', currentSearch);

        // Fetch articles
        const response = await fetch(`/api/blog/articles?${params}`);
        const data = await response.json();

        // Update pagination info
        totalPages = data.totalPages;
        currentPage = data.currentPage;

        // Display articles
        displayArticles(data.articles);
        updatePagination();

        // Load featured article on first page
        if (currentPage === 1 && !currentSearch && !currentCategory) {
            loadFeaturedArticle();
        } else {
            document.getElementById('featured-article').style.display = 'none';
        }

    } catch (error) {
        console.error('Error loading articles:', error);
        showToast('Error loading articles', 'red');
    }
}

// Display Articles
function displayArticles(articles) {
    const grid = document.getElementById('article-grid');
    const template = document.getElementById('article-template');

    if (articles.length === 0) {
        grid.innerHTML = `
            <div class="col s12 center-align">
                <h5>No articles found</h5>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    articles.forEach(article => {
        const articleElement = template.content.cloneNode(true);

        // Set article data
        articleElement.querySelector('img').src = article.image || '/images/blog/placeholder.jpg';
        articleElement.querySelector('.card-title').textContent = article.title;
        articleElement.querySelector('.article-category').textContent = article.category;
        articleElement.querySelector('.article-excerpt').textContent = truncateText(article.content, 150);
        articleElement.querySelector('.article-date').textContent = formatDate(article.createdAt);
        articleElement.querySelector('.card-action a').href = `/blog/article/${article._id}`;

        grid.appendChild(articleElement);
    });
}

// Load Featured Article
async function loadFeaturedArticle() {
    try {
        const response = await fetch('/api/blog/featured');
        const article = await response.json();

        const featuredSection = document.getElementById('featured-article');
        const template = document.getElementById('featured-article-template');
        const featuredElement = template.content.cloneNode(true);

        // Set featured article data
        featuredElement.querySelector('img').src = article.image || '/images/blog/featured-placeholder.jpg';
        featuredElement.querySelector('.card-title').textContent = article.title;
        featuredElement.querySelector('.article-category').textContent = article.category;
        featuredElement.querySelector('.article-excerpt').textContent = truncateText(article.content, 300);
        featuredElement.querySelector('.author-name').textContent = article.author.name;
        featuredElement.querySelector('.article-date').textContent = formatDate(article.createdAt);
        featuredElement.querySelector('.card-action a').href = `/blog/article/${article._id}`;

        featuredSection.innerHTML = '';
        featuredSection.appendChild(featuredElement);
        featuredSection.style.display = 'block';

    } catch (error) {
        console.error('Error loading featured article:', error);
        document.getElementById('featured-article').style.display = 'none';
    }
}

// Update Pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="${currentPage === 1 ? 'disabled' : 'waves-effect'}">
            <a href="#!" onclick="changePage(${currentPage - 1})">
                <i class="material-icons">chevron_left</i>
            </a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="${currentPage === i ? 'active green' : 'waves-effect'}">
                <a href="#!" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="${currentPage === totalPages ? 'disabled' : 'waves-effect'}">
            <a href="#!" onclick="changePage(${currentPage + 1})">
                <i class="material-icons">chevron_right</i>
            </a>
        </li>
    `;

    pagination.innerHTML = paginationHTML;
}

// Change Page
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadArticles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle Newsletter Signup
async function handleNewsletterSignup(e) {
    e.preventDefault();

    const email = document.getElementById('newsletter-email').value;
    
    try {
        const response = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            showToast('Successfully subscribed to newsletter!');
            document.getElementById('newsletter-email').value = '';
        } else {
            throw new Error('Failed to subscribe');
        }
    } catch (error) {
        console.error('Newsletter signup error:', error);
        showToast('Error subscribing to newsletter', 'red');
    }
}

// Utility Functions
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
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

function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
} 