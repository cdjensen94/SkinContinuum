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
	// Order should be based on key in config.json
	return Object.keys( config ).filter( ( key ) => active.indexOf( key ) > -1 );
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

/**
 * @param {string} featureName
 * @param {string} value
 * @return {HTMLLabelElement}
 */
function makeLabelElement( featureName, value ) {
  const label = document.createElement( 'label' );
  const key = `${ featureName }-${ value }-label`;
  label.textContent = safeMsgText( key, value ); // 👈 fallback to raw value
  label.setAttribute( 'for', getInputId( featureName, value ) );
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
function makeClientPreference( parent, featureName, config, userPreferences ) {
  const labelText = safeMsgText( `${featureName}-name`, 'Theme' );

  // Wrapper for this preference group
  const group = document.createElement( 'div' );
  group.id = `skin-client-prefs-${ featureName }`;
  group.className = 'ct-pref';

  // Heading
  const heading = document.createElement( 'div' );
  heading.className = 'ct-pref-heading';
  heading.textContent = labelText;
  group.appendChild( heading );

  // Controls
  const row = makeControl( featureName, config, userPreferences );
  if ( row ) {
    group.appendChild( row );
  }

  parent.appendChild( group );
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
function whenAvailable( selector, cb ) {
  const node = document.querySelector( selector );
  if ( node ) { cb( node ); return; }
  const mo = new MutationObserver( () => {
    const n = document.querySelector( selector );
    if ( n ) { mo.disconnect(); cb( n ); }
  } );
  mo.observe( document.body, { childList: true, subtree: true } );
}

(function (mw, $) {
  'use strict';
  var ui = { bind, render };
  var cfg = { 'continuum-theme': {
    options: ['imperial-night','ubla-day','ubla-night','verdant'],
    preferenceKey: 'continuum-theme',
    type: 'radio'
  } };

  function doRender() {
    ui.render('#p-appearance .continuum-menu-content', cfg).catch(function(){});
  }

  function mount() {
    whenAvailable('#p-appearance .continuum-menu-content', function () {
      // Avoid double-mounting
      if (!document.getElementById('skin-client-prefs-continuum-theme')) {
        doRender();
      }
    });
  }

  $( mount );
  mw.hook('wikipage.content').add( mount );
})(mediaWiki, jQuery);


module.exports = {
	bind,
	toggleDocClassAndSave,
	render
};
