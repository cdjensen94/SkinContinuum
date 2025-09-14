/**
 * @typedef {Object} ClientPreference
 * @property {string[]} options that are valid for this client preference
 * @property {string} preferenceKey for registered users.
 * @property {string} betaMessage whether to show a notice indicating this feature is in beta.
 * @property {string} [type] defaults to radio. Supported: radio, switch
 * @property {Function} [callback] callback executed after a client preference has been modified.
 */

/**
 * @typedef {Object} UserPreferencesApi
 * @property {Function} saveOptions
 */
/**
 * @typedef {Object} PreferenceOption
 * @property {string} label
 * @property {string} value
 */
// Put this near the top (or where your existing cfg lives)
var cfg = {
  'continuum-theme': {
    options: [ 'imperial-night', 'ubla-day', 'ubla-night', 'verdant' ],
    preferenceKey: 'continuum-theme',
    type: 'radio'
  },
  'continuum-feature-limited-width': {
    options: [ '0', '1' ],
    preferenceKey: 'continuum-limited-width',
    type: 'switch'
  },
  'continuum-feature-custom-font-size': {
    options: [ '0', '1', '2' ],
    preferenceKey: 'continuum-font-size',
    type: 'radio'
  }
};

/**
 * Get the list of client preferences that are active on the page, including hidden.
 *
 * @return {string[]} of active client preferences
 */
function getClientPreferences() {
	return Array.from( document.documentElement.classList ).filter(
		( className ) => className.match( /-clientpref-/ )
	).map( ( className ) => className.split( '-clientpref-' )[ 0 ] );
}

/**
 * Check if the feature is excluded from the current page.
 *
 * @param {string} featureName
 * @return {boolean}
 */
function isFeatureExcluded( featureName ) {
	return document.documentElement.classList.contains( featureName + '-clientpref--excluded' );
}
function getActivePrefValueFromClass(feature) {
  const prefix = feature + '-clientpref-';
  for (const c of document.documentElement.classList) {
    if (c.indexOf(prefix) === 0) return c.slice(prefix.length);
  }
  return null;
}

function safeMsgText(key, fallback) {
  const m = mw.message(key);
  return m.exists() ? m.text() : fallback;
}

/**
 * Get the list of client preferences that are active on the page and not hidden.
 *
 * @param {Record<string,ClientPreference>} config
 * @return {string[]} of user facing client preferences
 */
function getVisibleClientPreferences( config ) {
  const active = getClientPreferences();
  const keys = Object.keys( config );
  if ( active.length === 0 ) {
    return keys; // <- render even if the -clientpref- class isn’t present yet
  }
  return keys.filter( key => active.indexOf( key ) > -1 );
}


/**
 * @param {string} featureName
 * @param {string} value
 * @param {Record<string,ClientPreference>} config
 * @param {UserPreferencesApi} [userPreferences]
 */
function toggleDocClassAndSave( featureName, value, config, userPreferences ) {
	const pref = config[ featureName ];
	const callback = pref.callback || ( () => {} );

	if ( mw.user.isNamed && mw.user.isNamed() ) {
		// Logged-in: update <html> classes for this feature
		config[ featureName ].options.forEach( ( possibleValue ) => {
			document.documentElement.classList.remove( `${ featureName }-clientpref-${ possibleValue }` );
		} );
		document.documentElement.classList.add( `${ featureName }-clientpref-${ value }` );

		window.dispatchEvent( new Event( 'resize' ) );

		mw.util.debounce( () => {
			userPreferences = userPreferences || new mw.Api();
			userPreferences.saveOptions( { [ pref.preferenceKey ]: value } ).then( () => {
				callback();
			} );
		}, 100 )();
	} else {
		// Anon: let clientPrefs handle storage, then reflect immediately in <html>
		mw.user.clientPrefs.set( featureName, value );
		config[ featureName ].options.forEach( ( possibleValue ) => {
			document.documentElement.classList.remove( `${ featureName }-clientpref-${ possibleValue }` );
		} );
		document.documentElement.classList.add( `${ featureName }-clientpref-${ value }` );
		callback();
	}

	// === Special case: theme should flip the <body> class instantly for everyone ===
	if ( featureName === 'continuum-theme' ) {
		// Remove any existing theme-* classes safely
		var toRemove = [];
		document.body.classList.forEach( ( c ) => { if ( c.indexOf( 'theme-' ) === 0 ) toRemove.push( c ); } );
		toRemove.forEach( ( c ) => document.body.classList.remove( c ) );
		document.body.classList.add( 'theme-' + value );

		// For anons, also persist so the server hook can read it on next request
		try {
			if ( !( mw.user.isNamed && mw.user.isNamed() ) ) {
				mw.storage.set( 'continuum-theme', value );
				mw.cookie.set( 'continuum-theme', value, 365 );
			}
		} catch ( e ) {}
	}
}


