<?php
namespace MediaWiki\Skins\Continuum\Components;

use MediaWiki\Config\Config;
use MediaWiki\Skins\Continuum\Constants;
use MediaWiki\Skins\Continuum\FeatureManagement\FeatureManager;
use MessageLocalizer;

/**
 * ContinuumComponentTableOfContents component
 */
class ContinuumComponentTableOfContents implements ContinuumComponent {

	/** @var array */
	private $tocData;

	/** @var MessageLocalizer */
	private $localizer;

	/** @var bool */
	private $isPinned;

	/** @var Config */
	private $config;

	/** @var ContinuumComponentPinnableHeader */
	private $pinnableHeader;

	/** @var string */
	public const ID = 'continuum-toc';

	/**
	 * @param array $tocData
	 * @param MessageLocalizer $localizer
	 * @param Config $config
	 * @param FeatureManager $featureManager
	 */
	public function __construct(
		array $tocData,
		MessageLocalizer $localizer,
		Config $config,
		FeatureManager $featureManager
	) {
		$this->tocData = $tocData;
		$this->localizer = $localizer;
		// FIXME: isPinned is no longer accurate because the appearance menu uses client preferences
		$this->isPinned = $featureManager->isFeatureEnabled( Constants::FEATURE_TOC_PINNED );
		$this->config = $config;
		$this->pinnableHeader = new ContinuumComponentPinnableHeader(
			$this->localizer,
			$this->isPinned,
			self::ID,
			'toc-pinned',
			false,
			'h2'
		);
	}

	/**
	 * @return bool
	 */
	public function isPinned(): bool {
		return $this->isPinned;
	}

	/**
	 * In tableOfContents.js we have tableOfContents::getTableOfContentsSectionsData(),
	 * that yields the same result as this function, please make sure to keep them in sync.
	 * @inheritDoc
	 */
	public function getTemplateData(): array {
		$sections = $this->tocData[ 'array-sections' ] ?? [];
		if ( !$sections ) {
			return [];
		}
		// Populate button labels for collapsible TOC sections
		foreach ( $sections as &$section ) {
			if ( $section['is-top-level-section'] && $section['is-parent-section'] ) {
				$section['continuum-button-label'] =
					$this->localizer->msg( 'continuum-toc-toggle-button-label' )
						->rawParams( $section['line'] )
						->escaped();
			}
		}
		$this->tocData[ 'array-sections' ] = $sections;

		$pinnableElement = new ContinuumComponentPinnableElement( self::ID );

		return $pinnableElement->getTemplateData() +
			array_merge( $this->tocData, [
			'continuum-is-collapse-sections-enabled' =>
				count( $this->tocData['array-sections'] ) > 3 &&
				$this->tocData[ 'number-section-count'] >= $this->config->get(
					'ContinuumTableOfContentsCollapseAtCount'
				),
			'data-pinnable-header' => $this->pinnableHeader->getTemplateData(),
		] );
	}
}
