<?php

namespace MediaWiki\Skins\Continuum\Hooks;

/**
 * Use the hook name "ContinuumSearchResourceLoaderConfig" to register
 * handlers implementing this interface to modify Continuum's search config.
 *
 * @stable to implement
 * @ingroup Hooks
 */
interface ContinuumSearchResourceLoaderConfigHook {
	/**
	 * @param array &$continuumSearchConfig
	 * @return void
	 */
	public function onContinuumSearchResourceLoaderConfig( array &$continuumSearchConfig ): void;
}
