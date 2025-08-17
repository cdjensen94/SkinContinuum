<?php
namespace MediaWiki\Skins\Continuum\Components;

use MediaWiki\Skins\Continuum\Constants;
use MediaWiki\Skins\Continuum\FeatureManagement\FeatureManager;
use MessageLocalizer;

/**
 * ContinuumComponentAppearance component
 */
class ContinuumComponentAppearance implements ContinuumComponent {

	/** @var MessageLocalizer */
	private $localizer;

	/** @var bool */
	private $isPinned;

	/** @var string */
	public const ID = 'continuum-appearance';

	/**
	 * @param MessageLocalizer $localizer
	 * @param FeatureManager $featureManager
	 */
	public function __construct(
		MessageLocalizer $localizer,
		FeatureManager $featureManager
	) {
		$this->localizer = $localizer;
		// FIXME: isPinned is no longer accurate because the appearance menu uses client preferences
		$this->isPinned = $featureManager->isFeatureEnabled( Constants::FEATURE_APPEARANCE_PINNED );
	}

	/**
	 * @inheritDoc
	 */
	public function getTemplateData(): array {
		$pinnedContainer = new ContinuumComponentPinnableContainer( self::ID, $this->isPinned );
		$pinnableElement = new ContinuumComponentPinnableElement( self::ID );
		$pinnableHeader = new ContinuumComponentPinnableHeader(
			$this->localizer,
			$this->isPinned,
			// Name
			self::ID,
			// Feature name
			'appearance-pinned'
		);

		$data = $pinnableElement->getTemplateData() +
			$pinnedContainer->getTemplateData();

		return $data + [
			'data-pinnable-header' => $pinnableHeader->getTemplateData()
		];
	}
}
