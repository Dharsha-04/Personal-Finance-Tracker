const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve frontend files

// Debug Middleware: Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- Auth Routes ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Basic validation
        if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });

        // Check existing
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) return res.status(400).json({ error: 'Email already exists' });

        // Insert (Storing plain password as per simple requirement, normally hash this!)
        const [result] = await db.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, password]);

        res.json({ id: result.insertId, username, email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND password_hash = ?', [email, password]);

        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        res.json({ id: user.id, username: user.username, email: user.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.put('/api/users/profile', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { username, email, password } = req.body;
        if (!username || !email) return res.status(400).json({ error: 'Username and Email are required' });

        // Check if email is taken by another user
        const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already in use' });

        let query = 'UPDATE users SET username = ?, email = ?';
        let params = [username, email];

        if (password) {
            query += ', password_hash = ?';
            params.push(password);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        await db.query(query, params);

        res.json({ id: userId, username, email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// --- Transaction Routes ---
app.get('/api/transactions', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const [rows] = await db.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [userId]);

        // Map to frontend expected format if needed
        const transactions = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            categoryId: row.category_id,
            amount: parseFloat(row.amount),
            description: row.description,
            date: row.date,
            type: row.type
        }));

        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { type, amount, categoryId, date, description } = req.body;

        const [result] = await db.query(
            'INSERT INTO transactions (user_id, category_id, amount, description, date, type) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, categoryId, amount, description, date, type]
        );

        res.json({ id: result.insertId, message: 'Added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { id } = req.params;
        await db.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// --- Budget Routes ---
app.get('/api/budgets', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const [rows] = await db.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);
        const budgets = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            categoryId: row.category_id,
            limit: parseFloat(row.limit_amount)
        }));
        res.json(budgets);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/api/budgets', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { categoryId, limit } = req.body;

        // Check for existing budget for this category
        const [existing] = await db.query('SELECT id FROM budgets WHERE user_id = ? AND category_id = ?', [userId, categoryId]);

        if (existing.length > 0) {
            await db.query('UPDATE budgets SET limit_amount = ? WHERE id = ?', [limit, existing[0].id]);
        } else {
            await db.query('INSERT INTO budgets (user_id, category_id, limit_amount) VALUES (?, ?, ?)', [userId, categoryId, limit]);
        }
        res.json({ message: 'Budget set' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// --- Category Route (Optional helper) ---
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching categories' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