/**
 * @param {string} featureName
 * @param {string} value
 * @return {string}
 */
const getInputId = ( featureName, value ) => `skin-client-pref-${ featureName }-value-${ value }`;

/**
 * @param {string} type
 * @param {string} featureName
 * @param {string} value
 * @return {HTMLInputElement}
 */
function makeInputElement( type, featureName, value ) {
	const input = document.createElement( 'input' );
	const name = `skin-client-pref-${ featureName }-group`;
	const id = getInputId( featureName, value );
	input.name = name;
	input.id = id;
	input.type = type;
	if ( type === 'checkbox' ) {
		input.checked = value === '1';
	} else {
		input.value = value;
	}
	input.setAttribute( 'data-event-name', id );
	return input;
}
function safeMsgText(key, fallback) {
  var m = mw.message(key);
  return m.exists() ? m.text() : fallback;
}
/**
 * @param {string} featureName
 * @param {string} value
 * @return {HTMLLabelElement}
 */

function makeLabelElement(featureName, value) {
  const label = document.createElement('label');
  label.classList.add('ct-labelwrap');
  label.setAttribute('for', getInputId(featureName, value));

  const text = (mw.message(`${featureName}-${value}-label`).exists())
    ? mw.msg(`${featureName}-${value}-label`)
    : value;

  if (featureName === 'continuum-theme') {
    const swatch = document.createElement('span');
    swatch.className = 'ct-swatch -duo';
    const SW = {
      'imperial-night': ['#001F3F', '#FF851B'],
      'ubla-day':       ['#7bd3cf', '#3167ff'],
      'ubla-night':     ['#0b1930', '#8cf6ff'],
      'verdant':        ['#0c2a1b', '#5ee37a']
    };
    const [c1, c2] = SW[value] || ['#222', '#888'];
    const i1 = document.createElement('i'); i1.style.background = c1;
    const i2 = document.createElement('i'); i2.style.background = c2;
    swatch.append(i1, i2);
    label.appendChild(swatch);
  }

  const span = document.createElement('span');
  span.className = 'ct-label';
  span.textContent = text;
  label.appendChild(span);
  return label;
}





/**
 * Create an element that informs users that a feature is not functional
 * on a given page. This message is hidden by default and made visible in
 * CSS if a specific exclusion class exists.
 *
 * @param {string} featureName
 * @return {HTMLElement}
 */
function makeExclusionNotice( featureName ) {
	const p = document.createElement( 'p' );
	// eslint-disable-next-line mediawiki/msg-doc
	const noticeMessage = mw.message( `${ featureName }-exclusion-notice` );
	p.classList.add( 'exclusion-notice', `${ featureName }-exclusion-notice` );
	p.textContent = noticeMessage.text();
	return p;
}

/**
 * @return {HTMLElement}
 */
function makeBetaInfoTag() {
	const infoTag = document.createElement( 'span' );
	// custom style to avoid moving heading bottom border.
	const infoTagText = document.createElement( 'span' );
	infoTagText.textContent = mw.message( 'continuum-night-mode-beta-tag' ).text();
	infoTag.appendChild( infoTagText );
	return infoTag;
}

/**
 * @param {Element} parent
 * @param {string} featureName
 * @param {string} value
 * @param {string} currentValue
 * @param {Record<string,ClientPreference>} config
 * @param {UserPreferencesApi} userPreferences
 */
function appendRadioToggle( parent, featureName, value, currentValue, config, userPreferences ) {
	const input = makeInputElement( 'radio', featureName, value );
	input.classList.add( 'cdx-radio__input' );
	if ( currentValue === value ) {
		input.checked = true;
	}

	if ( isFeatureExcluded( featureName ) ) {
		input.disabled = true;
	}

	const icon = document.createElement( 'span' );
	icon.classList.add( 'cdx-radio__icon' );
	const label = makeLabelElement( featureName, value );
	label.classList.add( 'cdx-radio__label' );
	const container = document.createElement( 'div' );
	container.classList.add( 'cdx-radio' );
	container.appendChild( input );
	container.appendChild( icon );
	container.appendChild( label );
	parent.appendChild( container );
	input.addEventListener( 'change', () => {
		toggleDocClassAndSave( featureName, value, config, userPreferences );
	} );
}

