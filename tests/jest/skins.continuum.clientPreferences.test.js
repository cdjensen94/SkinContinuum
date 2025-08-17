const clientPreferences = require( '../../resources/skins.continuum.clientPreferences/clientPreferences.js' );

let cp;
describe( 'clientPreferences', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		cp = document.createElement( 'div' );
		cp.id = 'cp';
		document.body.appendChild( cp );
		mw.requestIdleCallback = ( callback ) => callback();
		mw.user.clientPrefs = {
			get: jest.fn( () => '1' )
		};
		const portlet = document.createElement( 'div' );
		portlet.innerHTML = `
			<div class="continuum-menu-heading">Width</div>
			<div class="continuum-menu-content">
				<ul class="continuum-menu-content-list"></ul>
			</div>
		`;
		mw.util.addPortlet = jest.fn( () => portlet );
		mw.util.addPortletLink = jest.fn( () => {
			const li = document.createElement( 'li' );
			const a = document.createElement( 'a' );
			li.appendChild( a );
			portlet.appendChild( li );
			return li;
		} );
		mw.message = jest.fn( ( key ) => ( {
			text: () => `msg:${ key }`,
			exists: () => true
		} ) );
	} );

	test( 'render empty', () => clientPreferences.render( '#cp', {} ).then( () => {
		expect( cp.innerHTML ).toMatchSnapshot();
	} ) );

	test( 'render font size', () => {
		document.documentElement.setAttribute( 'class', 'continuum-feature-custom-font-size-clientpref-2' );
		return clientPreferences.render( '#cp', {
			'continuum-feature-custom-font-size': {
				options: [ '0', '1', '2' ],
				preferenceKey: 'continuum-font-size'
			}
		} ).then( () => {
			expect( cp.innerHTML ).toMatchSnapshot();
		} );
	} );

	test( 'doesnt render exclusion notice if the msg key doesnt exist', () => {
		mw.message = jest.fn( ( key ) => ( {
			text: () => `msg:${ key }`,
			exists: () => key !== 'continuum-feature-limited-width-exclusion-notice'
		} ) );
		document.documentElement.setAttribute( 'class', 'continuum-feature-limited-width-clientpref-0' );
		return clientPreferences.render( '#cp', {
			'continuum-feature-limited-width': {
				options: [ '1', '0' ],
				preferenceKey: 'continuum-limited-width'
			}
		} ).then( () => {
			expect( cp.innerHTML ).toMatchSnapshot();
		} );
	} );

	test( 'render toggle', () => {
		document.documentElement.setAttribute( 'class', 'expandAll-clientpref-1' );
		return clientPreferences.render( '#cp', {
			expandAll: {
				options: [ '0', '1' ],
				preferenceKey: 'expandAll',
				type: 'switch'
			}
		} ).then( () => {
			expect( cp.innerHTML ).toMatchSnapshot();
		} );
	} );
} );
