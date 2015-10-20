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
  $("#cover").empty();
  $("#cover").append(image);
  image.style.display = "block";
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
}

function loadImageAndDisplay(elem) {
  current = elem.code;
  var image = document.createElement("img");
  image.onload = function() {
    $(image).remove();
    display(elem, image);
  };
  image.src = elem.img;
  image.style.width = "380px";
  image.style.display = "none";
  document.body.appendChild(image);
}

function addNavigation() {
  $("#next").bind("click", gotoNext);
  $("#prev").bind("click", gotoPrev);
}

function gotoNext() {
  var len = comics.length;
  for (var i = 0; i < len; i++) {
    if (comics[i]["code"] == current) {
      if (i + 1 < len)
	loadImageAndDisplay(comics[i + 1]);
      return;
    }
  }
}

function gotoPrev() {
  var len = comics.length;
  for (var i = 0; i < len; i++) {
    if (comics[i]["code"] == current) {
      if (i > 0)
	loadImageAndDisplay(comics[i - 1]);
      return;
    }
  }
}