/**
 * @param {HTMLElement} betaMessageElement
 */
function makeFeedbackLink( betaMessageElement ) {
	const pageWikiLink = `[https://${ window.location.hostname + mw.util.getUrl( mw.config.get( 'wgPageName' ) ) } ${ mw.config.get( 'wgTitle' ) }]`;
	const preloadTitle = mw.message( 'continuum-night-mode-issue-reporting-preload-title', pageWikiLink ).text();
	const link = mw.msg( 'continuum-night-mode-issue-reporting-notice-url', window.location.host, preloadTitle );
	const linkLabel = mw.message( 'continuum-night-mode-issue-reporting-link-label' ).text();
	const anchor = document.createElement( 'a' );
	anchor.setAttribute( 'href', link );
	anchor.setAttribute( 'target', '_blank' );
	anchor.setAttribute( 'title', mw.msg( 'continuum-night-mode-issue-reporting-notice-tooltip' ) );
	anchor.textContent = linkLabel;

	/**
	 * Shows the success message after clicking the beta feedback link.
	 * Note: event.stopPropagation(); is required to show the success message
	 * without closing the Appearance menu when it's in a dropdown.
	 *
	 * @param {Event} event
	 */
	const showSuccessFeedback = function ( event ) {
		event.stopPropagation();
		const icon = document.createElement( 'span' );
		icon.classList.add( 'continuum-icon', 'continuum-icon--heart' );
		anchor.textContent = mw.msg( 'continuum-night-mode-issue-reporting-link-notification' );
		anchor.classList.add( 'skin-theme-beta-notice-success' );
		anchor.prepend( icon );
		anchor.removeEventListener( 'click', showSuccessFeedback );
	};
	anchor.addEventListener( 'click', ( event ) => showSuccessFeedback( event ) );
	betaMessageElement.appendChild( anchor );
}

/**
 * @param {Element} form
 * @param {string} featureName
 * @param {HTMLElement} labelElement
 * @param {string} currentValue
 * @param {Record<string,ClientPreference>} config
 * @param {UserPreferencesApi} userPreferences
 */
function appendToggleSwitch(
	form, featureName, labelElement, currentValue, config, userPreferences
) {
	const input = makeInputElement( 'checkbox', featureName, currentValue );
	input.classList.add( 'cdx-toggle-switch__input' );
	const switcher = document.createElement( 'span' );
	switcher.classList.add( 'cdx-toggle-switch__switch' );
	const grip = document.createElement( 'span' );
	grip.classList.add( 'cdx-toggle-switch__switch__grip' );
	switcher.appendChild( grip );
	const label = labelElement || makeLabelElement( featureName, currentValue );
	label.classList.add( 'cdx-toggle-switch__label' );
	const toggleSwitch = document.createElement( 'span' );
	toggleSwitch.classList.add( 'cdx-toggle-switch' );
	toggleSwitch.appendChild( input );
	toggleSwitch.appendChild( switcher );
	toggleSwitch.appendChild( label );
	input.addEventListener( 'change', () => {
		toggleDocClassAndSave( featureName, input.checked ? '1' : '0', config, userPreferences );
	} );
	form.appendChild( toggleSwitch );
}

/**
 * @param {string} className
 * @return {Element}
 */
function createRow( className ) {
	const row = document.createElement( 'div' );
	row.setAttribute( 'class', className );
	return row;
}

/**
 * Get the label for the feature.
 *
 * @param {string} featureName
 * @return {MwMessage}
 */
// eslint-disable-next-line mediawiki/msg-doc
const getFeatureLabelMsg = ( featureName ) => mw.message( `${ featureName }-name` );

/**
 * adds a toggle button
 *
 * @param {string} featureName
 * @param {Record<string,ClientPreference>} config
 * @param {UserPreferencesApi} userPreferences
 * @return {Element|null}
 */
