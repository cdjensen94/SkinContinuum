<?php
/*
 * @file
 * @ingroup skins
 */

namespace MediaWiki\Skins\Continuum\Tests\Integration;

use MediaWiki\Config\HashConfig;
use MediaWiki\Context\RequestContext;
use MediaWiki\Request\FauxRequest;
use MediaWiki\ResourceLoader\Context;
use MediaWiki\Skins\Continuum\Constants;
use MediaWiki\Skins\Continuum\FeatureManagement\Requirements\LimitedWidthContentRequirement;
use MediaWiki\Skins\Continuum\Hooks;
use MediaWiki\Skins\Continuum\SkinContinuum22;
use MediaWiki\Skins\Continuum\SkinContinuumLegacy;
use MediaWiki\Title\Title;
use MediaWiki\User\Options\UserOptionsManager;
use MediaWiki\User\User;
use MediaWikiIntegrationTestCase;
use ReflectionMethod;
use RuntimeException;

/**
 * Integration tests for Continuum Hooks.
 *
 * @group Continuum
 * @coversDefaultClass \MediaWiki\Skins\Continuum\Hooks
 */
class ContinuumHooksTest extends MediaWikiIntegrationTestCase {

	/**
	 * @param bool $excludeMainPage
	 * @param array $excludeNamespaces
	 * @param array $include
	 * @param array $querystring
	 * @return array
	 */
	private static function makeMaxWidthConfig(
		$excludeMainPage,
		$excludeNamespaces = [],
		$include = [],
		$querystring = []
	) {
		return [
			'exclude' => [
				'mainpage' => $excludeMainPage,
				'namespaces' => $excludeNamespaces,
				'querystring' => $querystring,
			],
			'include' => $include
		];
	}

	public static function provideGetActiveABTest() {
		return [
			[
				[
					'ContinuumWebABTestEnrollment' => [],
				],
				[]
			],
			[
				[
					'ContinuumWebABTestEnrollment' => [
						'name' => 'continuum.sticky_header',
						'enabled' => true,
						'buckets' => [
								'unsampled' => [
										'samplingRate' => 1,
								],
								'control' => [
										'samplingRate' => 0
								],
								'stickyHeaderEnabled' => [
										'samplingRate' => 0
								],
								'stickyHeaderDisabled' => [
										'samplingRate' => 0
								],
						],
					],
				],
				[
					'name' => 'continuum.sticky_header',
					'enabled' => true,
					'buckets' => [
							'unsampled' => [
									'samplingRate' => 1,
							],
							'control' => [
									'samplingRate' => 0
							],
							'stickyHeaderEnabled' => [
									'samplingRate' => 0
							],
							'stickyHeaderDisabled' => [
									'samplingRate' => 0
							],
					],
				]
			],
		];
	}

	public static function provideGetActiveABTestWithExceptions() {
		return [
			# Bad experiment (no buckets)
			[
				[
					'ContinuumSearchApiUrl' => 'https://en.wikipedia.org/w/rest.php',
					'ContinuumWebABTestEnrollment' => [
						'name' => 'continuum.sticky_header',
						'enabled' => true,
					],
				]
			],
			# Bad experiment (no unsampled bucket)
			[
				[
					'ContinuumSearchApiUrl' => 'https://en.wikipedia.org/w/rest.php',
					'ContinuumWebABTestEnrollment' => [
						'name' => 'continuum.sticky_header',
						'enabled' => true,
						'buckets' => [
							'a' => [
								'samplingRate' => 0
							],
						]
					],
				]
			],
			# Bad experiment (wrong format)
			[
				[
					'ContinuumSearchApiUrl' => 'https://en.wikipedia.org/w/rest.php',
					'ContinuumWebABTestEnrollment' => [
						'name' => 'continuum.sticky_header',
						'enabled' => true,
						'buckets' => [
							'unsampled' => 1,
						]
					],
				]
			],
			# Bad experiment (samplingRate defined as string)
			[
				[
					'ContinuumSearchApiUrl' => 'https://en.wikipedia.org/w/rest.php',
					'ContinuumWebABTestEnrollment' => [
						'name' => 'continuum.sticky_header',
						'enabled' => true,
						'buckets' => [
							'unsampled' => [
								'samplingRate' => '1'
							],
						]
					],
				]
			],
		];
	}

