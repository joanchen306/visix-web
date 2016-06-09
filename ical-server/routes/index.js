var express = require('express');
var router = express.Router();
var ical = require('ical');
var http = require("http");
var https = require("https");
var path = require("path")

var weather = {};
var traffic = { 
  "airport" : 
    {"now": {} , "in_30": {}, "img": {}},
  "buckhead": 
    {"now": {} , "in_30": {}, "img": {}},
  "decatur": 
    {"now": {} , "in_30": {}, "img": {}},
  "smyrna": 
    {"now": {} , "in_30": {}, "img": {}},
  "alpharetta": 
    {"now": {} , "in_30": {}, "img": {}},
  "marietta": 
    {"now": {} , "in_30": {}, "img": {}},

  };

router.get('/', function(req, res, next) {
  var d = new Date();
  console.log("GET @ " + d.getHours() + ":" + d.getMinutes());
  var dir = path.join(__dirname, '../');
  res.sendFile(dir + 'public/html/index.html');
});

/* GET home page. */
router.get('/events', function(req, res, next) {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  var cal_url = "https://calendar.google.com/calendar/ical/cp3df929clpi8hotglau9eo0dg%40group.calendar.google.com/private-8337b8233f450add7c427e7956c67071/basic.ics"

  // use the ical library to grab some raw ical data
  ical.fromURL(cal_url, {}, function(err, data) {

    var dataJSON = {"ALL DAY" : []}
    var curr_month = new Date().getMonth();
    var curr_date = new Date().getDate();
    var curr_year = new Date().getFullYear();
    for (var k in data){
      if (data.hasOwnProperty(k)) {
        var ev = data[k]
        var start_month = ev.start.getMonth();
        var start_date = ev.start.getDate();
        var start_year = ev.start.getFullYear();
        var end_month = ev.end.getMonth();
        var end_date = ev.end.getDate();
        var end_year = ev.end.getFullYear();

        var is_year = 0;
        var is_month = 0;
        var is_date = 0;

        if(start_year <= curr_year && curr_year <= end_year) {
          is_year = 1;
        }

        if(start_month <= curr_month && curr_month <=end_month) {
          is_month = 1;
        }

        if(start_date <= curr_date && curr_date <= end_date) {
          is_date = 1;
        }

        if(is_year && is_month && is_date) {
          if(start_date != end_date) {
            dataJSON["ALL DAY"].push(
              {"name" : ev.summary, 
              "month": months[curr_month], 
              "day": curr_date });
          } else {
            var hour = ev.start.getHours();
            var min = ev.start.getMinutes();
            if(min < 10) {
              min = "0" + min;
            }
            if (hour < 13) {
              var time_str = hour + ":" + min + " AM";
            } else {
              var time_str = (hour-12) + ":" + min + " PM";
            }
            if(dataJSON[time_str] == undefined) {
              dataJSON[time_str] = [];
            }
            dataJSON[time_str].push(
              {"name" : ev.summary, 
              "month": months[curr_month], 
              "day": curr_date});
          }
        }
      }
    }

    res.json(dataJSON);

  });

});

router.use('/weather', function(req, res, next) {

  var data = {};

  var options = {
  "method": "GET",
  "hostname": "api.wunderground.com",
  "port": null,
  "path": "/api/0f4b14f1fa5edcc3/forecast/q/GA/Atlanta.json",
  };

  var request = http.request(options, function (response) {
    var chunks = [];

    response.on("data", function (chunk) {
      chunks.push(chunk);
    });

    response.on("end", function () {
      var body = Buffer.concat(chunks);
      data = JSON.parse(body.toString());

      var today = data.forecast.simpleforecast.forecastday[0];
      weather["today"] = {
        "temp_max" : today.high.fahrenheit, 
        "temp_min" : today.low.fahrenheit, 
        "conditions" : today.conditions,
        "chance_of_rain" : today.pop,
        "day" : today.date.weekday
       }

      var tmrw = data.forecast.simpleforecast.forecastday[1];
      weather["tomorrow"] = {
        "temp_max" : tmrw.high.fahrenheit, 
        "temp_min" : tmrw.low.fahrenheit, 
        "conditions" : tmrw.conditions,
        "chance_of_rain" : tmrw.pop,
        "day" : tmrw.date.weekday
       }

      var next_day = data.forecast.simpleforecast.forecastday[2];
      weather["next_day"] = {
        "temp_max" : next_day.high.fahrenheit, 
        "temp_min" : next_day.low.fahrenheit, 
        "conditions" : next_day.conditions,
        "chance_of_rain" : next_day.pop,
        "day" : next_day.date.weekday
       }

      next();
    });
  });

  request.end();

});