function makeControl( featureName, config, userPreferences ) {
  const pref = config[ featureName ];
  const isExcluded = isFeatureExcluded( featureName );
  if ( !pref ) return null;

  // Get current value safely
  let currentValue = mw.user.clientPrefs.get( featureName );
  if ( typeof currentValue === 'boolean' ) {
    // Derive from the <html> class or default to the first option
    currentValue = getActivePrefValueFromClass( featureName ) ||
      (pref.options && pref.options[0]) || 'imperial-night';
  }

  const row = createRow( '' );
  const form = document.createElement( 'form' );
  const type = pref.type || 'radio';
  switch ( type ) {
    case 'radio':
      pref.options.forEach( ( value ) => {
        appendRadioToggle( form, featureName, value, String( currentValue ), config, userPreferences );
      } );
      break;
    case 'switch': {
      const labelElement = document.createElement( 'label' );
      labelElement.textContent = safeMsgText( `${ featureName }-name`, featureName );
      appendToggleSwitch( form, featureName, labelElement, String( currentValue ), config, userPreferences );
      break;
    }
    default:
      throw new Error( 'Unknown client preference! Only switch or radio are supported.' );
  }
  row.appendChild( form );

  if ( isExcluded ) {
    const exclusionNotice = makeExclusionNotice( featureName );
    row.appendChild( exclusionNotice );
  }
  return row;
}


/**
 * @param {Element} parent
 * @param {string} featureName
 * @param {Record<string,ClientPreference>} config
 * @param {UserPreferencesApi} userPreferences
 */
function makeClientPreference(parent, featureName, config, userPreferences) {
  const labelMsg = getFeatureLabelMsg(featureName);
  const headingText = labelMsg.exists() ? labelMsg.text() : featureName;

  // One block per pref
  const block = document.createElement('div');
  block.id = `skin-client-prefs-${featureName}`;
  block.className = 'continuum-preference-block';

  // Subheading
  const h = document.createElement('div');
  h.className = 'continuum-menu-subheading';
  h.textContent = headingText;

  // The controls (radios/switch)
  const row = makeControl(featureName, config, userPreferences);
  if (!row) return; // nothing to add

  block.appendChild(h);
  block.appendChild(row);
  parent.appendChild(block);
}



/**
 * Fills the client side preference dropdown with controls.
 *
 * @param {string} selector of element to fill with client preferences
 * @param {Record<string,ClientPreference>} config
 * @param {UserPreferencesApi} [userPreferences]
 * @return {Promise<Node>}
 */
function render( selector, config, userPreferences ) {
	const node = document.querySelector( selector );
	if ( !node ) {
		return Promise.reject();
	}
	return new Promise( ( resolve ) => {
		getVisibleClientPreferences( config ).forEach( ( pref ) => {
			userPreferences = userPreferences || new mw.Api();
			makeClientPreference( node, pref, config, userPreferences );
		} );
		mw.requestIdleCallback( () => {
			resolve( node );
		} );
	} );
}

/**
 * @param {string} clickSelector what to click
 * @param {string} renderSelector where to render
 * @param {Record<string,ClientPreference>} config
 * @param {UserPreferencesApi} [userPreferences]
 */
