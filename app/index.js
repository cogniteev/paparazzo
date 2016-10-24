'use strict';
let express = require('express'),
  bodyParser = require('body-parser'),
  phantom = require('phantom'),
  cons = require('consolidate'),
  path = require('path'),
  gm = require('gm'),
  url = require('url'),
  fs = require('fs'),
  app = express();

function wait(timeout) {
  let p = Promise.defer();
  setTimeout(() => p.resolve(), timeout);
  return p.promise;
}

function buildPresentableSnap(originalSpap, imgName) {
  return new Promise((resolve, reject) => {
    let tmp = path.join(__dirname, '/tmp', imgName),
      laptop = path.join(__dirname, '/laptop.png'),
      presentableSnap = path.join(__dirname, '/public/snaps/', 'laptop-' + imgName);
    gm(originalSpap).resize(850).crop(850, 495).write(tmp, err => {
      if (err) {
        return reject(err);
      }
      gm()
        .in('-page', '+0+0')
        .in(laptop)
        .in('-page', '+176+114')
        .in(tmp)
        .mosaic()
        .write(presentableSnap, function(err) {
          fs.unlinkSync(tmp);
          if (err) {
            return reject(err);
          }
          return resolve(presentableSnap);
        });
    });
  });
}

function fixUrl(rawUrl) {
  let p = url.parse(rawUrl);
  if (!p.protocol && !p.host) {
    p.protocol = 'http:';
    p.slashes = true;
  }
  p = url.format(p);
  return p;
}

function setLocalStorage(localStorage) {
  Object.keys(localStorage).forEach(function(key) {
    localStorage.setItem(key, localStorage[key]);
  });
}

app.engine('hbs', cons.handlebars);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.logger('tiny'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/snap', function(req, res) {
  const {
    targetUrl,
    paperSize,
    localStorage,
    viewportSize = {
      width: 1440,
      height: 900
    },
    exportType = 'screenshot',
    waitFor = 1000
  } = req.body;

  if (!targetUrl || targetUrl.trim() === '') {
    return res.json(422, {
      msg: 'missing targetUrl parameter'
    });
  }

  let pageUrl = fixUrl(targetUrl.trim()),
    exportFormat = exportType === 'screenshot' ? 'png' : 'pdf',
    exportName = `${pageUrl.replace(/\W/g, '')}-${Date.now()}.${exportFormat}`,
    snapPath = path.join(__dirname, '/public/snaps/', exportName),
    snapResponseBody = {},
    phantomInstance,
    phantomPage;


  phantom.create()
    .then(function(ph) {
      phantomInstance = ph;
      return phantomInstance.createPage();
    })
    .then(function(page) {
      phantomPage = page;
      if (paperSize) {
        return phantomPage.property('paperSize', paperSize);
      } else {
        return phantomPage.property('viewportSize', viewportSize);
      }
    })
    .then(() => {
      return phantomPage.setContent('', pageUrl);
    })
    .then(() => {
      if (localStorage) {
        return phantomPage.evaluate(setLocalStorage, localStorage);
      }
    })
    .then(function() {
      return phantomPage.open(pageUrl);
    })
    .then(function(status) {
      if (status !== 'success') {
        throw `Failed to fetch page at ${pageUrl}`;
      } else {
        return wait(waitFor);
      }
    })
    .then(() => phantomPage.render(snapPath))
    .then(() => {
      let snap = `/snaps/${exportName}`;
      snapResponseBody.snap = snap;
      if (exportType === 'screenshot') {
        return buildPresentableSnap(snapPath, exportName)
          .then(() => {
            snapResponseBody.laptop = `/snaps/laptop-${exportName}`;
            return;
          });
      } else {
        return;
      }
    })
    .then(function() {
      phantomInstance.exit();
      return res.json(snapResponseBody);
    })
    .catch(function(error) {
      phantomInstance.exit();
      console.error(error);
      return res.json(422, {
        msg: error
      });
    });
});

app.listen(4000);