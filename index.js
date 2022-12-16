const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  count: Number,
  log: [{
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: String
  }]
})

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: false
}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const username = req.body.username
  const user = new User({ username: username, count:0 })
  user.save((err, data) => {
    if (err) {
      res.json({ error: err })
      return
    }
    res.json(data)
  })
})

app.get('/api/users', (req, res) => {
  User.find((err, data) => {
    if (err) {
      res.json({ error: err })
      return
    }
    res.json(data)
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  if (req == undefined) {
    return
  }
  
  const description = req.body.description
  const duration = parseInt(req.body.duration)
  let date = req.body.date
  const id = req.params._id.toString()
  if (typeof description !== 'string') {
    res.json({ error: 'Invalid description' })
    return
  }
  if (date !== '' && new Date(date) == 'Invalid Date') {
    res.json({ error: 'Invalid Date' })
    return
  }
  if (date == '' || date == undefined) {
    date = (new Date()).toDateString()
  } else {
    date = (new Date(date)).toDateString()
  }

  const exercise = {
    description,
    duration,
    date
  }
let updatedUser
  User.findByIdAndUpdate(id, { $push: { log: exercise }, $inc: { count: 1 } }, { new: true }, (err, user) => {
    if (err) {
      res.json({error: err})
      return
    }
    if (user) {      
         updatedUser = {
          _id: user.id,
          username: user.username,
          date: user.log[user.log.length - 1].date,
          duration: user.log[user.log.length - 1].duration,
          description: user.log[user.log.length - 1].description
        }    
      res.json(updatedUser)
    }
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id
  User.findById(id, (err, user) => {
    if (err || !user) {
      console.log(err)
      res.json({ error: 'Invalid Id' })
      return
    }
    console.log(user)
    res.json(user)
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
