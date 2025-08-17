<?php
namespace MediaWiki\Skins\Continuum\Components;

/**
 * ContinuumComponentPinnableContainer component
 * To be used with PinnableContainer/Pinned or PinnableContainer/Unpinned templates.
 */
class ContinuumComponentPinnableContainer implements ContinuumComponent {
	/** @var string */
	private $id;
	/** @var bool */
	private $isPinned;

	/**
	 * @param string $id
	 * @param bool $isPinned
	 */
	public function __construct( string $id, bool $isPinned = true ) {
		$this->id = $id;
		$this->isPinned = $isPinned;
	}

	/**
	 * @inheritDoc
	 */
	public function getTemplateData(): array {
		return [
			'id' => $this->id,
			'is-pinned' => $this->isPinned,
		];
	}
}