	/**
	 * @covers ::shouldDisableMaxWidth
	 */
	public static function providerShouldDisableMaxWidth() {
		$excludeTalkFooConfig = self::makeMaxWidthConfig(
			false,
			[ NS_TALK ],
			[ 'Talk:Foo' ],
			[]
		);

		return [
			[
				'No options, nothing disables max width',
				[],
				Title::makeTitle( NS_MAIN, 'Foo' ),
				[],
				false
			],
			[
				'Main page disables max width if exclude.mainpage set',
				self::makeMaxWidthConfig( true ),
				Title::newMainPage(),
				[],
				true
			],
			[
				'Namespaces can be excluded',
				self::makeMaxWidthConfig( false, [ NS_CATEGORY ] ),
				Title::makeTitle( NS_CATEGORY, 'Category' ),
				[],
				true
			],
			[
				'Namespaces are included if not excluded',
				self::makeMaxWidthConfig( false, [ NS_CATEGORY ] ),
				Title::makeTitle( NS_SPECIAL, 'SpecialPages' ),
				[],
				false
			],
			[
				'More than one namespace can be included',
				self::makeMaxWidthConfig( false, [ NS_CATEGORY, NS_SPECIAL ] ),
				Title::makeTitle( NS_SPECIAL, 'Specialpages' ),
				[],
				true
			],
			[
				'Can be disabled on history page',
				self::makeMaxWidthConfig(
					false,
					[
						/* no namespaces excluded */
					],
					[
						/* no includes */
					],
					[ 'action' => 'history' ]
				),
				Title::makeTitle( NS_MAIN, 'History page' ),
				[ 'action' => 'history' ],
				true
			],
			[
				'Can be disabled with a regex match.',
				self::makeMaxWidthConfig(
					false,
					[
						/* no namespaces excluded */
					],
					[
						/* no includes */
					],
					[ 'foo' => '[0-9]+' ]
				),
				Title::makeTitle( NS_MAIN, 'Test' ),
				[ 'foo' => '1234' ],
				true
			],
			[
				'Can be disabled with a regex match, also for falsy 0.',
				self::makeMaxWidthConfig(
					false,
					[
						/* no namespaces excluded */
					],
					[
						/* no includes */
					],
					[ 'foo' => '[0-9]+' ]
				),
				Title::makeTitle( NS_MAIN, 'Test' ),
				[ 'foo' => '0' ],
				true
			],
			[
				'Can be disabled with a non-regex wildcard (for backwards compatibility).',
				self::makeMaxWidthConfig(
					false,
					[
						/* no namespaces excluded */
					],
					[
						/* no includes */
					],
					[ 'foo' => '*' ]
				),
				Title::makeTitle( NS_MAIN, 'Test' ),
				[ 'foo' => 'bar' ],
				true
			],
			[
				'Include can override exclusions',
				self::makeMaxWidthConfig(
					false,
					[ NS_CATEGORY, NS_SPECIAL ],
					[ 'Special:Specialpages' ],
					[ 'action' => 'history' ]
				),
				Title::makeTitle( NS_SPECIAL, 'Specialpages' ),
				[ 'action' => 'history' ],
				true
			],
			[
				'Max width can be disabled on talk pages',
				$excludeTalkFooConfig,
				Title::makeTitle( NS_TALK, 'A talk page' ),
				[],
				true
			],
			[
				'includes can be used to override any page in a disabled namespace',
				$excludeTalkFooConfig,
				Title::makeTitle( NS_TALK, 'Foo' ),
				[],
				false
			],
			[
				'Excludes/includes are based on root title so should apply to subpages',
				$excludeTalkFooConfig,
				Title::makeTitle( NS_TALK, 'Foo/subpage' ),
				[],
				false
			]
		];
	}

	/**
	 * @todo move into MediaWiki\Skins\Continuum\FeatureManagement\Requirements\LimitedWidthContentRequirement
	 *  test in future.
	 * @covers MediaWiki\Skins\Continuum\FeatureManagement\Requirements\LimitedWidthContentRequirement::isMet
	 * @dataProvider providerShouldDisableMaxWidth
	 */
	public function testShouldDisableMaxWidth(
		$msg,
		$options,
		$title,
		$requestValues,
		$shouldDisableMaxWidth
	) {
		$requirement = new LimitedWidthContentRequirement(
			new HashConfig( [ 'ContinuumMaxWidthOptions' => $options ] ),
			new FauxRequest( $requestValues ),
			$title
		);
		$this->assertSame(
			!$shouldDisableMaxWidth,
			$requirement->isMet(),
			$msg
		);
	}

