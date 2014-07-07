//main.js for Crick Ticker by @mcdemarco.

//To force authorization: https://account.app.net/oauth/authorize etc.
var authUrl = "https://account.app.net/oauth/authenticate?client_id=" + api['client_id'] + "&response_type=token&redirect_uri=" + encodeURIComponent(crickSite) + "&scope=stream";
var streamArgs = {count: 5}; //Default post count for retrieval.

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
	var promise1 = $.appnet.post.getUserStream(streamArgs);
	promise1.then(completeUserStream, function (response) {failAlert('Failed to retrieve user stream.');});
	var promise2 = $.appnet.post.getUnifiedStream(streamArgs);
	promise2.then(completeUnifiedStream, function (response) {failAlert('Failed to retrieve unified stream.');});
	var promise3 = $.appnet.post.getGlobal(streamArgs);
	promise3.then(completeGlobalStream, function (response) {failAlert('Failed to retrieve global stream.');});
}

function completeUserStream(response) {
	$("#col1").append("<h3>User Stream</h3");
	completeStream(response,1);
}
function completeUnifiedStream(response) {
	$("#col2").append("<h3>Unified Stream</h3");
	completeStream(response,2);
}
function completeGlobalStream(response) {
	$("#col3").append("<h3>Global Stream</h3");
	completeStream(response,3);
}


function completeStream(response,stream,retry) {
	if (response.data.length > 0) {
		var thisCrick = response.data;
		var thisTicker = response.meta.marker;
		var foundTick = false;
	}
	//Process the stream and marker.
	for (var i=0; i < thisCrick.length; i++) {
		if (thisCrick[i].id == thisTicker.last_read_id) {
			foundTick = true;
			formatMarker(thisTicker,stream);
		}
		formatPost(thisCrick[i],stream,thisTicker);
	}
	if (!foundTick) {
		if (thisTicker.last_read_id < thisCrick[thisCrick.length - 1].id) {
			//the marker is earlier
			console.log(thisTicker.last_read_id + " earlier than " + thisCrick[thisCrick.length - 1].id + " for stream " + stream);
			$("#col" + stream).append("<div class='spacer'>&hellip;</div><hr/>");
			formatMarker(thisTicker,stream);
			$("#col" + stream).append("<hr/>");
		} else if (thisTicker.last_read_id > thisCrick[thisCrick.length - 1].id && thisTicker.last_read_id < thisCrick[0].id) {
			//The marker may also be on a missing post within the range retrieved.
			console.log(thisTicker.last_read_id + " between " + thisCrick[thisCrick.length - 1].id + " and " + thisCrick[0].id + " for stream " + stream);
		} 

		//getMore(stream,thisTicker);
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

function formatMarker(marker,stream) {
	var markerDate = new Date(marker.updated_at);
	$("#col" + stream).append("<div class='marker marked' title='Version: " + marker.version + ", Percentage: " + marker.percentage + "'><strong>Marker: </strong>" + markerDate.toLocaleString() + ((marker.id != marker.last_read_id) ? "<br/><strong>Latest Post Seen:" + marker.last_read_id + "</strong>" : "") + "</div>");
}

function formatPost(post,stream,marker) {
	var postDate = new Date(post.created_at);
	$("#col" + stream).append("<div class='" + (post.id > marker.last_read_id ? "after" : "before") + (post.id == marker.last_read_id ? " marked" : "") + "' " +">" + "<strong>@"+post.user.username+"</strong> (" + post.user.name + ")" + "<br/>" + post.html + "<br/>" + "<div style='text-align:right;'><a style='font-style:italic;text-decoration:none;font-size:smaller;' href='" + post.canonical_url + "'>" + postDate.toLocaleString() + "</a></div></div><hr/>");
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
