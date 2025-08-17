<?php
namespace MediaWiki\Skins\Continuum\Components;

use MediaWiki\Skins\Continuum\Constants;
use MediaWiki\Skins\Continuum\FeatureManagement\FeatureManager;
use MediaWiki\User\UserIdentity;
use MessageLocalizer;
use Skin;

/**
 * ContinuumComponentMainMenu component
 */
class ContinuumComponentMainMenu implements ContinuumComponent {
	/** @var array */
	private $sidebarData;
	/** @var array */
	private $languageData;
	/** @var MessageLocalizer */
	private $localizer;
	/** @var bool */
	private $isPinned;
	/** @var ContinuumComponentPinnableHeader|null */
	private $pinnableHeader;
	/** @var string */
	public const ID = 'continuum-main-menu';

	/**
	 * @param array $sidebarData
	 * @param array $languageData
	 * @param MessageLocalizer $localizer
	 * @param UserIdentity $user
	 * @param FeatureManager $featureManager
	 * @param Skin $skin
	 */
	public function __construct(
		array $sidebarData,
		array $languageData,
		MessageLocalizer $localizer,
		UserIdentity $user,
		FeatureManager $featureManager,
		Skin $skin
	) {
		$this->sidebarData = $sidebarData;
		$this->languageData = $languageData;
		$this->localizer = $localizer;
		$this->isPinned = $featureManager->isFeatureEnabled( Constants::FEATURE_MAIN_MENU_PINNED );

		$this->pinnableHeader = new ContinuumComponentPinnableHeader(
			$this->localizer,
			$this->isPinned,
			self::ID,
			'main-menu-pinned'
		);
	}

	/**
	 * @inheritDoc
	 */
	public function getTemplateData(): array {
		$pinnableHeader = $this->pinnableHeader;

		$portletsRest = [];
		foreach ( $this->sidebarData[ 'array-portlets-rest' ] as $data ) {
			$portletsRest[] = ( new ContinuumComponentMenu( $data ) )->getTemplateData();
		}
		$firstPortlet = new ContinuumComponentMenu( $this->sidebarData['data-portlets-first'] );
		$languageMenu = new ContinuumComponentMenu( $this->languageData );

		$pinnableContainer = new ContinuumComponentPinnableContainer( self::ID, $this->isPinned );
		$pinnableElement = new ContinuumComponentPinnableElement( self::ID );

		return $pinnableElement->getTemplateData() + $pinnableContainer->getTemplateData() + [
			'data-portlets-first' => $firstPortlet->getTemplateData(),
			'array-portlets-rest' => $portletsRest,
			'data-pinnable-header' => $pinnableHeader ? $pinnableHeader->getTemplateData() : null,
			'data-languages' => $languageMenu->getTemplateData(),
		];
	}
}
