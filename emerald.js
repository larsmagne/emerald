var current = false;
var comics = false;
var emeraldDate = false;
var emeraldDates = false;
var categories = ["variants", "resolicitations", "relistings",
		  "ones", "nonumber", "gns", "other"];
var activeCategories = false;
var phoneGap = false;
var curationName = false;
var curationArr = false;

function startUp() {
  if (phoneGap) {
    // Add a dummy "resume" handler so that the app doesn't restart
    // when it's brought back from sleep.
    document.addEventListener("resume", function() {
    }, false);
    document.addEventListener("pause", function() {
    }, false);
    var cur = localStorage.getItem("current");
    if (cur) {
      cur = cur.split(/,/);
      emeraldDate = cur[0];
      current = cur[1];
    }
  }
  var spinner = startSpinner();
  var match = window.location.href.match("month=([-0-9]+)");
  if (match)
    emeraldDate = match[1];
  else {
    var sep = "?";
    var url = window.location.href;
    if (url.match("[?]"))
      sep = "&";
    url = url + sep + "month=" + emeraldDate;
    window.history.pushState("emerald", "emerald", url);
  }
  $.ajax({
    url: location.hostname == "localhost"?
      location.protocol + "//localhost/emerald/data/previews-" +
      emeraldDate + ".json":
      location.protocol + "//goshenite.info/data/previews-" +
      emeraldDate + ".json",
    dataType: "json",
    success: function(data) {
      removeSpinner(spinner);
      var s = localStorage.getItem("specials");
      if (! s)
	var specials = false;
      else
	specials = s.split(/,/);
      comics = data.sort(function(comic1, comic2) {
	if (! specials)
	  return 0;
	var pub1 = comic1.publisher;
	var pub2 = comic2.publisher;
	if (specials.indexOf(pub1) == -1 &&
	    specials.indexOf(pub2) == -1)
	  return 0;
	if (specials.indexOf(pub1) != -1 &&
	    specials.indexOf(pub2) != -1)
	  return 0;
	if (specials.indexOf(pub1) != -1 &&
	    specials.indexOf(pub2) == -1)
	  return -11;
	if (specials.indexOf(pub1) == -1 &&
	    specials.indexOf(pub2) != -1)
	  return 1;
	return 0;
      });
      var match = window.location.href.match("code=(.*)");
      if (match)
	loadImageAndDisplay(data[currentIndex(match[1])]);
      else if (phoneGap && current)
	loadImageAndDisplay(data[currentIndex(current)]);
      else
	loadImageAndDisplay(data[0]);
      addNavigation();
      addPublishers();
      checkCategories();
      addMonths();
      addSearch();
      //localStorage.setItem("buys-" + emeraldDate, "");
      //curateList();
      //listCurations();
      //showMenu();
      //curateList();
      //listCurations();
    }});
  $("#publisher").click(function() {
    toggleSpecialPublisher();
  });
  $("#about").click(function() {
    showAbout();
  });
}

var firstTime = true;