router.get('/weather', function(req, res, next) {
  var options = {
    "method": "GET",
    "hostname": "api.wunderground.com",
    "port": null,
    "path": "/api/0f4b14f1fa5edcc3/conditions/q/GA/Atlanta.json",
    };

    var request = http.request(options, function (response) {
      var chunks = [];

      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var body = Buffer.concat(chunks);
        data = JSON.parse(body.toString());
        weather["today"]["curr_temp"] = data.current_observation.temp_f;
        res.json(weather);
      });
    });

    request.end();
});

router.get('/current_temp', function(req, res, next) {
  var options = {
    "method": "GET",
    "hostname": "api.wunderground.com",
    "port": null,
    "path": "/api/0f4b14f1fa5edcc3/conditions/q/GA/Atlanta.json",
    };

    var request = http.request(options, function (response) {
      var chunks = [];

      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var body = Buffer.concat(chunks);
        data = JSON.parse(body.toString());
        var d = new Date();
        console.log(d.getHours() + ":" + d.getMinutes() + "  Temp: " + data.current_observation.temp_f.toString());
        res.json({"temp": data.current_observation.temp_f.toString()});
      });
    });

    request.end();
});

var re_75 = /75/;
var re_85 = /85/;
var re_400 = /400/;



//get airport via I-75 NOW
router.use('/traffic', function(req, res, next) {
  var options = {
      "method": "GET",
      "hostname": "maps.googleapis.com",
      "port": null,
      "path": "/maps/api/directions/json?origin=33.7775142%2C-84.3893051&destination=33.6408628%2C-84.44437920000001&departure_time=now&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
    };

    var request = https.request(options, function (response) {
      var chunks = [];

      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var body = Buffer.concat(chunks);
        var data = JSON.parse(body.toString());
        traffic.airport.now["time"] = data.routes[0].legs[0].duration_in_traffic.value;
        traffic.airport.now["route"] = data.routes[0].summary;
        if(re_75.test(data.routes[0].summary)) {
          console.log("Got 75: " + data.routes[0].summary);
          traffic.airport["img"] = "/I-75.png";
        } else if(re_85.test(data.routes[0].summary)) {
          console.log("Got 85: " + data.routes[0].summary);
          traffic.airport["img"] = "/I-85.png";
        } else if(re_400.test(data.routes[0].summary)) {
          console.log("Got 400: " + data.routes[0].summary);
          traffic.airport["img"] = "/GA-400.png";
        } else {
          traffic.airport["img"] = "/street.png";
        }
        next();
      });
    });

  request.end();

});

//get airport via I-75 in 30 min
router.use('/traffic', function(req, res, next) {

  var d = new Date();
  var sec = (d.getTime()*1000) + (30*60);
  var options = {
      "method": "GET",
      "hostname": "maps.googleapis.com",
      "port": null,
      "path": "/maps/api/directions/json?origin=33.7775142%2C-84.3893051&destination=33.6408628%2C-84.44437920000001&departure_time=" 
          + sec + "&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
    };

    var request = https.request(options, function (response) {
      var chunks = [];

      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var body = Buffer.concat(chunks);
        var data = JSON.parse(body.toString());
        traffic.airport.in_30["time"] = data.routes[0].legs[0].duration_in_traffic.value;
        traffic.airport.in_30["route"] = data.routes[0].summary;
        next();
      });
    });

  request.end();

});


//get buckhead NOW
router.use('/traffic', function(req, res, next) {
  var options = {
    "method": "GET",
    "hostname": "maps.googleapis.com",
    "port": null,
    "path": "/maps/api/directions/json?origin=33.7775142%2C-84.3893051&destination=33.8476821%2C-84.3681861&departure_time=now&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
  };

  var request = https.request(options, function (response) {
    var chunks = [];

    response.on("data", function (chunk) {
      chunks.push(chunk);
    });

    response.on("end", function () {
      var body = Buffer.concat(chunks);
      var data = JSON.parse(body.toString());
      traffic.buckhead.now["time"] = data.routes[0].legs[0].duration_in_traffic.value;
      traffic.buckhead.now["route"] = data.routes[0].summary;
      if(re_75.test(data.routes[0].summary)) {
          traffic.buckhead["img"] = "/I-75.png";
        } else if(re_85.test(data.routes[0].summary)) {
          traffic.buckhead["img"] = "/I-85.png";
        } else if(re_400.test(data.routes[0].summary)) {
          traffic.buckhead["img"] = "/GA-400.png";
        } else {
          traffic.buckhead["img"] = "/street.png";
        }
      next();
    });
  });

  request.end();

});

