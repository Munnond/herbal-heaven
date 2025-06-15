document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.Textarea.init(document.querySelectorAll('.materialize-textarea'));

    // Get article ID from URL
    const articleId = window.location.pathname.split('/').pop();

    // Load article content
    loadArticle(articleId);

    // Setup event listeners
    setupEventListeners(articleId);
});

// Global variables
let currentPage = 1;
let totalPages = 1;
let commentsPerPage = 10;

// Load Article
async function loadArticle(articleId) {
    try {
        const response = await fetch(`/api/blog/articles/${articleId}`);
        const article = await response.json();

        // Update page title
        document.title = `${article.title} - Herbal Heaven`;

        // Display article content
        displayArticle(article);

        // Load related content
        loadRelatedArticles(article.category, articleId);
        loadPopularTags();
        loadComments(articleId);

    } catch (error) {
        console.error('Error loading article:', error);
        showToast('Error loading article', 'red');
    }
}

// Display Article
function displayArticle(article) {
    // Set article header
    document.getElementById('article-title').textContent = article.title;
    document.querySelector('.article-category').textContent = article.category;
    document.querySelector('.article-date').textContent = formatDate(article.createdAt);
    document.querySelector('.author-name').textContent = article.author.name;

    // Set article image
    const articleImage = document.getElementById('article-image');
    articleImage.src = article.image || '/images/blog/placeholder.jpg';
    articleImage.alt = article.title;

    // Set article content
    document.getElementById('article-content').innerHTML = article.content;

    // Set article tags
    const tagsContainer = document.getElementById('article-tags');
    tagsContainer.innerHTML = article.tags.map(tag => 
        `<a href="/blog/tag/${tag}" class="chip">${tag}</a>`
    ).join('');

    // Set author info
    document.getElementById('author-image').src = article.author.image || '/images/avatars/default.jpg';
    document.getElementById('author-name').textContent = article.author.name;
    document.getElementById('author-bio').textContent = article.author.bio;

    // Set author social links
    const authorSocial = document.querySelector('.author-social');
    authorSocial.innerHTML = '';

    if (article.author.social) {
        if (article.author.social.twitter) {
            authorSocial.innerHTML += `
                <a href="${article.author.social.twitter}" target="_blank" class="btn-floating btn-small waves-effect waves-light light-blue">
                    <i class="material-icons">twitter</i>
                </a>
            `;
        }
        if (article.author.social.linkedin) {
            authorSocial.innerHTML += `
                <a href="${article.author.social.linkedin}" target="_blank" class="btn-floating btn-small waves-effect waves-light blue darken-3">
                    <i class="material-icons">linkedin</i>
                </a>
            `;
        }
    }

    // Setup social share buttons
    setupSocialShare(article);
}

// Setup Event Listeners
function setupEventListeners(articleId) {
    // Comment form submission
    document.getElementById('comment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await postComment(articleId);
    });

    // Load more comments
    document.getElementById('load-more-comments').addEventListener('click', () => {
        currentPage++;
        loadComments(articleId);
    });

    // Newsletter form
    document.getElementById('newsletter-form').addEventListener('submit', handleNewsletterSignup);

    // Comment actions (delegated events)
    document.getElementById('comments-list').addEventListener('click', async (e) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login to interact with comments', 'orange');
            return;
        }

        if (e.target.closest('.reply-btn')) {
            handleReply(e.target.closest('.comment'));
        }

        if (e.target.closest('.like-btn')) {
            const commentId = e.target.closest('.comment').dataset.commentId;
            await likeComment(commentId);
        }
    });
}

// Load Comments
async function loadComments(articleId) {
    try {
        const response = await fetch(`/api/blog/articles/${articleId}/comments?page=${currentPage}&limit=${commentsPerPage}`);
        const data = await response.json();

        totalPages = data.totalPages;
        displayComments(data.comments, currentPage === 1);

        // Show/hide load more button
        const loadMoreBtn = document.getElementById('load-more-comments');
        loadMoreBtn.style.display = currentPage < totalPages ? 'block' : 'none';

    } catch (error) {
        console.error('Error loading comments:', error);
        showToast('Error loading comments', 'red');
    }
}

// Display Comments
function displayComments(comments, clearExisting = true) {
    const commentsList = document.getElementById('comments-list');
    const template = document.getElementById('comment-template');

    if (clearExisting) {
        commentsList.innerHTML = '';
    }

    comments.forEach(comment => {
        const commentElement = template.content.cloneNode(true);
        const commentDiv = commentElement.querySelector('.comment');

        commentDiv.dataset.commentId = comment._id;
        commentDiv.querySelector('img').src = comment.user.avatar || '/images/avatars/default.jpg';
        commentDiv.querySelector('.comment-author').textContent = comment.user.name;
        commentDiv.querySelector('.comment-date').textContent = formatDate(comment.createdAt);
        commentDiv.querySelector('.comment-content').textContent = comment.content;
        commentDiv.querySelector('.likes-count').textContent = comment.likes;

        // Add replies if any
        if (comment.replies && comment.replies.length > 0) {
            const repliesContainer = commentDiv.querySelector('.comment-replies');
            comment.replies.forEach(reply => {
                const replyElement = template.content.cloneNode(true);
                const replyDiv = replyElement.querySelector('.comment');

                replyDiv.dataset.commentId = reply._id;
                replyDiv.querySelector('img').src = reply.user.avatar || '/images/avatars/default.jpg';
                replyDiv.querySelector('.comment-author').textContent = reply.user.name;
                replyDiv.querySelector('.comment-date').textContent = formatDate(reply.createdAt);
                replyDiv.querySelector('.comment-content').textContent = reply.content;
                replyDiv.querySelector('.likes-count').textContent = reply.likes;

                repliesContainer.appendChild(replyDiv);
            });
        }

        commentsList.appendChild(commentElement);
    });
}

