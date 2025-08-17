<?php
namespace MediaWiki\Skins\Continuum\Components;

/**
 * Component interface for managing Continuum-modified components
 *
 * @internal
 */
interface ContinuumComponent {
	/**
	 * @return array of Mustache compatible data
	 */
	public function getTemplateData(): array;
}
