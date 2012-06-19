
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , mongoose = require('mongoose')
  , models = require('./models')
  , expressValidator = require('express-validator')
  , expose = require('express-expose')
//  , RedisStore = require('connect-redis')(express)
  , namecards = require('./namecards')
  , Contact;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.dynamicHelpers(require('./helpers.js').dynamicHelpers);
  app.use(express.session({ secret: "keyboard cat"}));
  app.use(expressValidator); // Note: must place expressValidator before app.router for it to work.
//  app.use(expose);
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('db-uri', 'mongodb://localhost/namecards');
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

models.defineModels(mongoose, function() {
  app.Contact = Contact = mongoose.model('Contact');
  app.Phone = Phone = mongoose.model('Phone');
  app.Address = Address = mongoose.model('Address');
  app.Email = Email = mongoose.model('Email');
  db = mongoose.connect(app.set('db-uri'));
});

// Routes

app.get('/', namecards.createNamespace(), routes.index);
app.get('/test', routes.test);

app.get('/browse', namecards.createNamespace(), routes.browse);
app.get('/browse/:id', namecards.createNamespace(), routes.viewContact);

app.get('/contact/add', namecards.createNamespace(), routes.addForm);
app.get('/contact/edit/:id', namecards.createNamespace(), routes.editContact);
app.get('/contact/view/:id', namecards.createNamespace(), routes.viewContact);
app.get('/contact/delete/:id', namecards.createNamespace(), routes.confirmDeleteOp);
app.get('/contacts.json/:id?', namecards.createNamespace(), routes.fetchContacts);
app.post('/contacts.json', namecards.createNamespace(), routes.postContact);
app.put('/contacts.json/:id', namecards.createNamespace(), routes.putContact);
app.put('/contact', namecards.createNamespace(), routes.putContact);
app.del('/contacts.json/:id', namecards.createNamespace(), routes.deleteContact);
app.post('/contact', namecards.createNamespace(), routes.postContact);


app.get('/orgs.:format?', namecards.createNamespace(), routes.orgs);
app.get('/orgs/:orgName', namecards.createNamespace(), routes.orgByName);
app.get('/orgs/:orgName/:id', namecards.createNamespace(), routes.viewContact);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