function display(comic, image, noPush, noVariants) {
  current = comic.code;
  var url = window.location.href;
  if (url.match("code=(.*)"))
    url = url.replace(/code=(.*)/, "code=" + comic.code);
  else {
    var sep = "?";
    if (url.match("[?]"))
      sep = "&";
    url = url + sep + "code=" + comic.code;
  }
  // Record the current state so that we can return to it if the app
  // is restarted.
  localStorage.setItem("current", emeraldDate + "," + comic.code);
  if (! noPush)
    window.history.pushState(comic.code, comic.name, url);
  if (image) {
    var children = $("#cover").children();
    // Find out if we need to constrain the height to make things fit.
    image.style.position = "absolute";
    if (! isMobile) {
      image.style.top = "20px";
      image.style.left = "20px";
      var ratio = image.width / 480;
      var cHeight = $("#cover").height() - 20;
      if (image.height / ratio > cHeight) {
	image.style.width = "";
	image.style.height = cHeight;
      }    
    } else {
      image.style.top = "5px";
      image.style.left = "5px";
      ratio = image.width / (window.innerWidth - 15);
      var scale = 2;
      // On smaller devices, use proportionally larger parts of the
      // screen for the cover.
      if (window.innerHeight < 1000)
	scale = 1.5;
      // Ensure that we start out with a reasonable size.
      if (firstTime) {
	$("#cover").css("height", window.innerHeight / scale + "px");
	cHeight = window.innerHeight / scale;
	firstTime = false;
      } else {
	if ($("#cover").height() < window.innerHeight / 3)
	  cHeight = window.innerHeight / scale;
	else
	  cHeight = $("#cover").height() + 10;
      }
      image.style.width = window.innerWidth - 10;
      image.style.height = "";
      var oldSize;
      if (image.height / ratio > cHeight) {
	image.style.width = "";
	image.style.height = cHeight;
	setTimeout(function() {
	  if ($("#cover").height() < window.innerHeight / scale)
	    $("#cover").css("height", window.innerHeight / scale + "px");
	  else
	    $("#cover").css("height", "100%");
	  var newHeight = $("#cover").height();
	  if (newHeight < cHeight) {
	    $(image).animate({height: newHeight + 10}, 80, function() {
	      oldSize = [$(image).width(), $(image).height()];
	    });
	  }
	}, 1);
      }
      setTimeout(function() {
	oldSize = [$(image).width(), $(image).height()];
      }, 1);
      
      var expanded = false;
      if (image.height / ratio - 15 > cHeight)
	var fullSize = [image.width / ratio - 15, window.innerHeight - 15];
      else
	fullSize = [window.innerWidth - 15, image.height / ratio - 15];
      $(image).click(function() {
	if (expanded)
	  $(image).animate({width: oldSize[0],
			    height: oldSize[1]},
			   80);
	  else
	    $(image).animate({width: fullSize[0],
			      height: fullSize[1]},
			     80);
	expanded = ! expanded;
      });
    }
    image.style.display = "inline";
    $("#cover").append(image);
    setTimeout(function() {
      $.map(children, function(elem) {
	$(elem).fadeOut(100, function() {
	  $(elem).remove();
	});
      });
    },
	       100);
  } else {
    $("#cover").empty();
  }
  if (curationArr) {
    var note = "";
    for (var i = 0; i < curationArr.length; i++)
      if (curationArr[i].code == comic.code)
	note = curationArr[i].desc.replace(/[<>]/, "");
    $("#cover").append($("<span class=curation>Curated by " + curationName +
			 "<i class='material-icons close-curation'>close</i><br>" +
			 note + "</span>"));
    $(".close-curation").click(function() {
      curationArr = false;
      loadImageAndDisplay(comics[0]);
    });
  }
  var old = $("#publisher").html();
  var publisher = comic.publisher;
  $("#publisher").html(publisher);
  $("#publisher").attr("data-publisher", publisher);
  if (old && $("#publisher").html() != old)
    $("#publisher").addClass("first-publisher");
  else
    $("#publisher").removeClass("first-publisher");
  setSpecialColor(publisher);
  $("#title").html(comic.name);
  $("#creators").html(comic.creators || "");
  $("#text").html(comic.text || "");
  $("#price").html(comic.price);
  $("#issue").html(comic.issue || "");
  $("#class").html(comic["class"] || "");
  $("#date").html(comic.date || "");
  $("#original").html(comic.original || "");
  $("#code").html(comic.code);
  $("#limited").html(comic.duration? "" + comic.duration + " issue series": "");
  $("#mature").html(comic.mature? "mature readers": "");
  $("#comething").html(comic.comething || "");

  if (comic.issue == "#1" || comic.issue == "VOL 01")
    $("#issue").addClass("first");
  else
    $("#issue").removeClass("first");

  if (! noVariants) {
    $("#variant-comics").empty();
    displayVariants();
  }

  $("#publishers").val(comic.publisher);
  
  setBuy();
  preload();
}

var lastImage = false;

function loadImageAndDisplay(comic, noPush, noVariants) {
  if (! imgUrl(comic)) {
    display(comic, false, noPush, noVariants);
    return;
  }
  var pre = preloadedImages[imgUrl(comic)];
  if (pre) {
    display(comic, pre[1], noPush, noVariants);
    return;
  }
  var image = document.createElement("img");
  lastImage = image;
  image.onload = function() {
    removeSpinner(spinner);
    // Don't do anything if the user has requested something else in
    // the meantime.
    if (image === lastImage)
      display(comic, image, noPush, noVariants);
  };
  image.onerror = function() {
    removeSpinner(spinner);
    $(image).remove();
    display(comic, false, noPush, noVariants);
  };
  image.src = imgUrl(comic);
  image.style.width = "480px";
  image.style.display = "none";
  // Display a spinner image if the image isn't in the cache.
  if (! image.complete)
    var spinner = startSpinner();
}

var userAction = "next";

