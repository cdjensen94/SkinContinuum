<?php
namespace MediaWiki\Skins\Continuum\Components;

/**
 * ContinuumComponentPinnableElement component
 */
class ContinuumComponentPinnableElement implements ContinuumComponent {
	/** @var string */
	private $id;

	/**
	 * @param string $id
	 */
	public function __construct( string $id ) {
		$this->id = $id;
	}

	/**
	 * @inheritDoc
	 */
	public function getTemplateData(): array {
		return [
			'id' => $this->id,
		];
	}
}
