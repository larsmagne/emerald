var current = false;
var comics = false;
var emeraldDate = false;
var emeraldDates = false;
var categories = ["variants", "resolicitations", "relistings",
		  "ones", "gns", "other"];
var activeCategories = false;

function startUp() {
  startSpinner();
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
    url: "data/previews-" + emeraldDate + ".json",
    dataType: "json",
    success: function(data) {
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
      else
	loadImageAndDisplay(data[0]);
      addNavigation();
      addPublishers();
      checkCategories();
      addMonths();
    }});
  $("#publisher").click(function() {
    toggleSpecialPublisher();
  });
}

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
  if (! noPush)
    window.history.pushState(comic.code, comic.name, url);
  if (image) {
    var children = $("#cover").children();
    // Find out if we need to constrain the height to make things fit.
    image.style.position = "absolute";
    image.style.top = "20px";
    image.style.left = "20px";
    if (! isMobile) {
      var ratio = image.width / 480;
      var cHeight = $("#cover").height() - 20;
    } else {
      ratio = image.width / (window.innerWidth - 200);
      cHeight = window.innerHeight - 200;
      image.style.height = cHeight;
      image.style.width = "";
      $("#cover").css("height", cHeight + 40 + "px");
    }
    if (image.height / ratio > cHeight) {
      image.style.width = "";
      image.style.height = cHeight;
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
  if (! comic.img) {
    display(comic, false, noPush, noVariants);
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
  image.src = comic.img;
  image.style.width = "480px";
  image.style.display = "none";
  // Display a spinner image if the image isn't in the cache.
  if (! image.complete)
    var spinner = startSpinner();
}

function addNavigation() {
  $("#next").bind("click", gotoNext);
  $("#prev").bind("click", gotoPrev);
  $("#nextPublisher").bind("click", gotoNextPublisher);
  $("#prevPublisher").bind("click", gotoPrevPublisher);
  $(document).keydown(function(e) {
    if (document.activeElement.nodeName == "SELECT")
      return;
    switch(e.which) {
    case 37: // left
    case 38: // up
      removeExplanation();
      gotoPrev();
      break;

    case 39: // right
    case 40: // down
      removeExplanation();
      gotoNext();
      break;

    case 33: // pgup
      removeExplanation();
      gotoPrevPublisher();
      break;

    case 34: // pgdown
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
  var len = comics.length;
  var i = currentIndex();
  while (++i < len) {
    if (wanted(comics[i])) {
      loadImageAndDisplay(comics[i]);
      return;
    }
  }
}

function gotoPrev() {
  var len = comics.length;
  var i = currentIndex();
  while (--i > 0) {
    if (wanted(comics[i])) {
      loadImageAndDisplay(comics[i]);
      return;
    }
  }
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
}

function gotoPrevPublisher() {
  var len = comics.length;
  var i = currentIndex();
  var publisher = comics[i].publisher;
  while (--i > 0) {
    if (wanted(comics[i]) && publisher != comics[i].publisher) {
      publisher = comics[i].publisher;
      while (--i > 0) {
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
}

function preload() {
  var len = comics.length;
  for (var i = 0; i < len; i++) {
    if (comics[i]["code"] == current) {
      var remaining = 10;
      while (remaining > 0 && i < len) {
	i++;
	if (wanted(comics[i])) {
	  preloadImage(comics[i]);
	  remaining--;
	}
      }
      return;
    }
  }
}

function wanted(comic) {
  if (! comic)
    return false;
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
      else if ($.inArray("other", activeCategories) == -1)
	return false;
    }
  }
  
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

function preloadImage(comic) {
  if (! comic || ! comic.img)
    return;
  var image = document.createElement("img");
  image.onload = function() {
    $(image).remove();
  };
  image.src = comic.img;
  image.style.display = "none";
  image.style.width = "480px";
  image.style.display = "none";
  document.body.appendChild(image);
}

function toggleBuy() {
  var name = "buys-" + emeraldDate;
  var buys = localStorage.getItem(name);
  if (! buys)
    buys = "";
  if ($("#buy")[0].checked) {
    if (buys.length)
      buys += ",";
    buys += current;
  } else {
    buys = buys.replace(new RegExp(",?" + current, "g"), "");
  }
  localStorage.setItem(name, buys);
  setBuyColor();
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

function colorbox(html) {
  var box = document.createElement("div");
  box.style.position = "absolute";
  box.style.left = "0px";
  box.style.top = $(window).scrollTop() + "px";
  box.style.height = $(window).height() + "px";
  box.style.width = $(window).width() + "px";
  box.style.display = "block";
  box.style.background = "#f0f0f0";
  box.style.color = "black";
  box.style.padding = "100px";
  box.className = "event-lightbox";
  box.innerHTML = html + "<div class='close'><span>Close</span></div>";
  document.body.appendChild(box);
  $(".close").bind("click", function() {
    $(box).remove();
  });
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
  var $option = $select.find("option[value='" + publisher + "']");
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
  $("table.actions").find("tbody").append($("<tr><td id='close-menu'>Close</td></tr>"));
  $("table.actions").find("tbody").prepend($("<colgroup> <col style='width:50%'> <col style='width:50%'> <col style='width: 50px'> </colgroup>"));

  $.map([creators, cover], function(elem) {
    var tr = document.createElement("tr");
    $(tr).append(elem);
    $("#tmain").prepend(tr);
    if (elem === cover) {
      $(elem).attr("colspan", "2");
      $(elem).attr("rowspan", "6");
      $.map(["next", "buy-td", "prevPublisher", "nextPublisher", "prev"], function(name) {
	var line = document.createElement("tr");
	var $elem = $("#" + name);
	$elem.remove();
	$(line).append($elem);
	if (name == "next") {
	  $("#cover").after($elem);
	  $(tr).after($("<tr><td id='small-menu'>Menu</tr>"));
	} else
	  $(tr).after(line);
      });
    } else {
      $(elem).attr("colspan", "3");
      $(elem).attr("rowspan", "1");
    }
  });

  // Remove "I might buy this" text.
  $($("#buy-td")[0].childNodes[0].childNodes[1]).remove();
  $("#small-menu").click(function () {
    showMenu();
  });
  $(".removable").remove();
  $("#close-menu").click(function() {
    closeMenu();
  });
  var $tr = $("<tr class='misc'>");
  $.map(["mature", "class", "code"], function(name) {
    var $elem = $("#" + name);
    if (name == "class" || name == "code")
      $tr.append($elem.clone());
    $elem.attr("id", "#not-" + name);
  });
  $tr.append($("<td>"));
  $("table.main").find("tbody").append($tr);
}

function showMenu() {
  $("#menu").fadeIn(100);
}

function closeMenu() {
  $("#menu").fadeOut(100);
}

var isMobile;
$(document).ready(function() {      
  isMobile = window.matchMedia("only screen and (max-width: 760px)");
  if (isMobile) {
    rearrangeForMobile();
    var mc = new Hammer($("body")[0]);
    mc.on("swiperight", function() {
      gotoNext();
    });
    mc.on("swipeleft", function() {
      gotoPrev();
    });
  }
});
