if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const cors = require('cors');
app.use(cors());

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(express.static('public'))

const mongoose = require('mongoose')

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_DB_URL)

    console.log('DB is online now!', mongoose.connection.host)
}

connectDB()

app.use(express.json())

const userRoute = require('./routes/users')
const gameRoute = require('./routes/games')
const indexRoute = require('./routes/index')

app.use('/', indexRoute)
app.use('/users', userRoute)
app.use('/games', gameRoute)
 

app.listen(process.env.PORT || 3002, () => console.log('Server Started'))