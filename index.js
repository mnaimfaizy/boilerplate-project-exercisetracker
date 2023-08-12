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

// Route to add a new user// Route to add user's exercise
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

    // Get the user and add exercise data to it
    const user = await User.findById(userId);
    user.log.push(exercise);
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ error: 'User not found' });
    }

    const query = Exercise.find({ username: user.username })
      .where('date').gte(from || '1970-01-01').lte(to || '2100-01-01')
      .limit(Number(limit) || 0);
    const exercises = await query;

    const userLogs = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: userLogs.length,
      log: userLogs
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
