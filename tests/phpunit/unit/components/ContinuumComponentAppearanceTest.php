<?php
/**
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * http://www.gnu.org/copyleft/gpl.html
 *
 * @file
 * @since 1.42
 */

namespace MediaWiki\Skins\Continuum\Tests\Unit\Components;

use MediaWiki\Skins\Continuum\Components\ContinuumComponentAppearance;
use MediaWiki\Skins\Continuum\FeatureManagement\FeatureManager;
use MediaWikiUnitTestCase;
use MessageLocalizer;

/**
 * @group Continuum
 * @group Components
 * @coversDefaultClass \MediaWiki\Skins\Continuum\Components\ContinuumComponentAppearance
 */
class ContinuumComponentAppearanceTest extends MediaWikiUnitTestCase {

	/**
	 * @covers ::getTemplateData
	 */
	public function testGetTemplateDataPinned() {
		// Mock the MessageLocalizer and FeatureManager
		$localizer = $this->createMock( MessageLocalizer::class );
		$featureManager = $this->createMock( FeatureManager::class );
		// The isFeatureEnabled method is called and returns true
		$featureManager->method( 'isFeatureEnabled' )
			->willReturn( true );

		// Create a new ContinuumComponentAppearance object
		$appearanceMenu = new ContinuumComponentAppearance( $localizer, $featureManager );
		// Call the getTemplateData method
		$actualData = $appearanceMenu->getTemplateData();

		// The expected data
		$expectedData = [
			// The id is set to 'continuum-appearance'
			'id' => 'continuum-appearance',
			// The is-pinned value is true
			'is-pinned' => true,
			// The data-pinnable-header array
			'data-pinnable-header' => [
				// The is-pinned value is true
				'is-pinned' => true,
				// The label is null
				'label' => null,
				// The label-tag-name is set to 'div'
				'label-tag-name' => 'div',
				// The pin-label is null
				'pin-label' => null,
				// The unpin-label is null
				'unpin-label' => null,
				// The data-pinnable-element-id is set to 'continuum-appearance'
				'data-pinnable-element-id' => 'continuum-appearance',
				// The data-feature-name is set to 'appearance-pinned'
				'data-feature-name' => 'appearance-pinned',
				// The data-unpinned-container-id is set to 'continuum-appearance-unpinned-container'
				'data-unpinned-container-id' => 'continuum-appearance-unpinned-container',
				// The data-pinned-container-id is set to 'continuum-appearance-pinned-container'
				'data-pinned-container-id' => 'continuum-appearance-pinned-container',
			]
		];

		// Assert that the actual data matches the expected data
		$this->assertEquals( $expectedData, $actualData );
		// Assert that the is-pinned value is true
		$this->assertSame( true, $actualData['is-pinned'], 'Assertion for the pinned state failed.' );
	}

	/**
	 * @covers ::getTemplateData
	 */
	public function testGetTemplateDataUnpinned() {
		// Mock the MessageLocalizer and FeatureManager
		$localizer = $this->createMock( MessageLocalizer::class );
		$featureManager = $this->createMock( FeatureManager::class );
		// The isFeatureEnabled method is called and returns false
		$featureManager->method( 'isFeatureEnabled' )
			->willReturn( false );

		// Create a new ContinuumComponentAppearance object
		$clientPrefs = new ContinuumComponentAppearance( $localizer, $featureManager );
		// Call the getTemplateData method
		$actualData = $clientPrefs->getTemplateData();

		// The expected data
		$expectedData = [
			// The id is set to 'continuum-appearance'
			'id' => 'continuum-appearance',
			// The is-pinned value is false
			'is-pinned' => false,
			// The data-pinnable-header array
			'data-pinnable-header' => [
				// The is-pinned value is false
				'is-pinned' => false,
				// The label is null
				'label' => null,
				// The label-tag-name is set to 'div'
				'label-tag-name' => 'div',
				// The pin-label is null
				'pin-label' => null,
				// The unpin-label is null
				'unpin-label' => null,
				// The data-pinnable-element-id is set to 'continuum-appearance'
				'data-pinnable-element-id' => 'continuum-appearance',
				// The data-feature-name is set to 'appearance-pinned'
				'data-feature-name' => 'appearance-pinned',
				// The data-unpinned-container-id is set to 'continuum-appearance-unpinned-container'
				'data-unpinned-container-id' => 'continuum-appearance-unpinned-container',
				// The data-pinned-container-id is set to 'continuum-appearance-pinned-container'
				'data-pinned-container-id' => 'continuum-appearance-pinned-container',
			]
		];

		// Assert that the actual data matches the expected data
		$this->assertEquals( $expectedData, $actualData );
		// Assert that the is-pinned value is false
		$this->assertSame( false, $actualData['is-pinned'], 'Assertion for the pinned state failed.' );
	}
}
