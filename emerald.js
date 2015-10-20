var current = false;
var comics = false;

function startUp() {
  $.ajax({
    url: "data/previews-2015-10.json",
    dataType: "json",
    success: function(data) {
      comics = data;
      loadImageAndDisplay(data[20]);
      addNavigation();
    }});
}

function display(elem, image) {
  current = elem.code;
  $("#cover").empty();
  if (image) {
    $("#cover").append(image);
    image.style.display = "block";
  }
  $("#publisher").html(elem.publisher);
  $("#title").html(elem.name);
  $("#creators").html(elem.creators);
  $("#text").html(elem.text);
  $("#variants").html(elem.variants);
  $("#price").html(elem.price);
  $("#issue").html(elem.issue);
  $("#class").html(elem["class"]);
  $("#date").html(elem.date);
  $("#original").html(elem.original);
  $("#code").html(elem.code);
  preload();
}

function loadImageAndDisplay(elem) {
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
}

function currentIndex() {
  var len = comics.length;
  for (var i = 0; i < len; i++) {
    if (comics[i]["code"] == current)
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
