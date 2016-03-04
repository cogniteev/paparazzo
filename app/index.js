'use strict';
var express = require('express')
  , phantom = require('phantom')
  , handlebars = require('handlebars')
  , cons = require('consolidate')
  , gm = require('gm')
  , path = require('path')
  , fs = require('fs')
  , url = require('url')
  , portscanner = require('portscanner')
  , app = express();

app.engine('hbs', cons.handlebars);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.logger('tiny'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function(req, res){
  res.render('index');
});

app.post('/snap', function(req, res){
  if (! req.body.targetUrl || req.body.targetUrl.trim() === ''){
    res.send({ status: 'error' });
  }
  var pageUrl = (function(u){
      var p = url.parse(u);
      if (! p.protocol && ! p.host) {
        p.protocol = 'http:';
        p.slashes = true;
      }
      p = url.format(p);
      return p;
    }(req.body.targetUrl.trim()))
    , imgName = pageUrl.replace(/\W/g, '') + '-' + Date.now() + '.png'
    , laptop = path.join(__dirname, '/laptop.png')
    , snapPath = path.join(__dirname, '/public/snaps/', imgName)
    , presentableSnap = path.join(__dirname, '/public/snaps/', 'laptop-' + imgName)
    , tmp = path.join(__dirname, '/tmp', imgName),
    error;


  phantom.create()
  .then(function (ph) {
    ph.createPage()
    .then(function (page) {
      page.property('viewportSize', {width: 700, height: 400})
      .then(function () {
        page.open(pageUrl)
        .then(function (status) {
          if (status != 'success') {
            error = 'Failed to fetch page at ' + pageUrl;
            ph.exit();
            return res.json(422, {msg: error});
          } else {
            page.render(snapPath)
            .then(function () {
              ph.exit();
              return res.json({
                snap: '/snaps/' + imgName
              });
            })
            .catch(function (err) {
              error = err;
            });
          }
        })
        .catch(function (err) {
          error = err;
        });
      })
      .catch(function (err) {
        error = er;
      });
    })
    .catch(function (err) {
      erro = err;
    });
  })
  .catch(function (err) {
    error = err;
  });
});

app.listen(4000);
