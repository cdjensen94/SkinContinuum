<?php
namespace MediaWiki\Skins\Continuum\Components;

/**
 * ContinuumComponentMenuListItem component
 */
class ContinuumComponentMenuListItem implements ContinuumComponent {
	/** @var ContinuumComponentLink */
	private $link;
	/** @var string */
	private $class;
	/** @var string */
	private $id;

	/**
	 * @param ContinuumComponentLink $link
	 * @param string $class
	 * @param string $id
	 */
	public function __construct( ContinuumComponentLink $link, string $class = '', string $id = '' ) {
		$this->link = $link;
		$this->class = $class;
		$this->id = $id;
	}

	/**
	 * @inheritDoc
	 */
	public function getTemplateData(): array {
		return $this->link->getTemplateData() + [
			'item-class' => $this->class,
			'item-id' => $this->id,
		];
	}
}
