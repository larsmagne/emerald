var current = false;
var comics = false;
var emeraldDate = "2015-10";
var categories = ["variants", "resolicitations", "relistings", "other"];
var activeCategories = false;

function startUp() {
  $.ajax({
    url: "data/previews-" + emeraldDate + ".json",
    dataType: "json",
    success: function(data) {
      comics = data;
      var match = window.location.href.match("code=(.*)");
      if (match)
	loadImageAndDisplay(data[currentIndex(match[1])]);
      else
	loadImageAndDisplay(data[20]);
      addNavigation();
      checkCategories();
    }});
}

function display(elem, image) {
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
  window.history.pushState(elem.code, elem.name, url);
  $("#cover").empty();
  if (image) {
    $("#cover").append(image);
    image.style.display = "block";
  }
  $("#publisher").html(elem.publisher);
  $("#title").html(elem.name);
  $("#creators").html(elem.creators || "");
  $("#text").html(elem.text || "");
  $("#price").html(elem.price);
  $("#issue").html(elem.issue || "");
  $("#class").html(elem["class"] || "");
  $("#date").html(elem.date || "");
  $("#original").html(elem.original || "");
  $("#code").html(elem.code);

  if (elem.issue == "#1")
    $("#issue").addClass("first");
  else
    $("#issue").removeClass("first");

  $("#variant-comics").empty();
  displayVariants();
  
  setBuy();
  preload();
}

function loadImageAndDisplay(elem) {
  if (! elem.img) {
    display(elem, false);
    return;
  }
  var image = document.createElement("img");
  image.onload = function() {
    $(image).remove();
    display(elem, image);
  };
  image.onerror = function() {
    $(image).remove();
    display(elem, false);
  };
  image.src = elem.img;
  image.style.width = "380px";
  image.style.display = "none";
  document.body.appendChild(image);
}

function addNavigation() {
  $("#next").bind("click", gotoNext);
  $("#prev").bind("click", gotoPrev);
  $(document).keydown(function(e) {
    switch(e.which) {
    case 38: // up
      gotoPrev();
      break;

    case 40: // down
      gotoNext();
      break;

    case 33: // pgup
      gotoPrevPublisher();
      break;

    case 34: // pgdown
      gotoNextPublisher();
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
	  loadImageAndDisplay(comics[i + 1]);
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
  var image = document.createElement("img");
  image.onload = function() {
    $(image).remove();
  };
  image.src = comic.img;
  image.style.display = "none";
  image.style.width = "380px";
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
  return false;
}

function checkCategories () {
  var cats = localStorage.getItem("categories");
  $.map(categories, function(cat) {
    if (cats === null || cats.match(new RegExp(cat)))
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
  box.innerHTML = html;
  $(box).bind("click", function() {
    $(box).remove();
    return false;
  });
  document.body.appendChild(box);
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
	displayVariant(code);
      });
    };
    func();
  }
}

function displayVariant(code) {
  var comic = comics[currentIndex(code)];
  console.log(comic);
  $("#cover").html("<img src='" + comic.img + "' width=380>");
}
