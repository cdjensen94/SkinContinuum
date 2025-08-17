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
 * @since 1.35
 */

namespace MediaWiki\Skins\Continuum\Tests\Unit\Components;

use MediaWiki\Config\HashConfig;
use MediaWiki\Message\Message;
use MediaWiki\Skins\Continuum\Components\ContinuumComponentTableOfContents;
use MediaWiki\Skins\Continuum\FeatureManagement\FeatureManager;
use MessageLocalizer;

/**
 * @group Continuum
 * @group Components
 * @coversDefaultClass \MediaWiki\Skins\Continuum\Components\ContinuumComponentTableOfContents
 */
class ContinuumComponentTableOfContentsTest extends \MediaWikiUnitTestCase {

	public static function provideGetTocData() {
		$config = [
			'ContinuumTableOfContentsCollapseAtCount' => 1
		];
		$tocData = [
			'number-section-count' => 2,
			'array-sections' => [
				[
					'toclevel' => 1,
					'level' => '2',
					'line' => 'A',
					'number' => '1',
					'index' => '1',
					'fromtitle' => 'Test',
					'byteoffset' => 231,
					'anchor' => 'A',
					'linkAnchor' => 'A',
					'array-sections' =>	[],
					'is-top-level-section' => true,
					'is-parent-section' => false,
				],
				[
					'toclevel' => 1,
					'level' => '4',
					'line' => 'B',
					'number' => '2',
					'index' => '2',
					'fromtitle' => 'Test',
					'byteoffset' => 245,
					'anchor' => 'B',
					'linkAnchor' => 'B',
					'array-sections' =>	[],
					'is-top-level-section' => true,
					'is-parent-section' => false,
				]
			]
		];
		$nestedTocData = [
			'number-section-count' => 2,
			'array-sections' => [
				[
					'toclevel' => 1,
					'level' => '2',
					'line' => 'A',
					'number' => '1',
					'index' => '1',
					'fromtitle' => 'Test',
					'byteoffset' => 231,
					'anchor' => 'A',
					'linkAnchor' => 'A',
					'continuum-button-label' => 'continuum-toc-toggle-button-label',
					'array-sections' => [
						'toclevel' => 2,
						'level' => '4',
						'line' => 'A1',
						'number' => '1.1',
						'index' => '2',
						'fromtitle' => 'Test',
						'byteoffset' => 245,
						'anchor' => 'A1',
						'linkAnchor' => 'A1',
						'array-sections' => [],
						'is-top-level-section' => false,
						'is-parent-section' => false,
					],
					'is-top-level-section' => true,
					'is-parent-section' => true,
				],
			]
		];

		$expectedConfigData = [
			'continuum-is-collapse-sections-enabled' =>
				count( $tocData['array-sections'] ) > 3 &&
				$tocData[ 'number-section-count' ] >= $config[ 'ContinuumTableOfContentsCollapseAtCount' ],
			'id' => 'continuum-toc',
			'data-pinnable-header' => [
				'is-pinned' => true,
				'data-pinnable-element-id' => 'continuum-toc',
				'data-feature-name' => 'toc-pinned',
				'label' => 'continuum-toc-label',
				'unpin-label' => 'continuum-unpin-element-label',
				'pin-label' => 'continuum-pin-element-label',
				'label-tag-name' => 'h2'
			]
		];
		$expectedNestedTocData = array_merge( $nestedTocData, $expectedConfigData );

		return [
			// When zero sections
			[
				[],
				$config,
				// TOC data is empty when given an empty array
				[]
			],
			// When number of multiple sections is lower than configured value
			[
				$tocData,
				array_merge( $config, [ 'ContinuumTableOfContentsCollapseAtCount' => 3 ] ),
				// 'continuum-is-collapse-sections-enabled' value is false
				array_merge( $tocData, $expectedConfigData, [
					'continuum-is-collapse-sections-enabled' => false
				] )
			],
			// When number of multiple sections is equal to the configured value
			[
				$tocData,
				array_merge( $config, [ 'ContinuumTableOfContentsCollapseAtCount' => 2 ] ),
				// 'continuum-is-collapse-sections-enabled' value is true
				array_merge( $tocData, $expectedConfigData )
			],
			// When number of multiple sections is higher than configured value
			[
				$tocData,
				array_merge( $config, [ 'ContinuumTableOfContentsCollapseAtCount' => 1 ] ),
				// 'continuum-is-collapse-sections-enabled' value is true
				array_merge( $tocData, $expectedConfigData )
			],
			// When TOC has sections with top level parent sections
			[
				$nestedTocData,
				$config,
				// 'continuum-button-label' is provided for top level parent sections
				$expectedNestedTocData
			],
		];
	}

	/**
	 * @covers ::getTemplateData
	 * @dataProvider provideGetTOCData
	 */
	public function testGetTemplateData(
		array $tocData,
		array $config,
		array $expected
	) {
		$localizer = $this->createMock( MessageLocalizer::class );
		$localizer->method( 'msg' )->willReturnCallback( function ( $key, ...$params ) {
			$msg = $this->createMock( Message::class );
			$msg->method( '__toString' )->willReturn( $key );
			$msg->method( 'escaped' )->willReturn( $key );
			$msg->method( 'rawParams' )->willReturnSelf();
			$msg->method( 'text' )->willReturn( $key );
			return $msg;
		} );
		$featureManager = $this->createMock( FeatureManager::class );
		$featureManager->method( 'isFeatureEnabled' )->willReturn( true );

		$toc = new ContinuumComponentTableOfContents(
			$tocData,
			$localizer,
			new HashConfig( $config ),
			$featureManager
		);
		$this->assertEquals( $expected, $toc->getTemplateData() );
	}
}
