//main.js for Crick Ticker by @mcdemarco.

//To force authorization: https://account.app.net/oauth/authorize etc.
var authUrl = "https://account.app.net/oauth/authenticate?client_id=" + api['client_id'] + "&response_type=token&redirect_uri=" + encodeURIComponent(crickSite) + "&scope=stream";
var streamArgs = {count: -5, since_id: 'marker_inclusive'}; //Default post count for retrieval.
var restreamArgs = {count: 4, before_id: 'marker'};//Default post count for retrieval.

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
//	var promise = $.appnet.post.getUserStream(restreamArgs);
//	promise.then(completeStream, function (response) {failAlert('Failed to retrieve user stream.');});
	//Just assume there's more stream.
	formatEllipsis(1);
}
function completeUnifiedStream(response) {
	$("#col2").append("<h3>Unified Stream</h3");
	completeStream(response,2);
	formatEllipsis(2);
}
function completeGlobalStream(response) {
	$("#col3").append("<h3>Global Stream</h3");
	completeStream(response,3);
	formatEllipsis(3);
}

function completeStream(response,stream) {
	if (response.data.length > 0) {
		var thisCrick = response.data;
		var thisTicker = response.meta.marker;
	}
	if (thisTicker.last_read_id != thisTicker.id) {
		if (thisTicker.last_read_id >= thisCrick[0].id) {
			//The last read is in the retrieved stream but not at the marker.
		} else {
			//Retrieve and display last read separately.
			//Also, remove the last read part of formatMarker() when this is done.
		}
	}

	if (response.meta.more == true) {
		//Not starting at the head of the stream.
		formatEllipsis(stream,true);
	}

	//Process the stream and marker.
	for (var i=0; i < thisCrick.length; i++) {
		if (thisCrick[i].id == thisTicker.id) {
			formatMarker(thisTicker,stream);
		} else if (thisCrick[i].id == thisTicker.last_read_id) {
			formatLastSeen(thisTicker,stream);
		}
		formatPost(thisCrick[i],stream,thisTicker);
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

function formatEllipsis(stream,includeBreak) {
		$("#col" + stream).append("<div class='spacer'><span class='fa fa-ellipsis-v'></span></div>" + (includeBreak ? "<hr/>" : ""));
}

function formatLastSeen(marker,stream) {
	var markerDate = new Date(marker.updated_at);
	$("#col" + stream).append("<div class='marker marked' title='Version: " + marker.version + ", Percentage: " + marker.percentage + "'>" + markerDate.toLocaleString() + " <span class='fa fa-eye'></span></div>");
}

function formatMarker(marker,stream) {
	var markerDate = new Date(marker.updated_at);
	$("#col" + stream).append("<div class='marker marked' title='Version: " + marker.version + ", Percentage: " + marker.percentage + "'>" + markerDate.toLocaleString() + ((marker.id == marker.last_read_id) ? " <span class='fa fa-eye'></span>" : "") + " <span class='fa fa-bookmark'></span></div>");
}

function formatPost(post,stream,marker) {
	var postDate = new Date(post.created_at);
	$("#col" + stream).append("<div class='" + (post.id > marker.last_read_id ? "after" : "before") + (post.id == marker.id ? " marked" : "") + "' " +">" + "<span class='author'><strong>@"+post.user.username+"</strong> (" + post.user.name + ")" + "</span><br/>" + (post.html ? post.html : "<span class='special'>[Post deleted]</span>") + "<br/>" + "<div style='text-align:right;'><a style='font-style:italic;text-decoration:none;font-size:smaller;' href='" + post.canonical_url + "'>" + postDate.toLocaleString() + "</a>" + ((post.id != marker.id) ? " <span onclick='markPost(" + post.id + "," + stream + ");' class='fa fa-bookmark-o markButton'></span>" : "") + "</div></div><hr/>");
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

function markPost(id,stream) {

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