function addNavigation() {
  $("#next").bind("click", gotoNext);
  $("#prev").bind("click", gotoPrev);
  $("#nextPublisher").bind("click", gotoNextPublisher);
  $("#prevPublisher").bind("click", gotoPrevPublisher);
  $(document).keydown(function(e) {
    if (document.activeElement.nodeName == "SELECT" ||
	document.activeElement.nodeName == "TEXTAREA" ||
	document.activeElement.id == "searchbox")
      return;
    switch(e.which) {
    case 37: // left
    case 38: // up
      userAction = "prev";
      removeExplanation();
      gotoPrev();
      break;

    case 39: // right
    case 40: // down
      userAction = "next";
      removeExplanation();
      gotoNext();
      break;

    case 33: // pgup
      userAction = "prevPublisher";
      removeExplanation();
      gotoPrevPublisher();
      break;

    case 34: // pgdown
      userAction = "nextPublisher";
      removeExplanation();
      gotoNextPublisher();
      break;

    case 13: // RET
    case 66: // b
      $("#buy")[0].checked = ! $("#buy")[0].checked;
      toggleBuy();
      break;
      
    default:
      return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
  });
  $("#buy").bind("change", toggleBuy);
  $.map(categories, function(cat) {
    $("#" + cat).bind("change", changeCategory);
  });
  $("#export").bind("click", exportBuys);
  window.addEventListener('popstate', function(e) {
    loadImageAndDisplay(comics[currentIndex(e.state)], true);
  });
  if (localStorage.getItem("explanation"))
    removeExplanation();
  $("#curation").click(function() {
    closeMenu();
    curateList();
  });
  $("#see-curation").click(function() {
    closeMenu();
    listCurations();
  });
  $("#note").click(function() {
    closeMenu();
    addNote();
  });
}

function currentIndex(code) {
  if (! code)
    code = current;
  var len = comics.length;
  for (var i = 0; i < len; i++) {
    if (comics[i]["code"] == code)
      return i;
  }
  return 0;
}

function gotoNext() {
  // Don't do anything if a message is being displayed.
  if ($(".event-lightbox").length > 0)
    return;
  var len = comics.length;
  var i = currentIndex();
  while (++i < len) {
    if (wanted(comics[i])) {
      loadImageAndDisplay(comics[i]);
      return;
    }
  }
  colorbox("No next comic");
}

function gotoPrev() {
  // Don't do anything if a message is being displayed.
  if ($(".event-lightbox").length > 0)
    return;
  var len = comics.length;
  var i = currentIndex();
  while (i-- > 0) {
    if (wanted(comics[i])) {
      loadImageAndDisplay(comics[i]);
      return;
    }
  }
  colorbox("No previous comic");
}

function gotoNextPublisher() {
  var len = comics.length;
  var i = currentIndex();
  var publisher = comics[i].publisher;
  while (++i < len) {
    if (wanted(comics[i]) && publisher != comics[i].publisher) {
      loadImageAndDisplay(comics[i]);
      return;
    }
  }
  colorbox("No next publisher");
}

function gotoPrevPublisher() {
  var len = comics.length;
  var i = currentIndex();
  var publisher = comics[i].publisher;
  while (--i > 0) {
    if (wanted(comics[i]) && publisher != comics[i].publisher) {
      publisher = comics[i].publisher;
      while (i-- > 0) {
	if (wanted(comics[i]) && publisher != comics[i].publisher) {
	  i++;
	  while (! wanted(comics[i]) && i < comics.length)
	    i++;
	  loadImageAndDisplay(comics[i]);
	  return;
	}
      }
    }
  }
  colorbox("No previous publisher");
}

function preload() {
  var len = comics.length;
  var start = currentIndex();
  var i = start;
  var remaining = 10;
  // If the user is using the "next publisher", then don't preload
  // as much.
  if (userAction == "prevPublisher" || userAction == "nextPublisher")
    remaining = 2;
  while (remaining > 0 && i < len - 1 && i > 0) {
    // Preload in the direction the user is moving.
    if (userAction == "next" || userAction == "nextPublisher")
      i++;
    else
      i--;
    if (wanted(comics[i])) {
      preloadImage(comics[i]);
      remaining--;
    }
  }
  // Also preload the next (or prev) publisher.
  remaining = 3;
  i = start;
  while (remaining > 0 && i < len - 1 && i > 0) {
    // Preload in the direction the user is moving.
    if (userAction == "next" || userAction == "nextPublisher")
      i++;
    else
      i--;
    if (comics[start].publisher != comics[i].publisher &&
	wanted(comics[i])) {
      preloadImage(comics[i]);
      remaining--;
    }
  }
}

function wanted(comic) {
  if (! comic)
    return false;
  // If we have a curation going on, we only want the curated comics
  // and nothing else.
  if (curationArr)
    return curatedComic(comic);
  
  if ($.inArray("variants", activeCategories) == -1 &&
      comic.variant)
    return false;
  if (specialPublisher(comic.publisher))
    return true;

  // This is rather confused logic, but I wanted the "list first
  // issues and graphic novels" logic, which is what I want...
  if ($.inArray("ones", activeCategories) != -1) {
    if (comic.issue == "#1" || comic.issue == "VOL 01") {
      if ($.inArray("relistings", activeCategories) == -1 &&
	  (comic.original || comic["class"] == "SS" || comic["class"] == "OA"))
	return false;
      else
	return true;
    } else {
      if ($.inArray("resolicitations", activeCategories) == -1 &&
	  comic.resolicited)
	return false;
      if ($.inArray("relistings", activeCategories) == -1 &&
	  (comic.original || comic["class"] == "SS" || comic["class"] == "OA"))
	return false;
      if ($.inArray("gns", activeCategories) != -1 &&
	  comic.binding)
	return true;
      else if ($.inArray("nonumber", activeCategories) != -1 &&
	       (!comic.issue || comic.issue.trim() == ""))
	return true;
      else if ($.inArray("other", activeCategories) == -1)
	return false;
    }
  }
  
  if ($.inArray("nonumber", activeCategories) != -1 &&
      (!comic.issue || comic.issue.trim() == ""))
    return true;
  if ($.inArray("resolicitations", activeCategories) == -1 &&
      comic.resolicited)
    return false;
  if ($.inArray("relistings", activeCategories) == -1 &&
      (comic.original || comic["class"] == "SS" || comic["class"] == "OA"))
    return false;
  if ($.inArray("gns", activeCategories) == -1 &&
      comic.binding)
    return false;
  if ($.inArray("other", activeCategories) == -1 &&
      ! comic.variant &&
      ! comic.resolicited &&
      ! comic.original &&
      ! comic.binding)
    return false;
  return true;
}

var preloadedImages = [];

function preloadImage(comic) {
  if (! comic || ! imgUrl(comic) || preloadedImages[imgUrl(comic)])
    return;
  var image = document.createElement("img");
  image.onload = function() {
    preloadedImages[imgUrl(comic)] = [new Date(), image];
    $(image).remove();
  };
  image.src = imgUrl(comic);
  image.style.display = "none";
  image.style.width = "480px";
  image.style.display = "none";
  document.body.appendChild(image);
  pruneImageCache();
}

function mTime(d) {
  return d.getTime() + d.getMilliseconds() / 1000;
}

function pruneImageCache() {
  var size = 100;
  var arr = [];
  var i = 0;
  for (var key in preloadedImages) {
    var img = preloadedImages[key];
    if (img)
      arr[i++] = [img[0], key];
  }
  if (arr.length < size)
    return;
  // Sort the oldest first.
  arr.sort(function(e1, e2) {
    return mTime(e1[0]) - mTime(e2[0]);
  });
  // Remove from the image cache.
  for (i = 0; i < arr.length - size; i++)
    preloadedImages[arr[1]] = false;
}

function toggleBuy() {
  if ($("#buy")[0].checked) {
    addBuy(current);
  } else {
    removeBuy(current);
  }
  setBuyColor();
}

function addBuy(code) {
  var buys = localStorage.getItem("buys-" + emeraldDate);
  if (! buys)
    buys = "";
  if (buys.length)
    buys += ",";
  buys += code;
  localStorage.setItem("buys-" + emeraldDate, buys);
}

function removeBuy() {
  var buys = localStorage.getItem("buys-" + emeraldDate);
  if (! buys)
    buys = "";
  buys = buys.replace(new RegExp(",?" + current, "g"), "");
  localStorage.setItem("buys-" + emeraldDate, buys);
}

function setBuy() {
  var name = "buys-" + emeraldDate;
  var buys = localStorage.getItem(name);
  if (! buys)
    buys = "";
  if (buys.match(new RegExp(current)))
    $("#buy")[0].checked = true;
  else
    $("#buy")[0].checked = false;
  setBuyColor();
}

function setBuyColor() {
  if ($("#buy")[0].checked)
    $("#buy-td").css({background: "#50c050"});
  else
    $("#buy-td").css({background: "#c0c0c0"});
}

function changeCategory() {
  var cats = false;
  $.map(categories, function(cat) {
    if ($("#" + cat)[0].checked) {
      if (cats)
	cats += "," + cat;
      else
	cats = cat;
    }
  });
  localStorage.setItem("categories", cats);
  if (cats)
    activeCategories = cats.split(",");
  else
    activeCategories = [];
  disablePublishers();
  return false;
}

function checkCategories () {
  var cats = localStorage.getItem("categories");
  if (cats == null)
    cats = "";
  $.map(categories, function(cat) {
    if ((cats == "" && cat != "variants") ||
	cats.match(new RegExp(cat)))
      $("#" + cat)[0].checked = true;
  });
  changeCategory();
}

function colorbox(html, buttonText, callback) {
  var box = document.createElement("div");
  box.style.position = "fixed";
  box.style.left = "0px";
  box.style.top = "0px";
  box.style.height = window.innerHeight + "px";
  box.style.width = window.innerWidth + "px";
  box.style.display = "block";
  box.className = "event-lightbox";
  box.innerHTML = "<div class='inner-box'>" + html + "</div><div class='close' id='close'><span>Close</span></div>" +
    (buttonText? "<div class='close' id='callback'><span>" + buttonText + "</span></div>": "");
  document.body.appendChild(box);
  $(document).keyup(function(e) {
    if (e.keyCode == 27) {
      $(box).remove();
    }
  });
  if (callback)
    $("#callback").bind("click", function() {
      callback();
    });
  $("#close").bind("click", function() {
    $(box).remove();
  });
  return box;
}

function exportBuys() {
  var name = "buys-" + emeraldDate;
  var buys = localStorage.getItem(name);
  if (! buys) {
    colorbox("Nothing marked for buying");
    return;
  }
  var html = "";
  $.map(buys.split(","), function(code) {
    if (! code)
      return;
    var comic = comics[currentIndex(code)];
    html += code + " (" + comic.publisher + ") " +
      comic.name + "<br>";
  });
  colorbox(html);
}

function displayVariants() {
  var i = currentIndex();
  var title = comics[i].title;
  if (! title)
    return;
  while (++i < comics.length &&
	 comics[i].title == title &&
	 comics[i].variant) {
    var div = document.createElement("div");
    div.innerHTML = comics[i].name;
    div.className = "variant";
    $("#variant-comics").append(div);
    var func = function() {
      var code = comics[i].code;
      $(div).bind("click", function() {
	loadImageAndDisplay(comics[currentIndex(code)], false, true);
      });
    };
    func();
  }
}


function addPublishers() {
  var publishers = [];
  var len = comics.length;
  var prev = false;
  var $select = $("#publishers");
  for (var i = 0; i < len; i++) {
    if (comics[i].publisher != prev) {
      prev = comics[i].publisher;
      publishers[prev] = i;
      $select.append("<option value='" + prev + "'>" + prev);
    }
  }
  $select.bind("change", function() {
    var i = publishers[$select.val()];
    while (comics[i] && ! wanted(comics[i]))
      i++;
    loadImageAndDisplay(comics[i]);
    $select.blur();
    closeMenu();
  });
}

function addMonths() {
  var $select = $("#months");
  var monthNames = ["January", "February", "March", "April", "May", "June",
		    "July", "August", "September", "October", "November",
		    "December"];
  for (var i = 0; i < emeraldDates.length; i++) {
    var month = emeraldDates[i];
    var match = month.split("-");
    var selected = "";
    if (emeraldDates[i] == emeraldDate)
      selected = " selected";
    $select.append("<option value='" + month + "'" + selected + ">" +
		   monthNames[parseInt(match[1]) - 1] +
		   " " + match[0]);
  }
  $select.bind("change", function() {
    $select.blur();
    var url = window.location.href.replace(/[?].*/, "");
    window.location.href = url + "?month=" + $select.val();
    closeMenu();
  });
}

function removeExplanation() {
  $("#explanation").remove();
  localStorage.setItem("explanation", "true");
}

function disablePublishers() {
  var $select = $("#publishers");
  var prev;
  var want = false;
  for (var i = 0; i < comics.length; i++) {
    var comic = comics[i];
    if (prev && prev != comic.publisher) {
      disablePublisher(prev, $select, want);
      want = false;
    }
    prev = comic.publisher;
    if (wanted(comic))
      want = true;
  }
  disablePublisher(prev, $select, want);
}

function disablePublisher(publisher, $select, want) {
  var $option = $select.find("option[value='" +
			     publisher.replace(/'/, "\\'") +
			     "']");
  if (want)
    $option.removeAttr("disabled");
  else
    $option.attr("disabled", true);
  if (specialPublisher(publisher.replace(",", "")))
    $option.addClass("special-publisher");
  else
    $option.removeClass("special-publisher", true);
}

// "Special" publishers are publishers we want to see all comics from,
// and that are sorted first.
function toggleSpecialPublisher() {
  var s = localStorage.getItem("specials");
  if (s)
    var specials = s.split(/,/);
  else
    specials = [];
  var publisher = $("#publisher").attr("data-publisher");
  var index = specials.indexOf(publisher);
  if (index == -1)
    specials.push(publisher);
  else
    specials.splice(index, 1);
  localStorage.setItem("specials", specials.join(","));
  setSpecialColor(publisher);
}

function specialPublisher(publisher) {
  var specials = localStorage.getItem("specials");
  if (! specials || specials.split(/,/).indexOf(publisher) == -1)
    return false;
  else
    return true;
}

function setSpecialColor(publisher) {
  if (specialPublisher(publisher)) {
    $("#publisher").addClass("special-publisher");
  } else
    $("#publisher").removeClass("special-publisher");
}

function startSpinner() {
  var image = document.createElement("img");
  image.onload = function() {
    image.style.display = "block";
  };
  image.src = "ajax-loader.gif";
  image.style.display = "none";
  image.style.zIndex = 10000;
  image.style.position = "absolute";
  image.style.top = "30px";
  if (isMobile)
    image.style.left = "100px";
  else
    image.style.left = "200px";
  $("#cover").append(image);
  return image;
}

function removeSpinner(spinner) {
  $(spinner).fadeOut(100, function() {
    $(spinner).remove();
  });
}

function rearrangeForMobile() {
  var creators = $("#creators")[0];
  var cover = $("#cover")[0];
  var options = $("#options")[0];

  $("#creators").remove();
  $("#cover").remove();
  $("#options").remove();
  $("#logo").remove();

  var $menu = $("<div id='menu'>");
  $menu.css("display", "none");
  $menu.append($(options).find("form"));
  $("body").append($menu);
  if (phoneGap)
    $("table.actions").find("tbody").append($("<tr><td id='share'>Share</td></tr>"));
  $("table.actions").find("tbody").append($("<tr><td id='close-menu'>Close</td></tr>"));

  $.map([creators, cover], function(elem) {
    var tr = document.createElement("tr");
    $(tr).append(elem);
    $("#tmain").prepend(tr);
    $(elem).attr("colspan", "3");
    $(elem).attr("rowspan", "1");
  });

  var barCont = document.createElement("div");
  barCont.className = "navigation-bar";
  var barInner = document.createElement("div");
  $(barCont).append(barInner);
  var bar = document.createElement("table");
  bar.className = "navigation-bar";
  $(barInner).append(bar);
  var line = document.createElement("tr");
  $(bar).append(line);
  $(line).append($("<td id='small-menu'>Menu</td>"));
  $.map(["buy-td", "prevPublisher", "nextPublisher", "prev", "next"], function(name) {
    var $elem = $("#" + name);
    $elem.attr("colspan", "1");
    $elem.remove();
    $(line).append($elem);
  });
  $("body").append(barCont);

  var trans = {"prevPublisher": "fast_rewind",
	       "nextPublisher": "fast_forward",
	       "prev": "skip_previous",
	       "next": "skip_next",
	       "small-menu": "more_horiz"};
  for (var key in trans) {
    var $elem = $("#" + key);
    $elem.html("<i class='material-icons'>" + trans[key] + "</i>");
  }

  // Remove "I might buy this" text.
  $($("#buy-td")[0].childNodes[0].childNodes[1]).remove();
  $("#small-menu").click(function () {
    showMenu();
  });
  $(".removable").remove();
  $("#close-menu").click(function() {
    closeMenu();
  });
  $("#share").click(function() {
    shareBuyList();
  });
  if (isMobile) {
    $("td.about").html("About");
    $("td.about").click(function() {
      colorbox("This app displays information about comics that can be ordered in the American direct market from <a href='http://www.diamondcomics.com/'>Diamond Comic Distributors</a>.  The data comes from their web site.<p>You can mark the comics you are interested in here in this app and then click the 'Share' button to send this list to, for instance, a friendly comic book store that will then order the books in for you.<p>For a more in-depth rationale behind this app, see <a href='http://lars.ingebrigtsen.no/2015/10/22/a-simpler-previews-interface/'>this article</a>.");
    });
  }
  $("a").click(function() {
    if (phoneGap && device.platform != "Android")
      window.open(this.src, "_system", "location=no");
    else
      document.location.href = this.src;
  });

  waitForWebfonts("Material Icons", "normal", function() {
    $(barCont).css({"display": "block"});
  });
}

function waitForWebfonts(font, weight, callback) {
  var times = 0;
  var node = document.createElement('span');
  // Characters that vary significantly among different fonts
  node.innerHTML = 'giItT1WQy@!-/#';
  // Visible - so we can measure it - but not on the screen
  node.style.position      = 'absolute';
  node.style.left          = '-10000px';
  node.style.top           = '-10000px';
  // Large font size makes even subtle changes obvious
  node.style.fontSize      = '300px';
  // Reset any font properties
  node.style.fontFamily    = 'serif';
  node.style.fontVariant   = 'normal';
  node.style.fontStyle     = 'normal';
  node.style.fontWeight    = weight;
  node.style.letterSpacing = '0';
  document.body.appendChild(node);

  // Remember width with no applied web font
  var width = node.offsetWidth;

  node.style.fontFamily = font;
  
  var interval;
  var checkFont = function() {
    // Compare current width with original width
    if (node && node.offsetWidth != width ||
       times++ > 10) {
      clearInterval(interval);
      callback();
      return true;
    }
    return false;
  };
  
  interval = setInterval(checkFont, 50);
}

function showMenu() {
  $("div.navigation-bar").fadeOut(200);
  $("#menu").fadeIn(200);
}

function closeMenu() {
  $("#menu").fadeOut(200);
  $("div.navigation-bar").fadeIn(200);
}

function shareBuyList() {
  var name = "buys-" + emeraldDate;
  var buys = localStorage.getItem(name);
  if (! buys) {
    colorbox("Nothing marked for buying");
    return;
  }
  var text = "";
  $.map(buys.split(","), function(code) {
    if (! code)
      return;
    var comic = comics[currentIndex(code)];
    if (comic.original)
      text += comic.original;
    else
      text += code;
    text += " (" + comic.publisher + ") " +
      comic.name + "\n\n";
  });
  window.plugins.socialsharing.share(text);
}

var isMobile;
function prepareStart() {
  $(document).ready(function() {
    if (window.innerWidth < 760)
      isMobile = true;
    if (isMobile) {
      if ('addEventListener' in document) {
	document.addEventListener('DOMContentLoaded', function() {
	  FastClick.attach(document.body);
	}, false);
      }
      rearrangeForMobile();
      var mc = new Hammer($("body")[0]);
      mc.on("swipeleft", function() {
	gotoNext();
      });
      mc.on("swiperight", function() {
	gotoPrev();
      });
    }
    startUp();
  });
}

function imgUrl(comic) {
  if (! comic || ! comic.img)
    return false;
  return "https://goshenite.info/data/img/" + emeraldDate + "/" +
    comic.code + "-scale.jpg";
}

function curateList() {
  var buys = localStorage.getItem("buys-" + emeraldDate);
  if (! buys) {
    colorbox("Nothing marked for buying");
    return;
  }
  var html = "<form class='curation'><input type='text' id='user' size=40 placeholder='Your name'><textarea cols=40 rows=4 id='description' placeholder='A description of your list'></textarea><table class='curation'>";
  $.map(buys.split(","), function(code) {
    if (! code)
      return;
    var comic = comics[currentIndex(code)];
    if (! comic)
      return;
    var note = localStorage.getItem("note-" + comic.code);
    if (! note)
      note = "";
    html += "<tr><td><input type='checkbox' checked id='curate-" + code + "'><td>" +
      comic.publisher + "<td>" + comic.name + "<td>" + note + "</tr>";
  });
  html += "</table>";
  var box = colorbox(html, "Share your curated list", function() {
    shareCuration(box);
  });
  // Allow scrolling.
  box.style.position = "absolute";
  $("table.curation").find(":checkbox").click(function() {
    var code = this.id.replace(/curate-/, "");
    if (this.checked)
      addBuy(code);
    else
      removeBuy(code);
  });
  
  $("#user").val(localStorage.getItem("user"));
  $("#description").val(localStorage.getItem("description"));
}

var firebaseInit = false;

function initFirebase() {
  if (firebaseInit)
    return;
  
  var config = {
    apiKey: "AIzaSyCM8Is-PliOBHlkYcPi9z_bq8RziBGvLWM",
    authDomain: "goshenite-faf04.firebaseapp.com",
    databaseURL: "https://goshenite-faf04.firebaseio.com",
    projectId: "goshenite-faf04",
    storageBucket: "",
    messagingSenderId: "533960414840"
  };
  firebase.initializeApp(config);
  firebaseInit = true;
}

function shareCuration(box) {
  initFirebase();
  firebase.auth().signInAnonymously()
    .catch(function(error) {
      console.log(error);
    });

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var database = firebase.database();
      var name = $("#user").val(),
	  description = $("#description").val();
      if (! name)
	return;
      localStorage.setItem("user", name);
      localStorage.setItem("description", description);
      var data = [];
      $.map(localStorage.getItem("buys-" + emeraldDate).split(","),
	    function(code) {
	      if (code) {
		var note = localStorage.getItem("note-" + code);
		if (! note)
		  note = "";
		data.push({code: code, desc: note});
	      }
	    });
      var ref = database.ref("curation");
      var key = false;
      ref.once("value")
	.then(function(snapshot) {
	  snapshot.forEach(function(child) {
	    if (child.child("author").val() == user.uid &&
		child.child("month").val() == emeraldDate)
	      key = child.key;
	  });
	  if (! key)
	    key = database.ref('curation').push().key;
	  ref.child(key).set({
	    author: user.uid,
	    month: emeraldDate,
	    user: name,
	    description: description,
	    approved: false,
	    comics: data
	  });
	  $(box).remove();
	  colorbox("Your list will be made public to all other Goshenite users after approval.");
	});
    }
  });
}

