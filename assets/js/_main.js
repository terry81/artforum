/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */

$(function() {
  // FitVids init
  $("#main").fitVids();

  // Sticky sidebar
  var stickySideBar = function() {
    var show =
      $(".author__urls-wrapper").find("button").length === 0
        ? $(window).width() > 1024 // width should match $large Sass variable
        : !$(".author__urls-wrapper").find("button").is(":visible");
    if (show) {
      // fix
      $(".sidebar").addClass("sticky");
    } else {
      // unfix
      $(".sidebar").removeClass("sticky");
    }
  };

  stickySideBar();

  $(window).resize(function() {
    stickySideBar();
  });

  // Follow menu drop down
  $(".author__urls-wrapper").find("button").on("click", function() {
    $(".author__urls").toggleClass("is--visible");
    $(".author__urls-wrapper").find("button").toggleClass("open");
  });

  // Close search screen with Esc key
  $(document).keyup(function(e) {
    if (e.keyCode === 27) {
      if ($(".initial-content").hasClass("is--hidden")) {
        $(".search-content").toggleClass("is--visible");
        $(".initial-content").toggleClass("is--hidden");
      }
    }
  });

  // Search toggle
  $(".search__toggle").on("click", function() {
    $(".search-content").toggleClass("is--visible");
    $(".initial-content").toggleClass("is--hidden");
    // set focus on input
    setTimeout(function() {
      $(".search-content").find("input").focus();
    }, 400);
  });

  // Smooth scrolling
  var scroll = new SmoothScroll('a[href*="#"]', {
    offset: 20,
    speed: 400,
    speedAsDuration: true,
    durationMax: 500
  });

  // Gumshoe scroll spy init
  if($("nav.toc").length > 0) {
    var spy = new Gumshoe("nav.toc a", {
      // Active classes
      navClass: "active", // applied to the nav list item
      contentClass: "active", // applied to the content

      // Nested navigation
      nested: false, // if true, add classes to parents of active link
      nestedClass: "active", // applied to the parent items

      // Offset & reflow
      offset: 20, // how far from the top of the page to activate a content area
      reflow: true, // if true, listen for reflows

      // Event support
      events: true // if true, emit custom events
    });
  }

  // Image lightbox is handled by assets/js/lightbox.js (vanilla JS).
  // jQuery Magnific Popup was removed: it passed plugin options straight into
  // $(...) / .prependTo(...), which CodeQL flags as js/unsafe-jquery-plugin.

  // Add anchors for headings
  $('.page__content').find('h1, h2, h3, h4, h5, h6').each(function() {
    var id = $(this).attr('id');
    if (id) {
      var anchor = document.createElement("a");
      anchor.className = 'header-link';
      anchor.href = '#' + id;
      anchor.innerHTML = '<span class="sr-only">Permalink</span><svg class="afh-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M326.6 185.4a128 128 0 0 1 0 181l-70.6 70.7a128 128 0 1 1-181-181l39-39a24 24 0 0 1 41 16.1 152 152 0 0 0 8 51 16 16 0 0 1-3.8 16.6l-13.7 13.8a60.4 60.4 0 1 0 85 85.3l70.7-70.6a60.4 60.4 0 0 0 0-85.4 62.9 62.9 0 0 0-8.7-7.2 16 16 0 0 1-6.9-12.6 39.9 39.9 0 0 1 11.7-30l22.1-22.2a16 16 0 0 1 20.5-1.7 129 129 0 0 1 14.7 12.2z"/></svg>';
      anchor.title = "Permalink";
      $(this).append(anchor);
    }
  });
});
