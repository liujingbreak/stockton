var express = require('express');
var app = express(), os = require('os');

// simple logger
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

// respond
/* app.use(function(req, res, next){
  res.send('Hello World');
}); */
app.get('/', function(req, res){
        res.send('Greeting ');
});

app.get('/about', function(req, res){
        res.send('<label>current dir: </label>'+ __dirname + "<br><label>host:</label>"+ os.hostname()
            +'<br><pre>' + JSON.stringify(process.env, null, '    ')
            +'</pre>');
});


app.listen(19817);
console.log('Listening on port 19817');

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, 'Something broke!');
});
