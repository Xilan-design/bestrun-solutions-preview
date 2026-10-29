document.addEventListener('DOMContentLoaded', function () {
    var portfolioSwiper = new Swiper('.portfolio-swiper', {
        slidesPerView: 3,
        spaceBetween: 24,
        navigation: {
            nextEl: '.portfolio-swiper-button-next',
            prevEl: '.portfolio-swiper-button-prev',
        },
        pagination: {
            el: '.portfolio-swiper-pagination',
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            }
        }
    });

    var blogSwiper = new Swiper('.blog-swiper', {
        slidesPerView: 3,
        spaceBetween: 24,
        navigation: {
            nextEl: '.blog-swiper-button-next',
            prevEl: '.blog-swiper-button-prev',
        },
        pagination: {
            el: '.blog-swiper-pagination',
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            }
        }
    });
});
