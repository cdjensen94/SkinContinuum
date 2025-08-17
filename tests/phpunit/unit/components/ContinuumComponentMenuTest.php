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

use MediaWiki\Skins\Continuum\Components\ContinuumComponent;
use MediaWiki\Skins\Continuum\Components\ContinuumComponentMenu;
use MediaWikiUnitTestCase;

/**
 * @group Continuum
 * @group Components
 * @coversDefaultClass \MediaWiki\Skins\Continuum\Components\ContinuumComponentMenu
 */
class ContinuumComponentMenuTest extends MediaWikiUnitTestCase {

	/**
	 * @return array[]
	 */
	public function provideMenuData(): array {
		return [
			[
				[
					'class' => 'some-class',
					'label' => 'Some label',
					'html-tooltip' => 'Some tooltip',
					'label-class' => 'some-label-class',
					'html-before-portal' => 'Some before portal',
					'html-items' => 'Some items',
					'html-after-portal' => 'Some after portal',
					'array-list-items' => [ 'some-item-one', 'some-item-2', 'some-item-3' ]
				]
			]
		];
	}

	/**
	 * @return array[]
	 */
	public function provideCountData(): array {
		return [
			[
				[
					'array-list-items' => [ 'some-item-one', 'some-item-2', 'some-item-3' ]
				],
				3
			],
			[
				[
					'html-items' => '<li>Some item</li><li>Some item</li><li>Some item</li>'
				],
				3
			]
		];
	}

	/**
	 * This test checks if the ContinuumComponentMenu class can be instantiated
	 * @covers ::__construct
	 */
	public function testConstruct() {
		// Create a new ContinuumComponentMenu object
		$menu = new ContinuumComponentMenu( [] );

		// Check if the object is an instance of ContinuumComponent
		$this->assertInstanceOf( ContinuumComponent::class, $menu );
	}

	/**
	 * This test checks if the count method returns the correct number of items
	 * @covers ::count
	 * @dataProvider provideCountData
	 */
	public function testCount( array $data, int $expected ) {
		// Create a new ContinuumComponentMenu object
		$menu = new ContinuumComponentMenu( $data );

		// Check if the count method returns the correct number of items
		$this->assertSame( $expected, $menu->count() );
	}

	/**
	 * This test checks if the getTemplateData method returns the correct data
	 * @covers ::getTemplateData
	 * @dataProvider provideMenuData
	 */
	public function testGetTemplateData( array $data ) {
		// Create a new ContinuumComponentMenu object
		$menu = new ContinuumComponentMenu( $data );

		// Call the getTemplateData method
		$actualData = $menu->getTemplateData();

		// Check if the getTemplateData method returns the correct data
		$this->assertSame( $data, $actualData );
	}
}
