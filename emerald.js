var current = false;
var comics = false;
var emeraldDate = false;
var emeraldDates = false;
var categories = ["variants", "resolicitations", "relistings", "other"];
var activeCategories = false;

function startUp() {
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
      comics = data;
      var match = window.location.href.match("code=(.*)");
      if (match)
	loadImageAndDisplay(data[currentIndex(match[1])]);
      else
	loadImageAndDisplay(data[0]);
      addNavigation();
      checkCategories();
      addPublishers();
      addMonths();
    }});
}

function display(elem, image, noPush, noVariants) {
  current = elem.code;
  var url = window.location.href;
  if (url.match("code=(.*)"))
    url = url.replace(/code=(.*)/, "code=" + elem.code);
  else {
    var sep = "?";
    if (url.match("[?]"))
      sep = "&";
    url = url + sep + "code=" + elem.code;
  }
  if (! noPush)
    window.history.pushState(elem.code, elem.name, url);
  $("#cover").empty();
  if (image) {
    $("#cover").append(image);
    image.style.display = "inline";
  }
  var old = $("#publisher").html();
  $("#publisher").html(elem.publisher);
  if (old && $("#publisher").html() != old)
    $("#publisher").addClass("first-publisher");
  else
    $("#publisher").removeClass("first-publisher");
  $("#title").html(elem.name);
  $("#creators").html(elem.creators || "");
  $("#text").html(elem.text || "");
  $("#price").html(elem.price);
  $("#issue").html(elem.issue || "");
  $("#class").html(elem["class"] || "");
  $("#date").html(elem.date || "");
  $("#original").html(elem.original || "");
  $("#code").html(elem.code);
  $("#limited").html(elem.duration? "" + elem.duration + " issue series": "");
  $("#mature").html(elem.mature? "mature readers": "");
  $("#comething").html(elem.comething || "");

  if (elem.issue == "#1")
    $("#issue").addClass("first");
  else
    $("#issue").removeClass("first");

  if (! noVariants) {
    $("#variant-comics").empty();
    displayVariants();
  }
  
  setBuy();
  preload();
}

function loadImageAndDisplay(elem, noPush, noVariants) {
  if (! elem.img) {
    display(elem, false, noPush, noVariants);
    return;
  }
  var image = document.createElement("img");
  image.onload = function() {
    display(elem, image, noPush, noVariants);
  };
  image.onerror = function() {
    $(image).remove();
    display(elem, false, noPush, noVariants);
  };
  image.src = elem.img;
  image.style.width = "480px";
  image.style.display = "none";
}

function addNavigation() {
  $("#next").bind("click", gotoNext);
  $("#prev").bind("click", gotoPrev);
  $("#nextPublisher").bind("click", gotoNextPublisher);
  $("#prevPublisher").bind("click", gotoPrevPublisher);
  $(document).keydown(function(e) {
    switch(e.which) {
    case 38: // up
      removeExplanation();
      gotoPrev();
      break;

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
      comic.variant) {
    return false;
  }
  if ($.inArray("resolicitations", activeCategories) == -1 &&
      comic.resolicited)
    return false;
  if ($.inArray("relistings", activeCategories) == -1 &&
      comic.original)
    return false;
  if ($.inArray("other", activeCategories) == -1 &&
      ! comic.variant &&
      ! comic.resolicited &&
      ! comic.original)
    return false;
  return true;
}

function preloadImage(comic) {
  if (! comic || ! comic.img)
    return;
  var image = document.createElement("img");
  image.src = comic.img;
  image.style.display = "none";
  image.style.width = "480px";
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
      $select.append("<option>" + prev);
    }
  }
  $select.bind("change", function() {
    loadImageAndDisplay(comics[publishers[$select.val()]]);
    $select.blur();
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
  });
}

function removeExplanation() {
  $("#explanation").remove();
  localStorage.setItem("explanation", "true");
}
