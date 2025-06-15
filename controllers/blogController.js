const { Article } = require('../models/Project');
const { validationResult } = require('express-validator');

// Get all articles
exports.getAllArticles = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        let query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const articles = await Article.find(query)
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Article.countDocuments(query);

        res.json({
            articles,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalArticles: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get article by ID
exports.getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id)
            .populate('author', 'name')
            .populate('comments.user', 'name');

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        res.json(article);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get articles by category
exports.getArticlesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const articles = await Article.find({ category })
            .populate('author', 'name')
            .sort({ createdAt: -1 });

        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new article (admin only)
exports.createArticle = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, category, tags } = req.body;

        const article = new Article({
            title,
            content,
            category,
            tags,
            author: req.user._id,
            image: req.file ? req.file.path : undefined
        });

        await article.save();
        await article.populate('author', 'name');

        res.status(201).json(article);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update article (admin only)
exports.updateArticle = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, category, tags } = req.body;
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        // Update fields
        if (title) article.title = title;
        if (content) article.content = content;
        if (category) article.category = category;
        if (tags) article.tags = tags;
        if (req.file) article.image = req.file.path;

        await article.save();
        await article.populate('author', 'name');

        res.json(article);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete article (admin only)
exports.deleteArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        await article.remove();
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add comment to article
exports.addComment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { content } = req.body;
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        article.comments.push({
            user: req.user._id,
            content,
            createdAt: new Date()
        });

        await article.save();
        await article.populate('comments.user', 'name');

        res.status(201).json(article.comments[article.comments.length - 1]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete comment
exports.deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const article = await Article.findById(id);

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const comment = article.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only allow comment author or admin to delete
        if (comment.user.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        comment.remove();
        await article.save();

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; 