//get buckhead in 30 min
router.use('/traffic', function(req, res, next) {

  var d = new Date();
  var sec = (d.getTime()*1000) + (30*60);
  var options = {
      "method": "GET",
      "hostname": "maps.googleapis.com",
      "port": null,
      "path": "/maps/api/directions/json?origin=33.7775142%2C-84.3893051&destination=33.8476821%2C-84.3681861&departure_time=" 
          + sec + "&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
    };

    var request = https.request(options, function (response) {
      var chunks = [];

      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var body = Buffer.concat(chunks);
        var data = JSON.parse(body.toString());
        traffic.buckhead.in_30["time"] = data.routes[0].legs[0].duration_in_traffic.value;
        traffic.buckhead.in_30["route"] = data.routes[0].summary;
        next();
      });
    });

  request.end();

});

//Studio tp Decatur NOW
router.use('/traffic', function(req, res, next) {
  var options = {
    "method": "GET",
    "hostname": "maps.googleapis.com",
    "port": null,
    "path": "https://maps.googleapis.com/maps/api/directions/json?origin=33.7775142,-84.3893051&destination=33.776700,-84.293476&departure_time=now&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
  }

  var request = https.request(options, function (response) {
    var chunks = [];

    response.on("data", function (chunk) {
      chunks.push(chunk);
    });

    response.on("end", function () {
      var body = Buffer.concat(chunks);
      var data = JSON.parse(body.toString());
      traffic.decatur.now["time"] = data.routes[0].legs[0].duration_in_traffic.value;
      traffic.decatur.now["route"] = data.routes[0].summary;
      if(re_75.test(data.routes[0].summary)) {
          traffic.decatur["img"] = "/I-75.png";
        } else if(re_85.test(data.routes[0].summary)) {
          traffic.decatur["img"] = "/I-85.png";
        } else if(re_400.test(data.routes[0].summary)) {
          traffic.decatur["img"] = "/GA-400.png";
        } else {
          traffic.decatur["img"] = "/street.png";
        }
      next();
    });
  });

  request.end();

});

//get decatur in 30 min
router.use('/traffic', function(req, res, next) {

  var d = new Date();
  var sec = (d.getTime()*1000) + (30*60);
  var options = {
      "method": "GET",
      "hostname": "maps.googleapis.com",
      "port": null,
      "path": "/maps/api/directions/json?origin=33.7775142%2C-84.3893051&destination=33.776700,-84.293476&departure_time=" 
          + sec + "&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
    };

    var request = https.request(options, function (response) {
      var chunks = [];

      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var body = Buffer.concat(chunks);
        var data = JSON.parse(body.toString());
        traffic.decatur.in_30["time"] = data.routes[0].legs[0].duration_in_traffic.value;
        traffic.decatur.in_30["route"] = data.routes[0].summary;
        next();
      });
    });

  request.end();

});

//Studio to Smyrna NOW
router.use('/traffic', function(req, res, next) {
  var options = {
    "method": "GET",
    "hostname": "maps.googleapis.com",
    "port": null,
    "path": "https://maps.googleapis.com/maps/api/directions/json?origin=33.7775142,-84.3893051&destination=33.884076,-84.514536&departure_time=now&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
  }

  var request = https.request(options, function (response) {
    var chunks = [];

    response.on("data", function (chunk) {
      chunks.push(chunk);
    });

    response.on("end", function () {
      var body = Buffer.concat(chunks);
      var data = JSON.parse(body.toString());
      traffic.smyrna.now["time"] = data.routes[0].legs[0].duration_in_traffic.value;
      traffic.smyrna.now["route"] = data.routes[0].summary;
      if(re_75.test(data.routes[0].summary)) {
          traffic.smyrna["img"] = "/I-75.png";
        } else if(re_85.test(data.routes[0].summary)) {
          traffic.smyrna["img"] = "/I-85.png";
        } else if(re_400.test(data.routes[0].summary)) {
          traffic.smyrna["img"] = "/GA-400.png";
        } else {
          traffic.smyrna["img"] = "/street.png";
        }
      next();
    });
  });

  request.end();

});

//get smryna in 30 min
router.use('/traffic', function(req, res, next) {

  var d = new Date();
  var sec = (d.getTime()*1000) + (30*60);
  var options = {
      "method": "GET",
      "hostname": "maps.googleapis.com",
      "port": null,
      "path": "/maps/api/directions/json?origin=33.7775142%2C-84.3893051&destination=33.884076,-84.514536&departure_time=" 
          + sec + "&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
    };

    var request = https.request(options, function (response) {
      var chunks = [];

      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var body = Buffer.concat(chunks);
        var data = JSON.parse(body.toString());
        traffic.smyrna.in_30["time"] = data.routes[0].legs[0].duration_in_traffic.value;
        traffic.smyrna.in_30["route"] = data.routes[0].summary;
        next();
      });
    });

  request.end();

});

