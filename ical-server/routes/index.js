var express = require('express');
var router = express.Router();
var ical = require('ical');
var http = require("http");
var https = require("https");

var weather = {};
var traffic = {"airport": {}, };

router.get('/', function(req, res, next) {
  res.sendfile('./public/html/index.html');
});

/* GET home page. */
router.get('/events', function(req, res, next) {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  var cal_url = "https://calendar.google.com/calendar/ical/cp3df929clpi8hotglau9eo0dg%40group.calendar.google.com/private-8337b8233f450add7c427e7956c67071/basic.ics"

  // use the ical library to grab some raw ical data
  ical.fromURL(cal_url, {}, function(err, data) {

    var dataJSON = {"ALL DAY" : []}
    var curr_month = new Date().getUTCMonth();
    var curr_date = new Date().getUTCDate();
    var curr_year = new Date().getUTCFullYear();
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


      console.log(today.high.fahrenheit + "/" + today.low.fahrenheit);
      console.log(today.conditions + "--" + today.pop + "%");
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
        console.log('getting current temp');
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
        res.send(data.current_observation.temp_f.toString());
      });
    });

    request.end();
});


//get airport via I-75
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
        console.log(body.toString());
        next();
      });
    });

  request.end();

});


//get buckhead via I-75
router.get('/traffic', function(req, res, next) {
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
      console.log(body.toString());
    });
  });

  request.end();

});

module.exports = router;
