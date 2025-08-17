/**
 * Disabling this rule as it's only necessary for
 * combining multiple class names and documenting the output.
 * That doesn't happen in this file but the linter still throws an error.
 * https://github.com/wikimedia/eslint-plugin-mediawiki/blob/master/docs/rules/class-doc.md
 */

/** @interface ContinuumResourceLoaderVirtualConfig */
/** @interface MediaWikiPageReadyModule */

const /** @type {ContinuumResourceLoaderVirtualConfig} */
	config = require( /** @type {string} */ ( './config.json' ) ),
	// T251544: Collect search performance metrics to compare Vue search with
	// mediawiki.searchSuggest performance.
	CAN_TEST_SEARCH = !!(
		window.performance &&
		!!performance.mark &&
		!!performance.measure &&
		performance.getEntriesByName ),
	LOAD_START_MARK = 'mwContinuumVueSearchLoadStart',
	LOAD_END_MARK = 'mwContinuumVueSearchLoadEnd',
	LOAD_MEASURE = 'mwContinuumVueSearchLoadStartToLoadEnd';

/**
 * Loads the search module via `mw.loader.using` on the element's
 * focus event. Or, if the element is already focused, loads the
 * search module immediately.
 * After the search module is loaded, executes a function to remove
 * the loading indicator.
 *
 * @param {Element} element search input.
 * @param {string} moduleName resourceLoader module to load.
 * @param {string|null} startMarker
 * @param {null|function(): void} afterLoadFn function to execute after search module loads.
 */
function loadSearchModule( element, moduleName, startMarker, afterLoadFn ) {
	const SHOULD_TEST_SEARCH = CAN_TEST_SEARCH &&
		moduleName === 'skins.continuum.search';

	function requestSearchModule() {
		if ( SHOULD_TEST_SEARCH && startMarker !== null && afterLoadFn !== null ) {
			performance.mark( startMarker );
			mw.loader.using( moduleName, afterLoadFn );
		} else {
			mw.loader.load( moduleName );
		}
		element.removeEventListener( 'focus', requestSearchModule );
	}

	if ( document.activeElement === element ) {
		requestSearchModule();
	} else {
		element.addEventListener( 'focus', requestSearchModule );
	}
}

/**
 * Marks when the lazy load has completed.
 *
 * @param {string} startMarker
 * @param {string} endMarker
 * @param {string} measureMarker
 */
function markLoadEnd( startMarker, endMarker, measureMarker ) {
	if ( performance.getEntriesByName( startMarker ).length ) {
		performance.mark( endMarker );
		performance.measure( measureMarker, startMarker, endMarker );
	}
}

/**
 * Initialize the loading of the search module as well as the loading indicator.
 * Only initialize the loading indicator when not using the core search module.
 *
 * @param {Document} document
 */
function initSearchLoader( document ) {
	const searchBoxes = document.querySelectorAll( '.continuum-search-box' );

	// Allow developers to defined $wgContinuumSearchApiUrl in LocalSettings to target different APIs
	if ( config.ContinuumSearchApiUrl ) {
		mw.config.set( 'wgContinuumSearchApiUrl', config.ContinuumSearchApiUrl );
	}

	if ( !searchBoxes.length ) {
		return;
	}

	/**
	 * If we are in a browser that doesn't support ES6 fall back to non-JS version.
	 */
	if ( mw.loader.getState( 'skins.continuum.search' ) === null ) {
		document.body.classList.remove(
			'skin-continuum-search-vue'
		);
		return;
	}

	Array.prototype.forEach.call( searchBoxes, ( searchBox ) => {
		const searchInner = searchBox.querySelector( 'form > div' ),
			searchInput = searchBox.querySelector( 'input[name="search"]' ),
			isPrimarySearch = searchInput && searchInput.getAttribute( 'id' ) === 'searchInput';

		if ( !searchInput || !searchInner ) {
			return;
		}
		// Remove tooltips while Vue search is still loading
		searchInput.setAttribute( 'autocomplete', 'off' );
		loadSearchModule(
			searchInput,
			'skins.continuum.search',
			isPrimarySearch ? LOAD_START_MARK : null,
			// Note, loading Vue.js will remove the element from the DOM.
			() => {
				if ( isPrimarySearch ) {
					markLoadEnd( LOAD_START_MARK, LOAD_END_MARK, LOAD_MEASURE );
				}
			}
		);
	} );
}

module.exports = {
	initSearchLoader: initSearchLoader
};
