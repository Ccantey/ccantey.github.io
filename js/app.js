$(document).ready(function () {

//Smooth scroll to #id #
$(function() {
  $('a[href]:not([href=#]):not([href=#myCarousel])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top +100
        }, 1000);
        return false;
      }
    }
  });
});
//End smooth scroll

//ScrollSpy

$('body').scrollspy({ target: '#leftNav'});
//$("#leftNav").on("activate.bs.scrollspy", function(){
  //var currentItem = $(".nav li.active>a").text();  
//});

//For some reason modal not firing
$('#nav-brand').click(function(){
  $('#myModal').modal('toggle');
});



});