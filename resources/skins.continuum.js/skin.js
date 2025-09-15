const languageButton = require( './languageButton.js' ),
	pinnableElement = require( './pinnableElement.js' ),
	searchToggle = require( './searchToggle.js' ),
	echo = require( './echo.js' ),
	initExperiment = require( './AB.js' ),
	ABTestConfig = require( /** @type {string} */ ( './activeABTest.json' ) ),
	initSearchLoader = require( './searchLoader.js' ).initSearchLoader,
	portletsManager = require( './portlets.js' ),
	dropdownMenus = require( './dropdownMenus.js' ).dropdownMenus,
	tables = require( './tables.js' ).init,
	watchstar = require( './watchstar.js' ).init,
	setupIntersectionObservers = require( './setupIntersectionObservers.js' ),
	menuTabs = require( './menuTabs.js' ),
	userPreferences = require( './userPreferences.js' ),
	teleportTarget = /** @type {HTMLElement} */require( /** @type {string} */ ( 'mediawiki.page.ready' ) ).teleportTarget;

/**
 * Wait for first paint before calling this function. That's its whole purpose.
 *
 * Some CSS animations and transitions are "disabled" by default as a workaround to this old Chrome
 * bug, https://bugs.chromium.org/p/chromium/issues/detail?id=332189, which otherwise causes them to
 * render in their terminal state on page load. By adding the `continuum-animations-ready` class to the
 * `html` root element **after** first paint, the animation selectors suddenly match causing the
 * animations to become "enabled" when they will work properly. A similar pattern is used in Minerva
 * (see T234570#5779890, T246419).
 *
 * Example usage in Less:
 *
 * ```less
 * .foo {
 *     color: #f00;
 *     transform: translateX( -100% );
 * }
 *
 * // This transition will be disabled initially for JavaScript users. It will never be enabled for
 * // non-JavaScript users.
 * .continuum-animations-ready .foo {
 *     transition: transform 100ms ease-out;
 * }
 * ```
 *
 * @param {Document} document
 * @return {void}
 */
function enableCssAnimations( document ) {
	document.documentElement.classList.add( 'continuum-animations-ready' );
}

/**
 * @param {Window} window
 * @return {void}
 */
