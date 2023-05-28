const mongoose = require('mongoose')
const logger = require('./logger')
const {mongo,env}= require('./vars')



mongoose.connection.on('error', err => {
    logger.error(`Database error ${err}.`)
    process.exit(-1)
})

if(env==='development'){
    mongoose.set('debug', true)
}

exports.connect = async() => {
    console.log(mongo.uri)
    await mongoose.connect(mongo.uri,{
        keepAlive: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(()=>{
        logger.info('Database connected')
    })
    return mongoose.connection
}