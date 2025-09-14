( function ( mw, $ ) {
  'use strict';
  var ui = require('./clientPreferences.js');

  // Inline config
  var cfg = {
    'continuum-theme': {
      options: ['imperial-night','ubla-day','ubla-night','verdant'],
      preferenceKey: 'continuum-theme',
      type: 'radio'
    }
  };

  function renderSel() {
    return '.vector-appearance-panel, #vector-appearance-panel, #p-appearance .continuum-menu-content, #mw-appearance-panel';
  }
  function clickSel() {
    return '#vector-appearance-checkbox, #skin-client-prefs-toggle, #continuum-appearance-toggle';
  }

  function mount() {
    var rs = renderSel();
    var cs = clickSel();
    if ( document.querySelector(cs) ) {
      ui.bind(cs, rs, cfg);
    } else {
      ui.render(rs, cfg).catch(function(){});
    }
  }

  $(mount);
  mw.hook('wikipage.content').add(mount);
} )( mediaWiki, jQuery );
