<?php
namespace MediaWiki\Skins\Continuum\Components;

use MediaWiki\Skins\Continuum\Constants;
use MediaWiki\Skins\Continuum\FeatureManagement\FeatureManager;
use MessageLocalizer;

/**
 * ContinuumComponentPageTools component
 */
class ContinuumComponentPageTools implements ContinuumComponent {

	/** @var array */
	private $menus;

	/** @var MessageLocalizer */
	private $localizer;

	/** @var bool */
	private $isPinned;

	/** @var ContinuumComponentPinnableHeader */
	private $pinnableHeader;

	/** @var string */
	public const ID = 'continuum-page-tools';

	/** @var string */
	public const TOOLBOX_ID = 'p-tb';

	/** @var string */
	private const ACTIONS_ID = 'p-cactions';

	/**
	 * @param array $menus
	 * @param MessageLocalizer $localizer
	 * @param FeatureManager $featureManager
	 */
	public function __construct(
		array $menus,
		MessageLocalizer $localizer,
		FeatureManager $featureManager
	) {
		$this->menus = $menus;
		$this->localizer = $localizer;
		$this->isPinned = $featureManager->isFeatureEnabled( Constants::FEATURE_PAGE_TOOLS_PINNED );
		$this->pinnableHeader = new ContinuumComponentPinnableHeader(
			$localizer,
			$this->isPinned,
			// Name
			self::ID,
			// Feature name
			'page-tools-pinned'
		);
	}

	/**
	 * Revises the labels of the p-tb and p-cactions menus.
	 *
	 * @return array
	 */
	private function getMenus(): array {
		return array_map( function ( $menu ) {
			switch ( $menu['id'] ?? '' ) {
				case self::TOOLBOX_ID:
					$menu['label'] = $this->localizer->msg( 'continuum-page-tools-general-label' )->text();
					break;
				case self::ACTIONS_ID:
					$menu['label'] = $this->localizer->msg( 'continuum-page-tools-actions-label' )->text();
					break;
			}

			return $menu;
		}, $this->menus );
	}

	/**
	 * @inheritDoc
	 */
	public function getTemplateData(): array {
		$pinnedContainer = new ContinuumComponentPinnableContainer( self::ID, $this->isPinned );
		$pinnableElement = new ContinuumComponentPinnableElement( self::ID );

		$data = $pinnableElement->getTemplateData() +
			$pinnedContainer->getTemplateData();

		return $data + [
			'data-pinnable-header' => $this->pinnableHeader->getTemplateData(),
			'data-menus' => $this->getMenus()
		];
	}
}
