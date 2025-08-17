const features = require( '../../../resources/skins.continuum.js/features.js' );

describe( 'features', () => {
	beforeEach( () => {
		document.documentElement.setAttribute( 'class', 'continuum-feature-foo-disabled continuum-feature-bar-enabled hello' );
	} );

	test( 'toggle', () => {
		features.toggle( 'foo' );
		features.toggle( 'bar' );

		expect(
			document.documentElement.classList.contains( 'continuum-feature-foo-enabled' )
		).toBe( true );
		expect(
			document.documentElement.classList.contains( 'continuum-feature-foo-disabled' )
		).toBe( false );
		expect(
			document.documentElement.classList.contains( 'continuum-feature-bar-disabled' )
		).toBe( true );
		expect(
			document.documentElement.classList.contains( 'continuum-feature-bar-enabled' )
		).toBe( false );
		expect(
			document.documentElement.classList.contains( 'hello' )
		).toBe( true );
	} );

	test( 'toggle unknown feature', () => {
		expect( () => {
			features.toggle( 'unknown' );
		} ).toThrow();
	} );
} );
