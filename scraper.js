"use strict";

// Include Dependencies (http calls, write files, date formatting, jquery, json converter)
var request = require("request");
var fs = require("fs");
var  dateFormat = require("dateformat");
var cheerio = require("cheerio");
var json2csv = require("json2csv");

// Error handling function
var errorHandler = function(error, url) {
	console.log("There was something wrong with the URL you entered: " + url);
};

// Global variables (site and array of shirt objects)
var shirtsInfo = [];
var url = "http://shirts4mike.com/";
var fields = ["title", "price", "shirtURL", "imageURL", "time"];
var shirtURL = [];
var titles = [];
var imageURLs = [];
var prices = [];

// Initial url request
request(url, function(error, response, body) {
	if(!error && response.statusCode == 200) { // Homepage Loads fine
		var $ = cheerio.load(body); // load jquery
		var allShirtsURL = url + $(".shirts a").attr("href"); // Link to page with all shirts displayed
		request(allShirtsURL, function(error, response, body) { // all shirts url request
			var $ = cheerio.load(body); // load jquery to traverse DOM
			if (!error && response.statusCode == 200) { // All shirts page loads fine
				$("a[href*='shirt.php?']").each(function() { // Grab each shirt's url
					shirtURL.push(url + $(this).attr("href"));
				});
				// Individual shirt request
				individualShirtRequest();
			} else {
				errorHandler(error, allShirtsURL);
			}
		});
	} else {
		errorHandler(error, url);
	}
});

// Push t-shirt values into appropriate arrays
function individualShirtRequest() {
	for (var i = 0; i < shirtURL.length; i++) {
		request(shirtURL[i], function(error, response, body) { // request to each individual shirt
			if(!error && response.statusCode == 200) {
				var $ = cheerio.load(body);
				// Push title
				titles.push($(".shirt-details h1").clone().children().remove().end().text());
				// push price
				prices.push($(".price").text());
				// Push Image URL
				imageURLs.push(url + $(".shirt-picture img").attr("src"));
			} else {
				errorHandler(error, shirtURL[i]);
			}
		});
	} // End of loop
	// Create shirt Object
	setTimeout(function(){ createShirtObject(); }, 5000);
}

var createShirtObject = function() {
	for(var i = 0; i < shirtURL.length; i++) {
		// Create Shirt object to add to shirtsInfo
		var shirt = {};
		shirt.title = titles[i];
		shirt.price = prices[i];
		shirt.shirtURL = shirtURL[i];
		shirt.imageURL = imageURLs[i];
		var now = new Date();
		shirt.time = dateFormat(now);
		shirtsInfo.push(shirt);
	}
	setTimeout(function(){ writeFile(now); }, 5000);
};

var writeFile = function(now) {
	// Create the csv file
	var dir = "./data";
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	var csv = json2csv({ data: shirtsInfo, fields: fields });
	fs.writeFile(dir + "/" + dateFormat(now, "isoDate") + ".csv", csv, function(error) { // Name of file will have date
		if (error) throw error;
		console.log("file saved");
	});
};