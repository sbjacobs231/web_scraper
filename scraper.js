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
var shirtURL = [];
var fields = ["title", "price", "shirtURL", "imageURL", "time"];

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

function individualShirtRequest() {
	for (var i = 0; i < shirtURL.length; i++) {
		var shirtAddress = shirtURL[i];
		request(shirtURL[i], function(error, response, body) { // request to each individual shirt
			if(!error && response.statusCode == 200) {
				var $ = cheerio.load(body);
				// Create Shirt object to add to shirtsInfo
				var shirt = {};
				// Push title
				shirt.title = $(".shirt-details h1").clone().children().remove().end().text();
				// push price
				shirt.price = $(".price").text();
				// Push shirt url
				shirt.shirtURL = shirtAddress;
				// Push Image URL
				shirt.imageURL = url + $(".shirt-picture img").attr("src");
				// push time
				var now = new Date();
				shirt.time = dateFormat(now);
				shirtsInfo.push(shirt);
				// Create the csv file
				var csv = json2csv({ data: shirtsInfo, fields: fields });
				fs.writeFile(now + "file.csv", csv, function(error) { // Name of file will have date
					if (error) throw error;
					console.log("file saved");
				});
			} else {
				errorHandler(error, shirtURL[i]);
			}
		});
	} // End of loop
}