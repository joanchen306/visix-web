function getWeather() {
	var weather = {
		  "async": true,
		  "crossDomain": true,
		  "url": "http://api.openweathermap.org/data/2.5/forecast/city?id=4180439&APPID=d3dec360d90ee39d5758718a431ebf84",
		  "method": "GET"
		}

		$.ajax(weather).done(function (response) {
			console.log(response.list[0].main);
			console.log(response.list[0].weather);
			console.log(response.list[6]);
			console.log(response.list[12]);
		});
}