// Post Comment
async function postComment(articleId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login to post a comment', 'orange');
        return;
    }

    const commentText = document.getElementById('comment-text').value;
    if (!commentText.trim()) return;

    try {
        const response = await fetch(`/api/blog/articles/${articleId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: commentText })
        });

        if (response.ok) {
            document.getElementById('comment-text').value = '';
            M.textareaAutoResize(document.getElementById('comment-text'));
            currentPage = 1;
            loadComments(articleId);
            showToast('Comment posted successfully');
        } else {
            throw new Error('Failed to post comment');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        showToast('Error posting comment', 'red');
    }
}

// Handle Reply
function handleReply(commentElement) {
    const existingForm = document.querySelector('.reply-form');
    if (existingForm) {
        existingForm.remove();
    }

    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.innerHTML = `
        <div class="input-field">
            <textarea class="materialize-textarea" required></textarea>
            <label>Write a reply</label>
        </div>
        <button class="btn waves-effect waves-light green">Reply</button>
        <button class="btn-flat waves-effect waves-light cancel-reply">Cancel</button>
    `;

    commentElement.appendChild(replyForm);
    M.Textarea.init(replyForm.querySelector('.materialize-textarea'));

    // Handle reply submission
    replyForm.querySelector('button').addEventListener('click', async () => {
        const content = replyForm.querySelector('textarea').value;
        if (!content.trim()) return;

        const commentId = commentElement.dataset.commentId;
        await postReply(commentId, content);
        replyForm.remove();
    });

    // Handle cancel
    replyForm.querySelector('.cancel-reply').addEventListener('click', () => {
        replyForm.remove();
    });
}

// Post Reply
async function postReply(commentId, content) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login to reply', 'orange');
        return;
    }

    try {
        const response = await fetch(`/api/blog/comments/${commentId}/replies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            currentPage = 1;
            const articleId = window.location.pathname.split('/').pop();
            loadComments(articleId);
            showToast('Reply posted successfully');
        } else {
            throw new Error('Failed to post reply');
        }
    } catch (error) {
        console.error('Error posting reply:', error);
        showToast('Error posting reply', 'red');
    }
}

// Like Comment
async function likeComment(commentId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login to like comments', 'orange');
        return;
    }

    try {
        const response = await fetch(`/api/blog/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const likesCount = document.querySelector(`[data-comment-id="${commentId}"] .likes-count`);
            likesCount.textContent = data.likes;
        } else {
            throw new Error('Failed to like comment');
        }
    } catch (error) {
        console.error('Error liking comment:', error);
        showToast('Error liking comment', 'red');
    }
}

// Load Related Articles
async function loadRelatedArticles(category, currentArticleId) {
    try {
        // Instead of using a non-existent endpoint, fetch all articles and filter
        const response = await fetch('/api/blog/articles');
        const articles = await response.json();
        
        // Filter articles to get related ones (same category, excluding current)
        const relatedArticles = articles
            .filter(article => article.category === category && article._id !== currentArticleId)
            .slice(0, 3); // Limit to 3 related articles

        const container = document.getElementById('related-articles');
        const template = document.getElementById('related-article-template');

        container.innerHTML = '';
        relatedArticles.forEach(article => {
            const articleElement = template.content.cloneNode(true);

            articleElement.querySelector('img').src = article.image || '/images/blog/placeholder.jpg';
            articleElement.querySelector('.article-title').textContent = article.title;
            articleElement.querySelector('.article-title').href = `/blog/article/${article._id}`;
            articleElement.querySelector('.article-date').textContent = formatDate(article.createdAt);

            container.appendChild(articleElement);
        });
    } catch (error) {
        console.error('Error loading related articles:', error);
    }
}

// Load Popular Tags
async function loadPopularTags() {
    try {
        const response = await fetch('/api/blog/tags/popular');
        const tags = await response.json();

        const container = document.getElementById('popular-tags');
        container.innerHTML = tags.map(tag => 
            `<a href="/blog/tag/${tag.name}" class="chip">
                ${tag.name}
                <span class="badge">${tag.count}</span>
            </a>`
        ).join('');
    } catch (error) {
        console.error('Error loading popular tags:', error);
    }
}

// Setup Social Share
function setupSocialShare(article) {
    const url = window.location.href;
    const title = article.title;
    const description = article.excerpt || '';

    document.getElementById('share-facebook').href = 
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    
    document.getElementById('share-twitter').href = 
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    
    document.getElementById('share-whatsapp').href = 
        `whatsapp://send?text=${encodeURIComponent(title + ' ' + url)}`;
    
    document.getElementById('share-linkedin').href = 
        `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`;
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
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
} 