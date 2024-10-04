
  var swiper = new Swiper('.swiper-container', {
    slidesPerView: 3,
    spaceBetween: 20,
    loop: true,
    autoplay: {
      delay: 2000,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 3,
        spaceBetween: 20,
      },
      480: {
        slidesPerView: 2,
        spaceBetween: 10,
      },
    }
  });

// Initialisation du carrousel des nouveaux produits
var produitsSwiper = new Swiper('.produits-slider', {
  slidesPerView: 3,
  spaceBetween: 30,
  loop: true,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  // Responsive breakpoints
  breakpoints: {
    320: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    992: {
      slidesPerView: 3,
    },
  },
});




var projectSwiper = new Swiper('.project-carousel', {
  slidesPerView: 3,  // Display 3 slides at a time
  spaceBetween: 30,  // Space between slides
  loop: true,  // Enable looping
  autoplay: {
      delay: 5000,  // Set delay for autoplay
      disableOnInteraction: false,  // Allow autoplay after interaction
  },
  navigation: {
      nextEl: '.swiper-button-next',  // Link to the next button
      prevEl: '.swiper-button-prev',  // Link to the prev button
  },
  pagination: {
      el: '.swiper-pagination',  // Enable pagination dots
      clickable: true,  // Make the pagination dots clickable
  },
  breakpoints: {  // Make the swiper responsive
      320: {
          slidesPerView: 1,  // 1 slide for small screens
          spaceBetween: 10,  // Less space between slides for small screens
      },
      768: {
          slidesPerView: 2,  // 2 slides for medium screens
          spaceBetween: 20,
      },
      992: {
          slidesPerView: 3,  // 3 slides for larger screens
          spaceBetween: 30,
      },
  },
});



var brandsSwiper = new Swiper('.brands-carousel', {
  slidesPerView: 3,
  spaceBetween: 30,
  loop: true,
  autoplay: {
    delay: 500,
  },
  breakpoints: {
    // when window width is >= 320px
    320: {
      slidesPerView: 2,
      spaceBetween: 10,
    },
    // when window width is >= 480px
    480: {
      slidesPerView: 3,
      spaceBetween: 20,
    },
    // when window width is >= 768px
    768: {
      slidesPerView: 3,
      spaceBetween: 30,
    },
    // when window width is >= 992px
    992: {
      slidesPerView: 3,
      spaceBetween: 30,
    },
  },
});
