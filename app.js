var express = require("express")
var path=require("path");
const routes=require('./routes.js');
const app = express();


app.use('/static', express.static('static'))
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views',);

app.get('/', routes);
app.get('/contact',routes);
app.post('/contact',routes);
app.get('/register',routes);
app.post('/register',routes);
app.get('/login',routes);
app.post('/login',routes);
app.get('/success',routes); 

const PORT=process.env.PORT||5000;
app.listen(PORT, () => console.log("server is  started at PORT",PORT));
