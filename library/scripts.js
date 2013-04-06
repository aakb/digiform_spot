
var idleTime = 0;
var carouselObj;
var spotdatatype = 'ebog';

var myConfig = {
  folder : 'http://images.spot.ereolen.dk/books/',
  maxImagesInList : 75,
  max_image_width : 330,
  max_image_height : 500,
  image_border : 3,
  space_between_images : 0.20, // procent
  number_of_images : 3
};

Array.prototype.shuffle = function () {
  for (var i = this.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = this[i];
    this[i] = this[j];
    this[j] = tmp;
  }
  return this;
}

function show_banner (sid) {
    var current_banner; // maybe global variable later
    
    // bland listen af numre
    spotdata.list[sid].shuffle();

    // create banner-html
    current_banner = []
    var s = '';
    for ( var k = 0; k < spotdata.list[sid].length; k++){
      var isbn = spotdata.list[sid][k];
      var e = spotdata.isbn[isbn];
      if(e) {
        current_banner.push(isbn)
        s += '<li id="isbn_' + isbn + '"><img src="' + myConfig.folder + e.i + '" width="' + e.w + '" height="' + e.h + '" alt="' + e.t + '" /></li>'
      }
      if(current_banner.length >= myConfig.maxImagesInList) break;
    }

    var el = document.createElement('ul');
    $(el).html(s);

    // slet tidligere carousel - er det nødvendigt?
    if(carouselObj) $('.imagebanner').jcarousel('destroy');

    // overfør data
    $('.imagebanner').html(el);

    // tildel click-funktion
    $.each( current_banner, function( key, isbn ) { $('#isbn_' + isbn).click( function() { show_popupbox(isbn);return false;} ) });

    // opret carousel - animation http://jqueryui.com/effect/#easing
    carouselObj = $('.imagebanner').jcarousel({ 'wrap': 'circular', 'animation': { 'duration': 1000, 'easing':   'easeInOutCubic'  } });

    // $('.imagebanner').delegate('li', 'itemfirstout.jcarousel', function(event, carousel) {
        // console.log( ...[$(this).attr('id').slice(5)].t );
    // });
    banner_recalculate();
}

function banner_recalculate() {
  // setting the height/width/margin of images, padding of the image container when resizing/new search og initialize

  var banner_width = $('.imagebanner').outerWidth(true);
  var new_width = banner_width / myConfig.number_of_images;

  var new_image_margin = Math.floor( new_width * myConfig.space_between_images );
  var new_image_width = Math.floor( new_width - new_image_margin )
  var new_image_height =  Math.floor( new_image_width * myConfig.max_image_height / myConfig.max_image_width )

  var new_banner_width = myConfig.number_of_images * ( new_image_width + 2 * myConfig.image_border ) + ( myConfig.number_of_images -1 ) * new_image_margin
  var new_banner_margin = Math.floor(( banner_width - new_banner_width ) / 2);
  var new_banner_height = new_image_height + 2 * myConfig.image_border

  $('.imagebanner img').css( { 'margin-right' : new_image_margin, 'width' : new_image_width, 'height' : new_image_height } );
  $('.imagebanner').css( { 'height' : new_banner_height, 'margin-left' : new_banner_margin, 'margin-right' : new_banner_margin } );

  var banner_height = $('.wrapper').outerHeight() - $('.body-header').outerHeight() - $('#menucontainer').outerHeight();
  var banner_padding = Math.floor(( banner_height - new_banner_height ) /2 );
  $('#imagecontainer').css( { 'padding-top' : banner_padding, 'padding-bottom' : banner_padding });
}

function create_events() {

    $('.imagebanner-left').click(function() { idleTime=0; $('.imagebanner').jcarousel('scroll', '-=3'); return false; });
    $('.imagebanner-right').click(function() { idleTime=0; $('.imagebanner').jcarousel('scroll', '+=3'); return false; });

    // swipe
    $("body").touchwipe({
           wipeLeft: function() { $('.imagebanner-right').click(); },
           wipeRight: function() { $('.imagebanner-left').click(); },
         //  wipeUp: function() { alert("up"); },
         //  wipeDown: function() { alert("down"); },
           min_move_x: 20,
           min_move_y: 20,
           preventDefaultEvents: true
      });

    // inaktiv-checkeren...
    setInterval(function() { idleTime+= 5; if(idleTime>10) { $('.imagebanner-right').click();} }, 5000);
    $("body").on('mousemove', function (e) { idleTime = 0; });
    $("body").on('keypress',  function (e) { idleTime = 0; });

    // resize will trigger new size of banner
    $(window).on('resize', banner_recalculate);

}

