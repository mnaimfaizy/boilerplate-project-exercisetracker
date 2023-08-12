const express = require('express')
const mongoose = require('mongoose');
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
app.use(express.urlencoded({ extended: true }));

// Route to add a new user
app.post('/api/users', (req, res) => {
  const user = new User({ username: req.body.username });
  user.save()
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: 'Server error' });
    });
});

app.get('/api/users', (req, res) => {
  User.find({}).then(data => {
    res.json(data);
  }).catch(err => {
    res.status(500).json({ error: 'Server Error' })
  });
});

const { ObjectId } = require('mongoose').Types;

// Route to add user's exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required' });
    }

    const exercise = new Exercise({
      username: new ObjectId(userId),
      description,
      duration,
      date: date ? new Date(date) : new Date()
    });

    const [savedExercise, user] = await Promise.all([
      exercise.save(),
      User.findByIdAndUpdate(userId, { $push: { log: exercise._id } }, { new: true })
    ]);

    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: new Date(savedExercise.date).toDateString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to get user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.json({ error: 'User not found' });
      }

      const fromDate = from ? new Date(from) : new Date('1970-01-01');
      const toDate = to ? new Date(to) : new Date('2100-01-01');

      const query = Exercise.find({ username: new ObjectId(user._id) })
        .where('date').gte(fromDate).lte(toDate)
        .limit(Number(limit) || 0);

      query.then(exercises => {
        const userLogs = exercises.map(exercise => ({
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString()
        }));

        res.json({
          _id: user._id,
          username: user.username,
          count: userLogs.length,
          log: userLogs
        });
      }).catch(error => {
        res.status(500).json({ error: 'Server error' });
      });
    })
    .catch(error => {
      res.status(500).json({ error: 'Server error' });
    });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
