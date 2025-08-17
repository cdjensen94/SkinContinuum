/* eslint-env browser, jquery */
( function () {
  // Be defensive; older pages can load before mw is ready
  if ( !window.mw || !mw.user || !mw.user.clientPrefs ) {
    return;
  }

  var html = document.documentElement;

  // Helper: add both "vector-" and "continuum-" classes
  function addDualClass( suffix ) {
    html.classList.add( 'vector-' + suffix );
    html.classList.add( 'continuum-' + suffix );
  }

  // Read prefs using either key family (support both, whichever exists)
  // Vector’s originals:
  var enabled = mw.user.clientPrefs.get( 'vector-feature-custom-font-size' );
  var level = mw.user.clientPrefs.get( 'vector-feature-custom-font-size-level' );

  // Your renamed keys (in case you changed them):
  if ( enabled === undefined ) {
    enabled = mw.user.clientPrefs.get( 'continuum-feature-custom-font-size' );
  }
  if ( level === undefined ) {
    level = mw.user.clientPrefs.get( 'continuum-feature-custom-font-size-level' );
  }

  // Normalize bool/number
  enabled = !!enabled;
  // Some setups store level as string; coerce to int if possible
  if ( typeof level === 'string' && level !== '' && !isNaN( level ) ) {
    level = parseInt( level, 10 );
  }

  // Mirror Vector’s contract on <html>
  if ( enabled ) {
    addDualClass( 'feature-custom-font-size-clientpref-enabled' );
  }
  if ( typeof level === 'number' && isFinite( level ) ) {
    addDualClass( 'feature-custom-font-size-clientpref-' + level );
  }

  // Optional: if Vector uses an "excluded" marker in parts of the UI
  // (you probably copied this too), we ensure both prefixes exist wherever you add one.
  // This keeps "don’t scale the header" behavior consistent if used.
  var observer = new MutationObserver( function ( mutations ) {
    mutations.forEach( function ( m ) {
      if ( m.attributeName === 'class' && m.target.nodeType === 1 ) {
        var el = m.target;
        if ( el.classList.contains( 'vector-feature-custom-font-size-clientpref--excluded' ) &&
             !el.classList.contains( 'continuum-feature-custom-font-size-clientpref--excluded' ) ) {
          el.classList.add( 'continuum-feature-custom-font-size-clientpref--excluded' );
        }
        if ( el.classList.contains( 'continuum-feature-custom-font-size-clientpref--excluded' ) &&
             !el.classList.contains( 'vector-feature-custom-font-size-clientpref--excluded' ) ) {
          el.classList.add( 'vector-feature-custom-font-size-clientpref--excluded' );
        }
      }
    } );
  } );

  observer.observe( document.documentElement, { attributes: true, subtree: true } );
}() );