function create_menu(){

  var make_item = function(ele){ return '<a href="#" class="menu_' + ( ele.sid ? ele.sid : 'nolink' ) + '">'+ ele.label +'</a>'; }

  var s = '<ul id="menu">'
  for ( var i = 0; i < spotdata.menu.length; i++) {
    s += '<li>' + make_item( spotdata.menu[i][0] );

    if ( spotdata.menu[i].length > 1 ) {
      s += '<ul>'
      for ( var j = 1; j < spotdata.menu[i].length; j++) {
        s += '<li class="sub">' + make_item( spotdata.menu[i][j] ) + '</li>';
      }
      s += '</ul>'
    }
    s += '</li>'
  }
  s += '</ul>'

  $('#menucontainer').html(s);
  $('#menu').menu({ icons: { submenu: "ui-icon-blank" }, position: { my: "left top", at: "left bottom" } });

  $.each( spotdata.list, function( key, value ) { $('.menu_' + key).click( function() { $('#menu').menu("collapseAll", null, true); show_banner(key); return false} ) });
  $('.menu_nolink' ).click( function() { $('#menu').menu("collapseAll", null, true); return false });
}

function show_popupbox(isbn) {

  // rydop
  $('#message').html('');
  $('input:text').val('');

  //
  if (spotdata.isbn[isbn].d == null) {
    spotdata.isbn[isbn].d = '';
  }

  $('#bookdata').html( '<div><h3>' + spotdata.isbn[isbn].t + '</h3><img class="popup-image" src="' + myConfig.folder + spotdata.isbn[isbn].i + '" />' + spotdata.isbn[isbn].d + '</div>');

  // gem values i formen
  $('#isbn').val(isbn);
  $('#titel').val(spotdata.isbn[isbn].t);
  $('#type').val(spotdatatype);

    // vis boksen (ifald den tidligere er fadeout
  $('#popup').show();  // hide efter submit 4 sek
  $('#myform').show(); // hide efter submit

  // sæt fancyboks op og aktiver den
  $("#inline").fancybox().click();

}

$(document).ready(function(){

  // keyboard
  $('#email').keyboard({ openOn : '', stayOpen : true,
     layout : 'custom',
     customLayout: {
        'default' : [
          "@ 1 2 3 4 5 6 7 8 9 0 + @ {b}",
          "q w e r t y u i o p \u00e5 \u00a8",
          " a s d f g h j k l \u00e6 \u00f8 ' ",
          "{shift} < z x c v b n m , . - ",
          "{accept} {cancel}"
        ],
        'shift' : [
          '\u00bd ! " # \u00a4 % & / ( ) = ? \u0300 {b}',
          "Q W E R T Y U I O P \u00c5 ^",
          "A S D F G H J K L \u00c6 \u00d8 * ",
          "{shift} > Z X C V B N M ; : _ ",
          "{accept} {cancel}"
        ]
      }
    });

  $('.keyimg').click(function(){ $('#email').getkeyboard().reveal();});

  // menuen
  create_menu();

  // imagebanner
  show_banner(spotdata.first);

  // initialiser evetns
  create_events();

  // submit
  $("form").submit(function() {

      // meget simpel emailvalidering
      if ( this.param1.value.search(/.*@.*/) == -1 ) {
         this.param1.focus();
         $('#message').html('<div class="message-info"><p>Skriv din email adresse</p></div>');
         return false;
      }

      // udtræk indhold - klar til ajax
      var str = $("form").serialize();

      $.ajax({
          type: 'POST',
          url: '/cgi-bin/sendlink.pl',
          data: str,
          success: function(data) {
              // efter submit
              // vis resultat

              if (data == "1") {
                $('#message').html('<div class="message-success"><p>Din email er sendt.</p></div>');
              }
              else {
                $('#message').html('<div class="message-error"><p>Der er sket en fejl, prøv igen.</p></div>');
              }

              // skjul formularen
              $('#myform').hide();
              // tøm indhold i formularen
              $('input:text').val('');

              // fadeout hele popup og luk den til sidst
              $('#popup').fadeOut(4000, function(){ $.fancybox.close() } );

              },
          dataType: 'html',
          error: function(jqXHR, textmsg) {
                $('#message').html('<div class="message-error"><p>Der er sket en hændelsestype: ' + textmsg + ' , prøv igen.</p></div>');
              }

        });
      return false;
    });
});
