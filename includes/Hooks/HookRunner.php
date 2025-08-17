<?php

namespace MediaWiki\Skins\Continuum\Hooks;

use MediaWiki\HookContainer\HookContainer;

/**
 * @internal
 */
class HookRunner implements ContinuumSearchResourceLoaderConfigHook {
	private HookContainer $hookContainer;

	public function __construct( HookContainer $hookContainer ) {
		$this->hookContainer = $hookContainer;
	}

	/**
	 * @inheritDoc
	 */
	public function onContinuumSearchResourceLoaderConfig( array &$continuumSearchConfig ): void {
		$this->hookContainer->run(
			'ContinuumSearchResourceLoaderConfig',
			[ &$continuumSearchConfig ]
		);
	}
}