function main( window ) {
	enableCssAnimations( window.document );
	initSearchLoader( document );
	languageButton();
	echo();
	portletsManager.main();
	watchstar();
	// Initialize the search toggle for the main header only. The sticky header
	// toggle is initialized after Codex search loads.
	const searchToggleElement = document.querySelector( '.mw-header .search-toggle' );
	if ( searchToggleElement ) {
		searchToggle( searchToggleElement );
	}
	pinnableElement.initPinnableElement();
	// Initializes the TOC and sticky header, behaviour of which depend on scroll behaviour.
	setupIntersectionObservers.main();
	// Apply body styles to teleported elements
	teleportTarget.classList.add( 'continuum-body' );

	// Load client preferences
	const appearanceMenuSelector = '#continuum-appearance';
	const appearanceMenuExists = document.querySelectorAll( appearanceMenuSelector ).length > 0;
	if ( appearanceMenuExists ) {
		mw.loader.using( [
			'skins.continuum.clientPreferences',
			'skins.continuum.search.codex.styles',
			'skins.continuum.search.codex.scripts'
		] ).then( () => {
			const clientPreferences = require( /** @type {string} */ ( 'skins.continuum.clientPreferences' ) );
			const clientPreferenceConfig = ( require( './clientPreferences.json' ) );


			clientPreferences.render(
				appearanceMenuSelector, clientPreferenceConfig, userPreferences
			);
		} );
	}

	dropdownMenus();
	// menuTabs should follow `dropdownMenus` as that can move menu items from a
	// tab menu to a dropdown.
	menuTabs();
	tables();
}
// --- ClientPrefs init (append to resources/src/skin.js) ---
( function () {
    // Prevent double-init in case skin.js is executed twice
    if ( window.__continuumClientPrefsInit ) {
        return;
    }
    window.__continuumClientPrefsInit = true;

    // The RL module that exposes render(), bind(), etc.
    var helperModule = 'skins.continuum.clientPreferences';

    // Try to use the server-provided config (set by PHP into mw.config), else use inline
    var getConfig = function () {
        var serverConfig = mw.config.get( 'continuumClientPrefsConfig' );
        if ( serverConfig && typeof serverConfig === 'object' ) {
            return serverConfig;
        }
        // Inline fallback — keep this synchronized with your PHP ThemeManager
        return {
            'continuum-theme': {
                options: [ 'imperial-night', 'ubla-day', 'ubla-night', 'verdant', 'adams-chaos' ],
                preferenceKey: 'continuum-theme',
                betaMessage: false,
                type: 'radio'
            }
        };
    };

    // safely create anchor in Appearance panel if not present
    var ensureTarget = function () {
        var id = 'continuum-clientprefs-target';
        var el = document.getElementById( id );
        if ( el ) {
            return el;
        }

        // Try exact server-side container selectors used by Continuum
        var appearance = document.querySelector(
            '.continuum-appearance-panel, .continuum-appearance, #p-appearance, .skin-client-prefs'
        );

        el = document.createElement( 'div' );
        el.id = id;
        el.className = 'continuum-clientprefs-target';

        if ( appearance ) {
            // append near the end of the appearance panel; change to insertBefore if you need specific position
            appearance.appendChild( el );
        } else {
            // last resort — append to the right rail or body so it's visible during testing
            var rightRail = document.querySelector( '#mw-panel, .mw-sidebar, .vector-menu-content' );
            ( rightRail || document.body ).appendChild( el );
        }
        return el;
    };

    // Load the helper and render
    mw.loader.using( [ helperModule ] ).done( function () {
        try {
            var clientPrefs = mw.loader.require( helperModule );
            if ( !clientPrefs || typeof clientPrefs.render !== 'function' ) {
                return;
            }

            var config = getConfig();
            var target = ensureTarget();

            // render returns a Promise in your helper; ignore failures silently
            clientPrefs.render( '#' + target.id, config ).catch( function () {} );
        } catch ( e ) {
            // fail silently — nothing to do if module not present
        }
    } );
} )();
// --- end ClientPrefs init ---

/**
 * @param {Window} window
 * @return {void}
 */
function init( window ) {
	const now = mw.now();
	// This is the earliest time we can run JS for users (and bucket anonymous
	// users for A/B tests).
	// Where the browser supports it, for a 10% sample of users
	// we record a value to give us a sense of the expected delay in running A/B tests or
	// disabling JS features. This will inform us on various things including what to expect
	// with regards to delay while running A/B tests to anonymous users.
	// When EventLogging is not available this will reject.
	// This code can be removed by the end of the Desktop improvements project.
	// https://www.mediawiki.org/wiki/Desktop_improvements
	mw.loader.using( 'ext.eventLogging' ).then( () => {
		if (
			mw.eventLog &&
			mw.eventLog.eventInSample( 100 /* 1 in 100 */ ) &&
			window.performance &&
			window.performance.timing &&
			window.performance.timing.navigationStart
		) {
			mw.track( 'timing.Continuum.ready', now - window.performance.timing.navigationStart ); // milliseconds
		}
	} );
}

init( window );
if ( ABTestConfig.enabled && !mw.user.isAnon() ) {
	initExperiment( ABTestConfig, String( mw.user.getId() ) );
}
if ( document.readyState === 'interactive' || document.readyState === 'complete' ) {
	main( window );
} else {
	// This is needed when document.readyState === 'loading'.
	document.addEventListener( 'DOMContentLoaded', () => {
		main( window );
	} );
}

// Provider of skins.continuum.js module:
/**
 * skins.continuum.js
 *
 * @stable for use inside WikimediaEvents ONLY.
 */
module.exports = { pinnableElement };
