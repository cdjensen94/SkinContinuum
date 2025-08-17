<?php

namespace MediaWiki\Skins\Continuum;

use MediaWiki\Skins\Continuum\Services\LanguageService;

/**
 * A service locator for services specific to Continuum.
 *
 * @package Continuum
 * @internal
 */
final class ContinuumServices {

	/**
	 * Gets the language service.
	 *
	 * @return LanguageService
	 */
	public static function getLanguageService(): LanguageService {
		return new LanguageService();
	}
}
