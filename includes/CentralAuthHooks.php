<?php

namespace MediaWiki\Skins\Continuum;

use MediaWiki\Extension\CentralAuth\Hooks\CentralAuthIsUIReloadRecommendedHook;
use MediaWiki\User\Options\UserOptionsLookup;
use MediaWiki\User\User;

/**
 * @package Continuum
 * @internal
 */
class CentralAuthHooks implements CentralAuthIsUIReloadRecommendedHook {

	private UserOptionsLookup $userOptionsLookup;

	public function __construct( UserOptionsLookup $userOptionsLookup ) {
		$this->userOptionsLookup = $userOptionsLookup;
	}

	/**
	 * @inheritDoc
	 */
	public function onCentralAuthIsUIReloadRecommended( User $user, bool &$recommendReload ) {
		if (
			$this->userOptionsLookup->getDefaultOption( 'skin', $user ) ===
			Constants::SKIN_NAME_MODERN
		) {
			// Continuum does not support updating the UI without reloading the page (T345112)
			$recommendReload = true;
		}
	}

}
