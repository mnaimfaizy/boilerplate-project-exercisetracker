const express = require('express')
const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer();
const app = express()
const cors = require('cors')
require('dotenv').config()

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Define User Schema
const userSchema = new mongoose.Schema({
  username: String
});

const User = mongoose.model('User', userSchema);


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
app.use(upload.none()); // Parse FormData

// Route to add a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  try {
    const user = new User({ username });
    await user.save();
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
});

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


// Route to get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const userExercises = await Exercise.find({ username: userId })
      .where('date').gte(from || '1970-01-01').lte(to || '2100-01-01')
      .limit(Number(limit) || 0);

    res.json(userExercises);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to add user's exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.json({ error: 'Description and duration are required' });
  }

  try {
    const exercise = new Exercise({
      username: userId,
      description,
      duration,
      date: date || new Date()
    });
    await exercise.save();
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
