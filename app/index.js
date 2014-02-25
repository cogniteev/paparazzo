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
    , tmp = path.join(__dirname, '/tmp', imgName);

  portscanner.findAPortNotInUse(40000, 60000, 'localhost', function(err, freeport){
    phantom.create({ port: freeport }, function(ph){
      ph.createPage(function(page){
        page.set('viewportSize', { width: 1440, height: 900 });
        page.open(pageUrl, function(status){
          page.set('clipRect', { top: 0, left: 0, width: 1440, height: 900 });
          page.render(snapPath, function(){
            ph.exit();
            gm(snapPath).resize(850).crop(850, 495).write(tmp, function(err){
              if (err) console.log(err);
              gm()
              .in('-page', '+0+0')
              .in(laptop)
              .in('-page', '+176+114')
              .in(tmp)
              .mosaic()
              .write(presentableSnap, function(err){
                if (err) console.log(err);
                fs.unlinkSync(tmp);
                res.send({
                  laptop: '/snaps/laptop-' + imgName,
                  snap: '/snaps/' + imgName
                });
              });
            });
          });
        });
      });
    });
  });
});

app.listen(4000);
