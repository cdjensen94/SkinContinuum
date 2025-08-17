/* global QUnit */
const clientPreferences = require( 'skins.continuum.clientPreferences' );

/*!
 * Continuum integration tests.
 *
 * This should only be used to test APIs that Continuum depends on to work.
 * For unit tests please see tests/jest.
 */
QUnit.module( 'Continuum (integration)', () => {
	QUnit.test( 'Client preferences: Behaves same for all users', function ( assert ) {
		const sandbox = this.sandbox;
		const helper = ( feature, isNamedReturnValue ) => {
			document.documentElement.setAttribute( 'class', `${ feature }-clientpref-0` );
			const stub = sandbox.stub( mw.user, 'isNamed', () => isNamedReturnValue );
			clientPreferences.toggleDocClassAndSave( feature, '1', {
				'continuum-feature-limited-width': {
					options: [ '1', '0' ],
					preferenceKey: 'continuum-limited-width'
				}
			} );
			stub.restore();
			return document.documentElement.getAttribute( 'class' );
		};

		assert.strictEqual(
			helper( 'continuum-feature-limited-width', false ),
			helper( 'continuum-feature-limited-width', true ),
			'The same classes are modified regardless of the user status.'
		);
	} );
} );