	/**
	 * @covers ::getActiveABTest
	 * @dataProvider provideGetActiveABTest
	 */
	public function testGetActiveABTest( $configData, $expected ) {
		$config = new HashConfig( $configData );
		$continuumConfig = Hooks::getActiveABTest(
			$this->createMock( Context::class ),
			$config
		);

		$this->assertSame(
			$expected,
			$continuumConfig
		);
	}

	/**
	 * @covers ::getActiveABTest
	 * @dataProvider provideGetActiveABTestWithExceptions
	 */
	public function testGetActiveABTestWithExceptions( $configData ) {
		$config = new HashConfig( $configData );
		$this->expectException( RuntimeException::class );
		Hooks::getActiveABTest(
			$this->createMock( Context::class ),
			$config
		);
	}

	/**
	 * @covers ::onLocalUserCreated
	 */
	public function testOnLocalUserCreatedLegacy() {
		$config = new HashConfig( [
			'ContinuumDefaultSkinVersionForNewAccounts' => Constants::SKIN_VERSION_LEGACY,
		] );

		$user = $this->createMock( User::class );
		$userOptionsManager = $this->createMock( UserOptionsManager::class );
		$userOptionsManager->expects( $this->once() )
			->method( 'setOption' )
			->with( $user, 'skin', Constants::SKIN_NAME_LEGACY );

		// NOTE: Using $this->getServiceContainer()->getHookContainer()->run( ... )
		// will instead call Echo's legacy hook as that is already registered which
		// will break this test. Use Continuum's hook handler instead.
		( new Hooks(
			$config,
			$userOptionsManager
		) )->onLocalUserCreated( $user, false );
	}

	/**
	 * @covers ::onLocalUserCreated
	 */
	public function testOnLocalUserCreatedLatest() {
		$config = new HashConfig( [
			'ContinuumDefaultSkinVersionForNewAccounts' => Constants::SKIN_VERSION_LATEST,
		] );

		$user = $this->createMock( User::class );
		$userOptionsManager = $this->createMock( UserOptionsManager::class );
		$userOptionsManager->expects( $this->once() )
			->method( 'setOption' )
			->with( $user, 'skin', Constants::SKIN_NAME_MODERN );

		// NOTE: Using $this->getServiceContainer()->getHookContainer()->run( ... )
		// will instead call Echo's legacy hook as that is already registered which
		// will break this test. Use Continuum's hook handler instead.
		( new Hooks(
			$config,
			$userOptionsManager
		) )->onLocalUserCreated( $user, false );
	}

	/**
	 * @covers ::onSkinTemplateNavigation
	 */
	public function testOnSkinTemplateNavigation() {
		$this->overrideConfigValue( 'ContinuumUseIconWatch', true );
		$skin = new SkinContinuum22(
			$this->getServiceContainer()->getLanguageConverterFactory(),
			$this->getServiceContainer()->get( 'Continuum.FeatureManagerFactory' ),
			[ 'name' => 'continuum' ]
		);
		$skin->getContext()->setTitle( Title::newFromText( 'Foo' ) );
		$contentNavWatch = [
			'associated-pages' => [],
			'views' => [],
			'actions' => [
				'watch' => [ 'class' => [ 'watch' ], 'icon' => 'star' ],
			]
		];
		$contentNavUnWatch = [
			'associated-pages' => [],
			'views' => [],
			'actions' => [
				'move' => [ 'class' => [ 'move' ] ],
				'unwatch' => [ 'icon' => 'unStar' ],
			],
		];

		Hooks::onSkinTemplateNavigation( $skin, $contentNavUnWatch );
		Hooks::onSkinTemplateNavigation( $skin, $contentNavWatch );

		$this->assertContains(
			'icon', $contentNavWatch['views']['watch']['class'],
			'Watch list items require an "icon" class'
		);
		$this->assertContains(
			'icon', $contentNavUnWatch['views']['unwatch']['class'],
			'Unwatch list items require an "icon" class'
		);
		$this->assertNotContains(
			'icon', $contentNavUnWatch['actions']['move']['class'],
			'List item other than watch or unwatch should not have an "icon" class'
		);
	}

