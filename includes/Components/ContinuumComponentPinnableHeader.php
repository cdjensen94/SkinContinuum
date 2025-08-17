<?php
namespace MediaWiki\Skins\Continuum\Components;

use MessageLocalizer;

/**
 * ContinuumComponentPinnableHeader component
 */
class ContinuumComponentPinnableHeader implements ContinuumComponent {
	/** @var MessageLocalizer */
	private $localizer;
	/** @var bool */
	private $pinned;
	/** @var string */
	private $id;
	/** @var string */
	private $featureName;
	/**
	 * @var bool
	 * Flag controlling if the pinnable element should be automatically moved in the DOM when pinned/unpinned
	 */
	private $moveElement;
	/**
	 * @var string
	 */
	private $labelTagName;

	/**
	 * @param MessageLocalizer $localizer
	 * @param bool $pinned
	 * @param string $id Pinnable element id, by convention this should include the `continuum-`
	 * prefix e.g. `continuum-page-tools` or `continuum-toc`.
	 * @param string $featureName Pinned and unpinned states will
	 * persist for logged-in users by leveraging features.js to manage the user
	 * preference storage and the toggling of the body class. This name should NOT
	 * contain the "continuum-" prefix.
	 * @param bool|null $moveElement
	 * @param string|null $labelTagName Element type of the label. Either a 'div' or a 'h2'
	 *   in the case of the pinnable ToC.
	 */
	public function __construct(
		MessageLocalizer $localizer,
		bool $pinned,
		string $id,
		string $featureName,
		?bool $moveElement = true,
		?string $labelTagName = 'div'
	) {
		$this->localizer = $localizer;
		$this->pinned = $pinned;
		$this->id = $id;
		$this->featureName = $featureName;
		$this->moveElement = $moveElement;
		$this->labelTagName = $labelTagName;
	}

	/**
	 * @inheritDoc
	 */
	public function getTemplateData(): array {
		$messageLocalizer = $this->localizer;
		$data = [
			'is-pinned' => $this->pinned,
			'label' => $messageLocalizer->msg( $this->id . '-label' ),
			'label-tag-name' => $this->labelTagName,
			'pin-label' => $messageLocalizer->msg( 'continuum-pin-element-label' ),
			'unpin-label' => $messageLocalizer->msg( 'continuum-unpin-element-label' ),
			'data-pinnable-element-id' => $this->id,
			'data-feature-name' => $this->featureName
		];
		if ( $this->moveElement ) {
			// Assumes consistent naming standard for pinnable elements and their containers
			$data = array_merge( $data, [
				'data-unpinned-container-id' => $this->id . '-unpinned-container',
				'data-pinned-container-id' => $this->id . '-pinned-container',
			] );
		}
		return $data;
	}
}
