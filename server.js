const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, './')));

// Initialize OpenAI API with a hardcoded API key for the demo
// TODO: Replace with environment variable before production!
const openai = new OpenAI({
  apiKey: "YOUR_OPENAI_API_KEY_HERE", // Replace with your actual API key
});

// Categorization endpoint
app.post('/api/categorize', async (req, res) => {
  try {
    const { item } = req.body;
    
    if (!item) {
      return res.status(400).json({ error: 'Missing item name' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that categorizes food items. Only respond with one of these categories without explanation: Dairy, Eggs, Vegetables, Fruits, Meats, Seafood, Drinks, Sauces, Other."
        },
        {
          role: "user",
          content: `Categorize this food item: ${item}`
        }
      ],
      max_tokens: 10,
      temperature: 0.3,
    });

    const category = completion.choices[0].message.content.trim();
    console.log(`Categorized "${item}" as "${category}"`);
    
    return res.json({ category });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ error: 'Failed to categorize item', details: error.message });
  }
});

// Serve all HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 