/**
 * Dropdown Menu Handler
 * Handles click events for dropdown navigation menus
 */
(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdowns);
  } else {
    initDropdowns();
  }

  function initDropdowns() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    dropdownToggles.forEach(function(toggle) {
      // Click handler for dropdown toggle
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const isExpanded = this.getAttribute('aria-expanded') === 'true';

        // Close all other dropdowns
        closeAllDropdowns();

        // Toggle current dropdown
        this.setAttribute('aria-expanded', !isExpanded);
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.has-dropdown')) {
        closeAllDropdowns();
      }
    });

    // Close dropdowns on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeAllDropdowns();
      }
    });
  }

  function closeAllDropdowns() {
    const allToggles = document.querySelectorAll('.dropdown-toggle');
    allToggles.forEach(function(toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    });
  }
})();
