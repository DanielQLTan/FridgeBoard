require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// Initialize OpenAI with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// API endpoint for categorization
app.post('/api/categorize', async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Missing title parameter' });
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that categorizes food items. Only respond with one of these categories without explanation: Dairy, Eggs, Vegetables, Fruits, Meats, Seafood, Drinks, Sauces, Other. If you are not sure, return Other."
        },
        {
          role: "user",
          content: `Categorize this food item: ${title}`
        }
      ],
      max_tokens: 10,
      temperature: 0.3
    });
    
    const category = response.choices[0].message.content.trim();
    console.log(`Categorized "${title}" as "${category}"`);
    
    return res.json({ category });
  } catch (error) {
    console.error('Error in categorization:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Serve all HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? "Configured ✓" : "Missing ✗"}`);
}); 