	/**
	 * @covers ::updateUserLinksItems
	 */
	public function testUpdateUserLinksItems() {
		$continuum2022Skin = new SkinContinuum22(
			$this->getServiceContainer()->getLanguageConverterFactory(),
			$this->getServiceContainer()->get( 'Continuum.FeatureManagerFactory' ),
			[ 'name' => 'continuum' ]
		);
		$contentNav = [
			'associated-pages' => [],
			'views' => [],
			'user-page' => [
				'userpage' => [ 'class' => [], 'icon' => 'userpage' ],
			],
			'user-menu' => [
				'login' => [ 'class' => [], 'icon' => 'login' ],
			]
		];
		$continuumLegacySkin = new SkinContinuumLegacy(
			$this->getServiceContainer()->getLanguageConverterFactory(),
			[ 'name' => 'continuum' ]
		);
		$contentNavLegacy = [
			'associated-pages' => [],
			'views' => [],
			'user-page' => [
				'userpage' => [ 'class' => [], 'icon' => 'userpage' ],
			]
		];

		Hooks::onSkinTemplateNavigation( $continuum2022Skin, $contentNav );
		$this->assertFalse( isset( $contentNav['user-page']['login'] ),
			'updateUserLinksDropdownItems is called when not legacy'
		);
		Hooks::onSkinTemplateNavigation( $continuumLegacySkin, $contentNavLegacy );
		$this->assertFalse( isset( $contentNavLegacy['user-page'] ),
			'user-page is unset for legacy continuum'
		);
	}

	/**
	 * @covers ::updateUserLinksDropdownItems
	 */
	public function testUpdateUserLinksDropdownItems() {
		$updateUserLinksDropdownItems = new ReflectionMethod(
			Hooks::class,
			'updateUserLinksDropdownItems'
		);
		$updateUserLinksDropdownItems->setAccessible( true );

		// Anon users
		$skin = new SkinContinuum22(
			$this->getServiceContainer()->getLanguageConverterFactory(),
			$this->getServiceContainer()->get( 'Continuum.FeatureManagerFactory' ),
			[ 'name' => 'continuum' ]
		);
		$contentAnon = [
			'user-menu' => [
				'anonuserpage' => [ 'class' => [], 'icon' => 'anonuserpage' ],
				'createaccount' => [ 'class' => [], 'icon' => 'createaccount' ],
				'login' => [ 'class' => [], 'icon' => 'login' ],
				'anontalk' => [ 'class' => [], 'icon' => 'anontalk' ],
				'anoncontribs' => [ 'class' => [], 'icon' => 'anoncontribs' ],
			],
		];
		$updateUserLinksDropdownItems->invokeArgs( null, [ $skin, &$contentAnon ] );
		$this->assertTrue(
			count( $contentAnon['user-menu'] ) === 2 &&
			isset( $contentAnon['user-menu']['createaccount'] ) &&
			isset( $contentAnon['user-menu']['login'] ),
			'Anon user page, anon talk, anon contribs links are removed from user-menu'
		);

		$this->assertTrue(
			count( $contentAnon['user-menu'] ) === 2 &&
			isset( $contentAnon['user-menu-anon-editor']['anontalk'] ) &&
			isset( $contentAnon['user-menu-anon-editor']['anoncontribs'] ),
			'Anon talk, anon contribs links are moved to user-menu-anon-editor'
		);

		// Registered user
		$registeredUser = $this->createMock( User::class );
		$registeredUser->method( 'isRegistered' )->willReturn( true );
		$context = new RequestContext();
		$context->setUser( $registeredUser );
		$skin->setContext( $context );
		$contentRegistered = [
			'user-menu' => [
				'userpage' => [ 'class' => [], 'icon' => 'userpage' ],
				'watchlist' => [ 'class' => [], 'icon' => 'watchlist' ],
				'logout' => [ 'class' => [], 'icon' => 'logout' ],
			],
		];
		$updateUserLinksDropdownItems->invokeArgs( null, [ $skin, &$contentRegistered ] );
		$this->assertContains( 'user-links-collapsible-item', $contentRegistered['user-menu']['userpage']['class'],
			'User page link in user links dropdown requires collapsible class'
		);
		$this->assertEquals(
			'<span class="continuum-icon mw-ui-icon-userpage mw-ui-icon-wikimedia-userpage"></span>',
			$contentRegistered['user-menu']['userpage']['link-html'],
			'User page link in user links dropdown has link-html'
		);
		$this->assertContains( 'user-links-collapsible-item', $contentRegistered['user-menu']['watchlist']['class'],
			'Watchlist link in user links dropdown requires collapsible class'
		);
		$this->assertEquals(
			'<span class="continuum-icon mw-ui-icon-watchlist mw-ui-icon-wikimedia-watchlist"></span>',
			$contentRegistered['user-menu']['watchlist']['link-html'],
			'Watchlist link in user links dropdown has link-html'
		);
		$this->assertFalse( isset( $contentRegistered['user-menu']['logout'] ),
			'Logout link in user links dropdown is not set'
		);
		$this->assertTrue( isset( $contentRegistered['user-menu-logout']['logout'] ),
			'Logout link in user links dropdown is not set'
		);
	}

