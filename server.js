//  OpenShift sample Node application
var express = require('express'),
    bodyParser = require('body-parser'),
    app     = express(),
    morgan  = require('morgan');
    
Object.assign=require('object-assign');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));
app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}

var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  res.render('index.html');
});


app.get('/pagecount', function (req, res) {
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

app.get('/eliminar', function(req, res){
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var collection = db.db.collection('postulantes');
    collection.remove();
  } else {
    res.send('{ pageCount: -1 }');
  }
});

/*Menu de Navefación*/
app.post('/consultar', function (req, res) {
  res.render('consultar.html');
});
app.post('/registrar', function (req, res) {
  res.render('registrar.html');
});
/*Fin de Menu de Navegación*/

//Registro
app.post('/registro', function (req, res) {
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var coll = db.collection('postulantes');
    coll.insert({
      dni: req.body.dni,
      nombre: req.body.name,
      apellido_paterno: req.body.lastname,
      apellido_materno: req.body.lastname2,
      correo: req.body.email,
      mes_nacimiento: req.body.BirthMonth,
      dia_nacimiento: req.body.BirthDay,
      año_nacimiento: req.body.BirthYear,
      genero: req.body.gender,
      carrera: req.body.carrera,
      telefono: req.body.phone,
    });
    res.send('Registrado correctamente')
  } else {
    res.send('Error al registrar');
  }
});

//Consulta
app.post('/consulta', function (req, res) {
   if (!db) {
    initDb(function(err){});
  }
  if (db) {
    /*
    db.collection('postulantes').findOne({dni: req.body.dni}, {fields: {dni: req.body.dni}}).toArray(function(err, docs){
      var resultado = docs.dni + " " + docs.nombre + " " + docs. apellido_paterno + " " + docs.apellido_materno + " " + docs.carrera;
      res.send(resultado);
      callback(resultado);
    });
    */
    db.collection('postulantes').findOne({dni: req.body.dni}, {fields:{dni: req.body.dni}}, function(err, doc) {
      var resultado = docs.dni + " " + docs.nombre + " " + docs. apellido_paterno + " " + docs.apellido_materno + " " + docs.carrera;
      res.send(resultado);
      //callback(resultado);
    });

  } else {
    res.send('{ pageCount: -1 }');
  }
});

app.get('/prueba', function (req, res) {
   if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('postulantes').find().toArray(function(err, docs){
      res.send(docs);
      callback(docs);
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});
initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});
// fin de error handling

app.listen(port, ip);

console.log('Server running on http://%s:%s', ip, port);
module.exports = app ;