function bind( clickSelector, renderSelector, config, userPreferences ) {
	let enhanced = false;
	const chk = /** @type {HTMLInputElement} */ (
		document.querySelector( clickSelector )
	);
	if ( !chk ) {
		return;
	}
	if ( !userPreferences ) {
		userPreferences = new mw.Api();
	}
	if ( chk.checked ) {
		render( renderSelector, config, userPreferences );
		enhanced = true;
	} else {
		chk.addEventListener( 'input', () => {
			if ( enhanced ) {
				return;
			}
			render( renderSelector, config, userPreferences );
			enhanced = true;
		} );
	}
}
(function () {
  var feature = 'continuum-theme';
  var v = (mw.user.options && mw.user.options.get && mw.user.options.get('continuum-theme'))
       || mw.user.clientPrefs.get(feature)
       || mw.storage.get('continuum-theme')
       || 'imperial-night';

  // remove any old continuum-theme-clientpref-* classes
  Array.from(document.documentElement.classList)
    .filter(c => c.indexOf(feature + '-clientpref-') === 0)
    .forEach(c => document.documentElement.classList.remove(c));

  document.documentElement.classList.add(feature + '-clientpref-' + v);
})();
function getConfig() {
  let base = {};
  try {
    base = mw.loader.require('skins.continuum.js/clientPreferences.json') || {};
  } catch (e) {}

  delete base['continuum-night-mode'];
  delete base['vector-night-mode'];
  delete base['skin-theme'];

  base['continuum-theme'] = {
    options: ['imperial-night','ubla-day','ubla-night','verdant'],
    preferenceKey: 'continuum-theme',
    type: 'radio'
  };
  return base;
}
(function primeFeatureClasses() {
  var pairs = [
    ['continuum-feature-limited-width', 'continuum-limited-width', '1'],
    ['continuum-feature-custom-font-size', 'continuum-font-size', '0'],
    ['continuum-feature-appearance-pinned', 'continuum-appearance-pinned', '1']
  ];
  var root = document.documentElement;
  pairs.forEach(function (p) {
    var feature = p[0], prefKey = p[1], defVal = p[2], val = null;
    try {
      if (mw.user.isNamed && mw.user.isNamed()) {
        val = (mw.user.options && mw.user.options.get) ? String(mw.user.options.get(prefKey)) : null;
      } else {
        val = mw.user.clientPrefs.get(feature);
      }
      if (val === null || val === '' || typeof val === 'boolean') val = defVal;

      Array.from(root.classList).forEach(function (c) {
        if (c.indexOf(feature + '-clientpref-') === 0) root.classList.remove(c);
      });
      root.classList.add(feature + '-clientpref-' + val);
    } catch (e) {}
  });
})();
/* === Continuum: minimal render to ensure THEME buttons appear === */
( function ( mw, $ ) {
  'use strict';

  function primeThemeClass() {
    var feature = 'continuum-theme';
    var root = document.documentElement;
    // Find current value
    var value = null;
    try {
      value = (mw.user.isNamed && mw.user.isNamed())
        ? (mw.user.options && mw.user.options.get ? mw.user.options.get('continuum-theme') : null)
        : (mw.user.clientPrefs.get(feature) || mw.storage.get('continuum-theme') || mw.cookie.get('continuum-theme'));
    } catch (e) {}
    if (!value) value = 'imperial-night';

    // Ensure <html> has e.g. "continuum-theme-clientpref-imperial-night"
    var has = Array.from(root.classList).some(function(c){ return c.indexOf(feature + '-clientpref-') === 0; });
    if (!has) root.classList.add(feature + '-clientpref-' + value);

    // Snap <body> theme class so the page paints correctly
    var toRemove = [];
    document.body.classList.forEach(function (c) { if (c.indexOf('theme-') === 0) toRemove.push(c); });
    toRemove.forEach(function (c) { document.body.classList.remove(c); });
    document.body.classList.add('theme-' + value);
  }

  function buildThemeRadiosFallback(panel, ui) {
    // Manual minimal radios (no fancy Codex required)
    var opts = ['imperial-night','ubla-day','ubla-night','verdant'];
    var form = document.createElement('form');
    form.style.display = 'grid'; form.style.gap = '6px';

    opts.forEach(function(v){
      var id = 'skin-client-pref-continuum-theme-value-' + v;
      var wrap = document.createElement('label'); wrap.htmlFor = id; wrap.style.display = 'flex'; wrap.style.alignItems = 'center'; wrap.style.gap = '8px';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'skin-client-pref-continuum-theme-group';
      input.id = id;
      input.value = v;

      var txt = document.createElement('span');
      txt.textContent = v;

      input.addEventListener('change', function () {
        // Use your exported helper so it also saves for logged-in users
        var cfg = { 'continuum-theme': { options: opts, preferenceKey: 'continuum-theme', type: 'radio' } };
        ui.toggleDocClassAndSave('continuum-theme', v, cfg, new mw.Api());
      });

      wrap.appendChild(input);
      wrap.appendChild(txt);
      form.appendChild(wrap);
    });

    panel.appendChild(form);
  }

  function mountThemeButtons() {
    primeThemeClass();

    var panel = document.querySelector('#continuum-appearance-panel');
    if (!panel) return;

    // Try the general renderer first (nice radios + your label builder)
    var ui = mw.loader.require('skins.continuum.clientPreferences');
    var cfg = {
      'continuum-theme': {
        options: ['imperial-night','ubla-day','ubla-night','verdant'],
        preferenceKey: 'continuum-theme',
        type: 'radio'
      }
    };

    // If already rendered, bail
    if (panel.querySelector('#skin-client-prefs-continuum-theme .cdx-radio, #skin-client-prefs-continuum-theme input[type="radio"]')) return;

    ui.render('#continuum-appearance-panel', cfg).then(function () {
      // If for some reason nothing appeared, build fallback
      if (!panel.querySelector('#skin-client-prefs-continuum-theme .cdx-radio, #skin-client-prefs-continuum-theme input[type="radio"]')) {
        buildThemeRadiosFallback(panel, ui);
      }
    }).catch(function () {
      buildThemeRadiosFallback(panel, ui);
    });
  }

  $(mountThemeButtons);
  mw.hook('wikipage.content').add(mountThemeButtons);
})(mediaWiki, jQuery);





module.exports = {
	bind,
	toggleDocClassAndSave,
	render
};