	public static function provideAppendClassToItem() {
		return [
			// Add array class to array
			[
				[],
				[ 'array1', 'array2' ],
				[ 'array1', 'array2' ],
			],
			// Add string class to array
			[
				[],
				'array1 array2',
				[ 'array1 array2' ],
			],
			// Add array class to string
			[
				'',
				[ 'array1', 'array2' ],
				'array1 array2',
			],
			// Add string class to string
			[
				'',
				'array1 array2',
				'array1 array2',
			],
			// Add string class to undefined
			[
				null,
				'array1 array2',
				'array1 array2',
			],
			// Add array class to undefined
			[
				null,
				[ 'array1', 'array2' ],
				[ 'array1', 'array2' ],
			],
		];
	}

	/**
	 * @covers ::appendClassToItem
	 * @dataProvider provideAppendClassToItem
	 */
	public function testAppendClassToItem(
		$item,
		$classes,
		$expected
	) {
		$appendClassToItem = new ReflectionMethod(
			Hooks::class,
			'appendClassToItem'
		);
		$appendClassToItem->setAccessible( true );
		$appendClassToItem->invokeArgs( null, [ &$item, $classes ] );
		$this->assertEquals( $expected, $item );
	}

	public static function provideUpdateItemData() {
		return [
			// Removes extra attributes
			[
				[ 'class' => [], 'icon' => '', 'button' => false, 'text-hidden' => false, 'collapsible' => false ],
				'link-class',
				'link-html',
				[ 'class' => [] ],
			],
			// Adds icon html
			[
				[ 'class' => [], 'icon' => 'userpage' ],
				'link-class',
				'link-html',
				[
					'class' => [],
					'link-html' =>
					'<span class="continuum-icon mw-ui-icon-userpage mw-ui-icon-wikimedia-userpage"></span>'
				],
			],
			// Adds collapsible class
			[
				[ 'class' => [], 'collapsible' => true ],
				'link-class',
				'link-html',
				[ 'class' => [ 'user-links-collapsible-item' ] ],
			],
			// Adds button classes
			[
				[ 'class' => [], 'button' => true ],
				'link-class',
				'link-html',
				[ 'class' => [], 'link-class' => [
					'cdx-button',
					'cdx-button--fake-button',
					'cdx-button--fake-button--enabled',
					'cdx-button--weight-quiet'
				] ],
			],
			// Adds text hidden classes
			[
				[ 'class' => [], 'button' => true, 'text-hidden' => true, 'icon' => 'userpage' ],
				'link-class',
				'link-html',
				[
					'class' => [],
					'link-class' => [
						'cdx-button',
						'cdx-button--fake-button',
						'cdx-button--fake-button--enabled',
						'cdx-button--weight-quiet',
						'cdx-button--icon-only'
					],
					'link-html' =>
						'<span class="continuum-icon mw-ui-icon-userpage mw-ui-icon-wikimedia-userpage"></span>'
				],
			],
			// Adds button and icon classes
			[
				[ 'class' => [], 'button' => true, 'icon' => 'userpage' ],
				'class',
				'link-html',
				[ 'class' => [
					'cdx-button',
					'cdx-button--fake-button',
					'cdx-button--fake-button--enabled',
					'cdx-button--weight-quiet'
				], 'link-html' =>
					'<span class="continuum-icon mw-ui-icon-userpage mw-ui-icon-wikimedia-userpage"></span>'
				],
			]
		];
	}

	/**
	 * @covers ::updateItemData
	 * @dataProvider provideUpdateItemData
	 */
	public function testUpdateItemData(
		array $item,
		string $buttonClassProp,
		string $iconHtmlProp,
		array $expected
	) {
		$updateItemData = new ReflectionMethod(
			Hooks::class,
			'updateItemData'
		);
		$updateItemData->setAccessible( true );
		$data = $updateItemData->invokeArgs( null, [ $item, $buttonClassProp, $iconHtmlProp ] );
		$this->assertArraySubmapSame( $expected, $data );
	}
}
