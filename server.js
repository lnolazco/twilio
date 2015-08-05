#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var bodyParser = require('body-parser');
//natural worlds
var natural = require('natural');

//mongodb
var mongoose = require('mongoose');
var Task = require('./app/models/task');
//twilio
var twilio = require('twilio');
var client = twilio('ACa4b83924e9f8d4584fc429cdfb0e5f01', 'cb465c9fddfaa66d11a4149fb417822a');


// Connect to database

/*var db = 'mongodb://' +
'admin' + ':' +
'Lp4Bt5czS_uh' + '@' +
process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
process.env.OPENSHIFT_MONGODB_DB_PORT + '/' + 'twilio';
*/*
//var db = 'mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/';
var db = 'mongodb://localhost:27017/twilio';
mongoose.connect(db);


/**
 *  Define the sample application.
 */
var TwilioApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 3000;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./public/index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /* UTILS */
    self.ItIsApositiveReply = function (msg) {
      var textToEvaluate = msg.toLowerCase();
      if (natural.JaroWinklerDistance("ok", textToEvaluate) > 0.5) return true;
      if (natural.JaroWinklerDistance("yes", textToEvaluate) > 0.5) return true;
      if (natural.JaroWinklerDistance("si", textToEvaluate) > 0.5) return true;
      return false;
    }
    self.getTwilioMessageReply = function (code, msg) {
      var resp = new twilio.TwimlResponse();
      resp.message('Task:' + code + ' - ' + msg);
      return resp.toString();
    }

    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */



    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };

    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        self.app.use(bodyParser.json());
        self.app.use(bodyParser.urlencoded({
          extended: true
        }));

        //set public directory
        self.app.use(express.static(__dirname + '/public'));

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

        //GET TASKS;
        self.app.get('/api/tasks',function (req, res) {
          Task.find({},function (err, tasks) {
            // body...
            res.json(tasks);
          });
        });

        //CREATE TASK
        self.app.post('/api/tasks', function (req,res) {
          var chris = new Task({
            code: req.body.code,
            description: req.body.description,
            state: 'created',
            created_at: new Date()
          });
          chris.save(function(err) {
            if (err) throw err;
            console.log('Task saved successfully!');
          });
          res.end();
        });
        //DELETE TASKS
        self.app.delete('/api/tasks',function (req,res) {
          Task.remove({},function (err) {
            if (err) throw err;
            console.log('All tasks removed!');
            res.end();
          });
        });
        //GET MESSAGES
        self.app.get('/api/messages',function (req,res) {
          client.messages.list({
          	body: "Task:" + req.query.code,
          }, function(err, data) {
            var rsl = [];
            data.messages.forEach(function (m) {
              if (m.body.substr(0,7).toLowerCase() === 'task:' + req.query.code)
                rsl.push(m);
            });
            res.json(rsl);
          });
        })

        //add post message: when receive sms sent to twilio number
        //REPLY
        self.app.post('/message', function (req, res) {
          //receive reply
          var track;
          var task;
          var bodyText = req.body.Body; //first 2 characters is the code: 01Si => 01
          if (bodyText.length <= 7){
            res.writeHead(200, { 'Content-Type':'text/xml' });
            res.end(self.getTwilioMessageReply('Incorrect message. It needs code and answer(99Yes/No).'));
          }
          var code = bodyText.substr(5,2);
          var reply = bodyText.substr(7);
          //find task
          //Find task
          Task.findOne({code: code}, function (err, task) {
            if (err) {
              res.writeHead(200, { 'Content-Type':'text/xml' });
              res.end(self.getTwilioMessageReply(code,'Not found.'));
            }

            if (task.track === undefined || task.track.length === 0){
              res.writeHead(200, { 'Content-Type':'text/xml' });
              res.end(self.getTwilioMessageReply(code,'Needs to be assigned first.'));
            }
            var responsible = task.track[task.track.length - 1].responsible;
            var state;
            var message;
            var confirmed = self.ItIsApositiveReply(reply);
            if (confirmed){ //ACCEPTED
              message = 'Great! Thanks for confirm ' + responsible;
              state = 'accepted';
            }
            else{//REJECTED
              message = 'Ok, No worries ' + responsible + '. I hope to work with you soon!';
              state = 'rejected';
            }
            task.state = state;
            task.track.push({
              responsible: responsible,
              state: state,
              updated_at: new Date()
            });
            task.save(function (err) {
              if (err) throw err;
              console.log('Task ' + code + ' successfully ' + state + ' ' + responsible);
              res.writeHead(200, { 'Content-Type':'text/xml' });
              res.end(self.getTwilioMessageReply(code,message));
            });
          });

        });

        //Send an SMS text message
        self.app.post('/sendsms',function(req,res){
          var code = req.body.code;
          var description = req.body.description;
          var responsible = req.body.responsible;
          //Find task
          Task.findOne({code: code}, function (err, task) {
            if (err) throw err;

            task.state = 'assigned';
            if (task.track === undefined) task.track = [];
            task.track.push({
              responsible: responsible,
              state: 'assigned',
              updated_at: new Date()
            });
            task.save(function (err) {
              if (err) throw err;
              console.log('Task successfully updated!');
              client.sendMessage({

                  to:'+34986080477', // Any number Twilio can deliver to
                  from: '+34986080477', // A number you bought from Twilio and can use for outbound communication
                  body: 'Task:' + code + ' - ' + description  // body of the SMS message

                }, function(err, message) {
                    console.log('message sent - ' + message.sid);
                }); //fin send message

              res.end();
            });
          });

        });

    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new TwilioApp();
zapp.initialize();
zapp.start();