function listCurations() {
  initFirebase();
  var ref = firebase.database().ref("curation");
  var $cont = $("<div class='curations'>");
  $("body").append($cont);
  var spinner = startSpinner();
  ref.once("value")
    .then(function(snapshot) {
      removeSpinner(spinner);
      var $html = $("<table class='curations'><tr><th>Curator<th>Description<th>Comics</tr>");
      snapshot.forEach(function(child) {
	if (child.child("month").val() == emeraldDate) {
	  var $tr = $("<tr><td>" + child.child("user").val() + "<td>" +
		      child.child("description").val() + "<td class='count'>" +
		      child.child("comics").val().length +
		      "</tr>");
	  var choose = function(child) {
	    return function() {
	      chooseCuration(child.child("user").val(),
			     child.child("comics").val());
	    };
	  };
	  $tr.click(choose(child));
	  $html.append($tr);
	}
      });
      $html.append($("</table>"));
      $cont.append($html);
      $cont.append($("<div class=close id='close-see-curations'><span>Close</span></div>"));
      $("#close-see-curations").click(function() {
	$("div.curations").remove();
      });
    });
}

function chooseCuration(name, arr) {
  $("div.curations").remove();
  curationName = name;
  // Sort the curations so that we start with the first one and
  // can proceed with the "next" button.
  var rank = [];
  for (var i = 0; i < comics.length; i++)
    rank[comics[i].code] = i;
  curationArr = arr;
  curationArr.sort(function(elem1, elem2){
    return rank[elem1.code] - rank[elem2.code];
  });
  loadImageAndDisplay(comics[currentIndex(curationArr[0].code)]);
}

