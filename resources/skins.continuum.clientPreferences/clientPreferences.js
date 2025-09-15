/* global mw, module, document, window */

/**
 * Continuum client preferences UI helper
 * Refactored: idempotent, safer, swatch labels, immediate body/theme update.
 */
(function () {
	'use strict';

	// --- Helpers ---------------------------------------------------------

	const SWATCHES = {
		'imperial-night': ['#001F3F', '#FF851B'],
		'ubla-day': ['#7bd3cf', '#3167ff'],
		'ubla-night': ['#0b1930', '#8cf6ff'],
		'verdant': ['#0c2a1b', '#5ee37a'],
		'adams-chaos': ['#3f1f1f', '#6b0f0f']
	};

	function safeMsgText( key, fallback ) {
		const m = mw.message( key );
		return m.exists() ? m.text() : fallback;
	}

	function getActivePrefValueFromClass( feature ) {
		const prefix = feature + '-clientpref-';
		for ( const c of document.documentElement.classList ) {
			if ( c.indexOf( prefix ) === 0 ) {
				return c.slice( prefix.length );
			}
		}
		return null;
	}

	function getClientPreferences() {
		return Array.from( document.documentElement.classList )
			.filter( ( name ) => name.match( /-clientpref-/ ) )
			.map( ( name ) => name.split( '-clientpref-' )[ 0 ] );
	}

	function isFeatureExcluded( featureName ) {
		return document.documentElement.classList.contains( featureName + '-clientpref--excluded' );
	}

	function createSwatchForValue( value ) {
		const colors = SWATCHES[value] || ['#222', '#888'];
		const sw = document.createElement( 'span' );
		sw.className = 'ct-swatch -duo';
		// Inline styles kept minimal so skin CSS can override
		sw.style.display = 'inline-flex';
		sw.style.width = '22px';
		sw.style.height = '14px';
		sw.style.overflow = 'hidden';
		sw.style.borderRadius = '4px';
		sw.style.marginRight = '8px';

		const i1 = document.createElement( 'i' );
		i1.style.flex = '1';
		i1.style.display = 'block';
		i1.style.background = colors[0];

		const i2 = document.createElement( 'i' );
		i2.style.flex = '1';
		i2.style.display = 'block';
		i2.style.background = colors[1] || colors[0];

		sw.appendChild( i1 );
		sw.appendChild( i2 );
		return sw;
	}

	// --- DOM / persistence ------------------------------------------------

	function getInputId( featureName, value ) {
		return `skin-client-pref-${ featureName }-value-${ value }`;
	}

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

	function makeLabelElement( featureName, value ) {
		const label = document.createElement( 'label' );
		label.className = 'ct-labelwrap';
		const key = `${ featureName }-${ value }-label`;
		const text = safeMsgText( key, value );
		// swatch (visual)
		const sw = createSwatchForValue( value );
		const span = document.createElement( 'span' );
		span.className = 'ct-label';
		span.textContent = text;
		label.appendChild( sw );
		label.appendChild( span );
		label.setAttribute( 'for', getInputId( featureName, value ) );
		return label;
	}

	function makeExclusionNotice( featureName ) {
		const p = document.createElement( 'p' );
		const noticeMessage = mw.message( `${ featureName }-exclusion-notice` );
		p.classList.add( 'exclusion-notice', `${ featureName }-exclusion-notice` );
		p.textContent = noticeMessage.text();
		return p;
	}

	// --- Core: optimistic DOM update + persistence -----------------------

	function toggleDocClassAndSave( featureName, value, config, userPreferences ) {
		const pref = config && config[ featureName ];
		const callback = ( pref && pref.callback ) || ( () => {} );

		// Target both html and body so CSS rules that vary by selector still pick up change
		const html = document.documentElement;
		const body = document.body;
		const targets = [ html, body ];

		// Build options to clear
		const options = pref && Array.isArray( pref.options ) ? Array.from( new Set( pref.options ) ) : [ value ];

		// Remove previous classes
		options.forEach( ( opt ) => {
			targets.forEach( ( el ) => {
				el.classList.remove( `${ featureName }-clientpref-${ opt }` );
				el.classList.remove( `${ featureName }-${ opt }` );
			} );
		} );

		// Add canonical classes
		targets.forEach( ( el ) => {
			el.classList.add( `${ featureName }-clientpref-${ value }` );
			el.classList.add( `${ featureName }-${ value }` );
		} );

		// Special immediate body theme swap for visual immediacy
		if ( featureName === 'continuum-theme' ) {
			// remove existing theme-* on body, then add
			const toRemove = [];
			body.classList.forEach( ( c ) => { if ( c.indexOf( 'theme-' ) === 0 ) toRemove.push( c ); } );
			toRemove.forEach( ( c ) => body.classList.remove( c ) );
			body.classList.add( 'theme-' + value );
		}

		// Emit event and resize for layout scripts
		const payload = { feature: featureName, value };
		try {
			window.dispatchEvent( new CustomEvent( 'continuum:theme-changed', { detail: payload, bubbles: true } ) );
		} catch ( e ) {
			const ev = document.createEvent( 'CustomEvent' );
			ev.initCustomEvent( 'continuum:theme-changed', true, true, payload );
			window.dispatchEvent( ev );
		}
		window.dispatchEvent( new Event( 'resize' ) );

		// Persist
		if ( mw.user.isNamed && mw.user.isNamed() ) {
			mw.util.debounce( () => {
				userPreferences = userPreferences || new mw.Api();
				if ( pref && pref.preferenceKey ) {
					userPreferences.saveOptions( { [ pref.preferenceKey ]: value } )
						.then( () => callback() )
						.catch( ( err ) => { console.error( 'Failed to save pref', err ); callback(); } );
				} else {
					try {
						if ( mw.user && mw.user.clientPrefs && typeof mw.user.clientPrefs.set === 'function' ) {
							mw.user.clientPrefs.set( featureName, value );
						}
					} catch ( e ) {}
					callback();
				}
			}, 100 )();
		} else {
			try {
				if ( mw.user && mw.user.clientPrefs && typeof mw.user.clientPrefs.set === 'function' ) {
					mw.user.clientPrefs.set( featureName, value );
				} else {
					// fallback cookie
					document.cookie = `continuum-${ encodeURIComponent( featureName ) }=${ encodeURIComponent( value ) }; path=/`;
				}
			} catch ( e ) {
				console.error( 'Failed to persist anonymous pref', e );
			}
			callback();
		}
	}

	// --- Controls rendering ----------------------------------------------

	function appendRadioToggle( parent, featureName, value, currentValue, config, userPreferences ) {
		const input = makeInputElement( 'radio', featureName, value );
		input.classList.add( 'cdx-radio__input' );
		if ( currentValue === value ) input.checked = true;

		if ( isFeatureExcluded( featureName ) ) input.disabled = true;

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

	function appendToggleSwitch( form, featureName, labelElement, currentValue, config, userPreferences ) {
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

	function createRow( className ) {
		const row = document.createElement( 'div' );
		row.setAttribute( 'class', className );
		return row;
	}

	const getFeatureLabelMsg = ( featureName ) => mw.message( `${ featureName }-name` );

	function makeControl( featureName, config, userPreferences ) {
		const pref = config[ featureName ];
		if ( !pref ) return null;
		const isExcluded = isFeatureExcluded( featureName );

		let currentValue = undefined;
		// Prefer server-stored option for logged-in users
		try {
			if ( mw.user && mw.user.options && typeof mw.user.options.get === 'function' ) {
				currentValue = mw.user.options.get( featureName );
			}
		} catch ( e ) {}

		// fallback to clientPrefs
		if ( currentValue === undefined || currentValue === null ) {
			try {
				currentValue = mw.user.clientPrefs.get( featureName );
			} catch ( e ) {
				currentValue = undefined;
			}
		}

		// If still boolean or missing, derive from html class, or default to first option
		if ( typeof currentValue === 'boolean' || !currentValue ) {
			currentValue = getActivePrefValueFromClass( featureName ) || ( pref.options && pref.options[0] ) || null;
		}

		const row = createRow( '' );
		const form = document.createElement( 'form' );
		const type = pref.type || 'radio';
		switch ( type ) {
			case 'radio':
				( pref.options || [] ).forEach( ( value ) => {
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
				throw new Error( 'Unknown client preference type' );
		}
		row.appendChild( form );

		if ( isExcluded ) {
			row.appendChild( makeExclusionNotice( featureName ) );
		}
		return row;
	}

	function makeClientPreference( parent, featureName, config, userPreferences ) {
		const id = `skin-client-prefs-${ featureName }`;
		// avoid duplicate portlets
		if ( document.getElementById( id ) ) return;

		const labelMsg = getFeatureLabelMsg( featureName );
		const labelText = labelMsg.exists() ? labelMsg.text() : safeMsgText( `${ featureName }-name`, featureName );

		// mw.util.addPortlet returns the created node (or existing) - rely on it
		// @ts-ignore
		const portlet = mw.util.addPortlet( id, labelText );
		const descriptionMsg = mw.message( `${ featureName }-description` );
		const labelElement = portlet.querySelector( 'label' );
		if ( descriptionMsg.exists() ) {
			const desc = document.createElement( 'span' );
			desc.classList.add( 'skin-client-pref-description' );
			desc.textContent = descriptionMsg.text();
			if ( labelElement && labelElement.parentNode ) labelElement.appendChild( desc );
		}

		parent.appendChild( portlet );
		const row = makeControl( featureName, config, userPreferences );
		if ( row ) {
			const tmp = mw.util.addPortletLink( id, '', '' );
			if ( tmp ) {
				const link = tmp.querySelector( 'a' );
				if ( link ) link.replaceWith( row );
			}
		}
	}

	// --- Public render/bind API ------------------------------------------

	function getVisibleClientPreferences( config ) {
		const active = new Set( getClientPreferences() );
		return Object.keys( config ).filter( ( key ) => active.has( key ) );
	}

	function render( selector, config, userPreferences ) {
		const node = document.querySelector( selector );
		if ( !node ) return Promise.reject();
		return new Promise( ( resolve ) => {
			getVisibleClientPreferences( config ).forEach( ( pref ) => {
				userPreferences = userPreferences || new mw.Api();
				makeClientPreference( node, pref, config, userPreferences );
			} );
			mw.requestIdleCallback( () => resolve( node ) );
		} );
	}

	function bind( clickSelector, renderSelector, config, userPreferences ) {
		let enhanced = false;
		const chk = document.querySelector( clickSelector );
		if ( !chk ) return;
		userPreferences = userPreferences || new mw.Api();
		if ( chk.checked ) {
			render( renderSelector, config, userPreferences );
			enhanced = true;
			return;
		}
		chk.addEventListener( 'input', () => {
			if ( enhanced ) return;
			render( renderSelector, config, userPreferences );
			enhanced = true;
		} );
	}

	// Expose public API
	module.exports = {
		bind,
		render,
		toggleDocClassAndSave
	};
}());
