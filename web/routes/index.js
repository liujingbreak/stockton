
/*
 * GET home page.
 */
var util = require('util');
var path = require('path');
var welcome = path.join(process.cwd(),'public/index.html');
exports.index = function(req, res){
    //var insp = util.inspect(req);
    console.log(util.format('%s - %s', req.fresh, req.stale));
    //res.render('index', { title: 'Express' });
    //res.redirect('/index.html');
    res.sendfile(welcome);
};