function curatedComic(comic) {
  for (var i = 0; i < curationArr.length; i++)
    if (comic.code == curationArr[i].code)
      return true;
  return false;
}

function addNote() {
  var id = "note-" + current;
  var note = localStorage.getItem(id);
  if (! note)
    note = "";
  $("body").append($("<div class='note'><textarea cols=40 rows=4 id='text-note' placeholder='A note on this comic that will be shared with your curation'>" + note + "</textarea><div class=close id='close-note'><span>Close</span></div>"));
  $("#close-note").click(function() {
    localStorage.setItem(id, $("#text-note").val());
    $("div.note").remove();
  });
}

function addSearch() {
  $("#nextsearch").click(function() {
    doSearch();
  });
  $('#searchbox').keypress(function (e) {
    if (e.which == 13) {
      doSearch();
      return false;  
    }
  });   
}

function doSearch() {
  var search = $("#searchbox").val().trim().toLowerCase();
  if (search == "") {
    colorbox("No search term given");
    return;
  }
  var i = 0;
  var start = 0;
  var match = window.location.href.match("code=(.*)");
  if (match) {
    i = currentIndex(match[1]) + 1;
    start = i - 1;
  }
  for (var times = 0; times < 2; times++) {
    for (; i < comics.length; i++) {
      if (comics[i].text.toLowerCase().search(search) > -1
	  || comics[i].creators.toLowerCase().search(search) > -1) {
	if (i == start)
	  colorbox("Only one match");
	else
	  loadImageAndDisplay(comics[i]);
	return;
      }
    }
    i = 0;
  }
  colorbox("No matches found");
}