//Studio to Alpharetta NOW
router.use('/traffic', function(req, res, next) {
  var options = {
    "method": "GET",
    "hostname": "maps.googleapis.com",
    "port": null,
    "path": "https://maps.googleapis.com/maps/api/directions/json?origin=33.7775142,-84.3893051&destination=34.074606,-84.292316&departure_time=now&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
  }

  var request = https.request(options, function (response) {
    var chunks = [];

    response.on("data", function (chunk) {
      chunks.push(chunk);
    });

    response.on("end", function () {
      var body = Buffer.concat(chunks);
      var data = JSON.parse(body.toString());
      traffic.alpharetta.now["time"] = data.routes[0].legs[0].duration_in_traffic.value;
      traffic.alpharetta.now["route"] = data.routes[0].summary;
      if(re_75.test(data.routes[0].summary)) {
          traffic.alpharetta["img"] = "/I-75.png";
        } else if(re_85.test(data.routes[0].summary)) {
          traffic.alpharetta["img"] = "/I-85.png";
        } else if(re_400.test(data.routes[0].summary)) {
          traffic.alpharetta["img"] = "/GA-400.png";
        } else {
          traffic.alpharetta["img"] = "/street.png";
        }
      next();
    });
  });

  request.end();

});

//get alphraretta in 30 min
router.use('/traffic', function(req, res, next) {

  var d = new Date();
  var sec = (d.getTime()*1000) + (30*60);
  var options = {
      "method": "GET",
      "hostname": "maps.googleapis.com",
      "port": null,
      "path": "/maps/api/directions/json?origin=33.7775142%2C-84.3893051&destination=34.074606,-84.292316&departure_time=" 
          + sec + "&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
    };

    var request = https.request(options, function (response) {
      var chunks = [];

      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var body = Buffer.concat(chunks);
        var data = JSON.parse(body.toString());
        traffic.alpharetta.in_30["time"] = data.routes[0].legs[0].duration_in_traffic.value;
        traffic.alpharetta.in_30["route"] = data.routes[0].summary;
        next();
      });
    });

  request.end();

});

//Studio to Marietta NOW
router.use('/traffic', function(req, res, next) {
  var options = {
    "method": "GET",
    "hostname": "maps.googleapis.com",
    "port": null,
    "path": "https://maps.googleapis.com/maps/api/directions/json?origin=33.7775142,-84.3893051&destination=33.952775,-84.550418&departure_time=now&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
  }

  var request = https.request(options, function (response) {
    var chunks = [];

    response.on("data", function (chunk) {
      chunks.push(chunk);
    });

    response.on("end", function () {
      var body = Buffer.concat(chunks);
      var data = JSON.parse(body.toString());
      traffic.marietta.now["time"] = data.routes[0].legs[0].duration_in_traffic.value;
      traffic.marietta.now["route"] = data.routes[0].summary;
      if(re_75.test(data.routes[0].summary)) {
          traffic.marietta["img"] = "/I-75.png";
        } else if(re_85.test(data.routes[0].summary)) {
          traffic.marietta["img"] = "/I-85.png";
        } else if(re_400.test(data.routes[0].summary)) {
          traffic.marietta["img"] = "/GA-400.png";
        } else {
          traffic.marietta["img"] = "/street.png";
        }
      next();
    });
  });

  request.end();

});

//get marietta in 30 min
router.get('/traffic', function(req, res, next) {

  var d = new Date();
  var sec = (d.getTime()*1000) + (30*60);
  var options = {
      "method": "GET",
      "hostname": "maps.googleapis.com",
      "port": null,
      "path": "/maps/api/directions/json?origin=33.7775142%2C-84.3893051&destination=33.952775,-84.550418&departure_time=" 
          + sec + "&key=AIzaSyB1j-wYGG3Da_6Bi3HrZUYwv2agnrT2tEc"
    };

    var request = https.request(options, function (response) {
      var chunks = [];

      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var body = Buffer.concat(chunks);
        var data = JSON.parse(body.toString());
        traffic.marietta.in_30["time"] = data.routes[0].legs[0].duration_in_traffic.value;
        traffic.marietta.in_30["route"] = data.routes[0].summary;
        res.json(traffic);
      });
    });

  request.end();

});

module.exports = router;
