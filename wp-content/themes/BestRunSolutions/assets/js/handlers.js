document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateVideoMotion = () => {
    document.querySelectorAll('[data-brs-motion-video]').forEach(video => {
      if (reducedMotion.matches) {
        video.pause();
      } else {
        video.play().catch(() => { /* The static background remains available. */ });
      }
    });
  };
  updateVideoMotion();
  reducedMotion.addEventListener('change', updateVideoMotion);
  const burgerButtons = document.querySelectorAll('.header__burger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (mobileNav && burgerButtons.length > 0) {
    burgerButtons.forEach(burger => {
      burger.addEventListener('click', () => {
        mobileNav.classList.toggle('mobile-nav_active');
      });
    });

    const navLinks = mobileNav.querySelectorAll('a');

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('mobile-nav_active');
      });
    });
  }
});

async function sendingCallbackForm(form, e){
    e.preventDefault();
            
    const formData = new FormData(form);
    formData.append('action', 'send_contact_form');
    formData.append('agree', form.querySelector('#agree').checked ? 'on' : 'off');
    
    const submitBtn = form.querySelector('.submit');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const error = document.querySelector('.form-error');
    
    fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const modal = document.getElementById('modal-backcall');
            if (modal) {
                error.style.display = 'none';
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Закрытие модалки при клике на кнопку "Go back"
                const closeBtn = modal.querySelector('.button_v2');
                if (closeBtn) {
                    closeBtn.addEventListener('click', function() {
                        modal.style.display = 'none';
                        document.body.style.overflow = '';
                    });
                }
            }
            
            form.reset();
        } else {
            const error = document.querySelector('.form-error');
            error.style.display = 'flex';
        }
    })
    .finally(() => {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    });

    const modal = document.getElementById('modal-backcall');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

}


