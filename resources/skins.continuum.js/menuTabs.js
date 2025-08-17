const
	TABS_SELECTOR = '.continuum-menu-tabs',
	LIST_ITEM_JS_SELECTOR = '.mw-list-item-js',
	NO_ICON_CLASS = 'continuum-tab-noicon';

/**
 * T320691: Add a `.continuum-tab-noicon` class to any tabbed menu item that is
 * added by a gadget so that the menu item has the correct padding and margin.
 *
 * @param {HTMLElement} item
 */
function addNoIconClass( item ) {
	item.classList.add( NO_ICON_CLASS );
}

function init() {
	// Enhance previously added items.
	Array.prototype.forEach.call(
		document.querySelectorAll( TABS_SELECTOR + ' ' + LIST_ITEM_JS_SELECTOR ),
		addNoIconClass
	);

	mw.hook( 'util.addPortletLink' ).add(
		/**
		 * @param {HTMLElement} item
		 */
		( item ) => {
			// Check if this menu item belongs to a tabs menu.
			if ( item.closest( TABS_SELECTOR ) ) {
				addNoIconClass( item );
			}
		} );
}

module.exports = init;
