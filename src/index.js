const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route');
const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

/*----------------------------------------------------------------------
🗃️ connect mongo db
----------------------------------------------------------------------*/
mongoose.connect("mongodb+srv://url-shortner:mT5LCAL7pPDUb34n@cluster0.svwrti3.mongodb.net/", {
        useNewUrlParser: true
    })
    .then((result) => console.log("MongoDb is connected"))
    .catch((err) => console.log(err))


app.use('/', route)


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});