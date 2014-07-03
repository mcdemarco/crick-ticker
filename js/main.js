//main.js for Crick Ticker by @mcdemarco.

//To force authorization: https://account.app.net/oauth/authorize etc.
var authUrl = "https://account.app.net/oauth/authenticate?client_id=" + api['client_id'] + "&response_type=token&redirect_uri=" + encodeURIComponent(crickSite) + "&scope=stream";

/* main execution path */

function initialize() {
	$("a.adn-button").attr('href',authUrl);
	$("a.h1-link").attr('href',crickSite);
	checkLocalStorage();
	if (!api.accessToken) {
		logout();
		return;
	}
	$.appnet.authorize(api.accessToken,api.client_id);
	if (!$.appnet.token.get()) {
			api.accessToken = '';
			logout();
			return;
	} else {
		pushHistory(crickSite);
		$(".loggedOut").hide();
		getStreams();
		$(".loggedIn").show('slow');
	}
}

function getStreams() {
	//We have the token. Just get user stream for now...
	var promise = $.appnet.post.getUserStream();
	promise.then(completeStream, function (response) {failAlert('Failed to retrieve user stream.');});
//	var promise = $.appnet.post.getGlobal();
//	promise.then(completeStream, function (response) {failAlert('Failed to retrieve global stream.');});
}

function completeStream(response) {
	if (response.data.length > 0) {
		var thisCrick = response.data;
		var thisTicker = response.meta.marker;
	}
	//Process the stream and marker.
	for (var i=0; i < thisCrick.length; i++) {
		$("#col1").append("<div class='" + (thisCrick[i].id > thisTicker.last_read_id ? "after" : "before") + (thisCrick[i].id == thisTicker.last_read_id ? " marked" : "") + "' " +">" + "<strong>@"+thisCrick[i].user.username+"</strong> (" + thisCrick[i].user.name + ")" + "<br/>" + thisCrick[i].html + "<br/>" + "<div style='text-align:right;'><a style='font-style:italic;text-decoration:none;font-size:smaller;' href='" + thisCrick[i].canonical_url + "'>" + thisCrick[i].created_at + "</a></div></div><hr/>");
	}
}

/* miscellaneous functions */

function checkLocalStorage() {
	if (localStorage && localStorage["accessToken"]) {
			//Retrieve the access token.
			try {api.accessToken = localStorage["accessToken"];} 
			catch (e) {}
	} else {
		api.accessToken = window.location.hash.split("access_token=")[1];
		if (api.accessToken && localStorage) {
			try {localStorage["accessToken"] = api.accessToken;} 
			catch (e) {}
		}
	}
}

function failAlert(msg) {
	document.getElementById("crickError").scrollIntoView();
	$('#crickError').html(msg).show().fadeOut(8000);
}

function logout() {
	//Erase token and post list.
	api.accessToken = '';
	if (localStorage) {
		try {
			localStorage.removeItem("accessToken");
		} catch (e) {}
	}

	$(".loggedIn").hide();
	$(".loggedOut").show();
	$("#col1").html();
	$("#col2").html();
	$("#col3").html();
}

function pushHistory(newLocation) {
	if (history.pushState) 
		history.pushState({}, document.title, newLocation);
}

function toggleAbout() {
	$('.about').toggle();
	$('html, body').animate({scrollTop: '0px'}, 150);
	if ( $('#more').html() == "[more]" ) 
		 $('#more').html("[less]");
	else
		$('#more').html("[more]");
}

/* eof */
