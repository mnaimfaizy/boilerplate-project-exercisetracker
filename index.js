const express = require('express')
const mongoose = require('mongoose');
const app = express()
const cors = require('cors')
require('dotenv').config()

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:Kabul123@cluster0.r6amdct.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Define Exercise Schema
const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

// Middleware
app.use(express.json());

// Route to add a new exercise
app.post('/api/exercise/add', async (req, res) => {
  const { username, description, duration, date } = req.body;
  try {
    const exercise = new Exercise({
      username,
      description,
      duration,
      date
    });
    await exercise.save();
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to get all exercises
app.get('/api/exercise/all', async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