function showAbout() {
  colorbox("<h1>Goshenite</h1>" +
	   "This is a web site that shows the comics available via the Diamond and Lunar comics distributors in the coming months (as well as in the past)." +
	   "<p>You can use the mouse to click on navigation options in the right hand menu, but you can also use keyboard shortcuts to navigate faster." +
	   "<ol>" +
	   "<li>Use the Left key to go to the next comic, and the Right key to go to the previous comic." +
	   "<li>The Down and Up work the same as Left and Right." +
	   "<li>Use the PgDown key to go to the next publisher, and the PgUp key to go to the previous publisher." +
	   "<li>If you see something you want to buy, hit the Enter key.  (This toggles, so if you don't want to buy after all, hit the Enter key again.)" +
	   "</ol>" +
	   "<p>After you're done, click on the Export button to get a list of the comics you've selected.  This is on a format that most comics shops should be able to use to order stuff for you." +
	   "<p>You may be interested in some publishers more than others.  Click on the publisher name (in the upper left corner) to toggle whether you're interested or not.  If the publisher name is green, it's one of your favourites, and will then be sorted first in the publisher listing." +
	   "<p>There are many filtering options available.  If you're only interested in first issues, for instance, then check the 'First issues' checkbox, and uncheck the rest.  The navigation commands will then skip past everything other than first issues." +
	   "<p>For more information about this project, see <a href='https://lars.ingebrigtsen.no/2015/10/22/a-simpler-previews-interface/'>this blog post</a>."
	  );
}
