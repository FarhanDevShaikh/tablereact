const express = require('express');
const {body} =require('express-validator');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;


app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(bodyParser.json());


let data = [
  { id: 1, name: 'John Doe', age: 28, city: 'New York' },
  { id: 2, name: 'Jane Smith', age: 34, city: 'Los Angeles' },
  { id: 3, name: 'Mike Johnson', age: 45, city: 'Chicago' },
  { id: 4, name: 'Alice Brown', age: 30, city: 'Houston' },
  { id: 5, name: 'Bob Martin', age: 40, city: 'Dallas' },
];


app.get('/api/data', (req, res) => {
  const { page = 1, pageSize = 2, search = '', ageFilter = '', cityFilter = '' } = req.query;

  let filteredData = data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  if (ageFilter) {
    filteredData = filteredData.filter(item => item.age === Number(ageFilter));
  }

  if (cityFilter) {
    filteredData = filteredData.filter(item => item.city.toLowerCase().includes(cityFilter.toLowerCase()));
  }

  const startIndex = (page - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + Number(pageSize));

  res.json({
    data: paginatedData,
    total: filteredData.length,
  });
});

// Add new item endpoint
// app.post('/api/data', (req, res) => {
//   const { name, age, city } = req.body;
//   if (!name || !age || !city) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }
//   const newItem = { id: data.length + 1, name, age: Number(age), city };
//   data.push(newItem);
//   res.status(201).json(newItem);
// });
app.post('/api/data', [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('age').isInt({ gt: 0 }).withMessage('Age must be a positive integer'),
    body('city').isString().notEmpty().withMessage('City is required'),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { name, age, city } = req.body;
    const newItem = { id: data.length + 1, name, age: Number(age), city };
    data.push(newItem);
    res.status(201).json(newItem);
  });

// Update item endpoint
app.put('/api/data/:id', (req, res) => {
  const { id } = req.params;
  const { name, age, city } = req.body;
  const itemIndex = data.findIndex(item => item.id === parseInt(id));

  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const updatedItem = { id: parseInt(id), name, age: Number(age), city };
  data[itemIndex] = updatedItem;
  res.json(updatedItem);
});

// Delete item endpoint
app.delete('/api/data/:id', (req, res) => {
  const { id } = req.params;
  const itemIndex = data.findIndex(item => item.id === parseInt(id));

  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  data.splice(itemIndex, 1);
  res.status(204).end();  
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
