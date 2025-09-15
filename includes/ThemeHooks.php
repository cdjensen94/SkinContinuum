<?php
namespace MediaWiki\Skins\Continuum;

use MediaWiki\MediaWikiServices;
use OutputPage;
use Skin;

class ThemeHooks {
	public static function onBeforePageDisplay( OutputPage $out, Skin $skin ): void {
		$uom   = MediaWikiServices::getInstance()->getUserOptionsManager();
		$user  = $out->getUser();
		$req   = $out->getRequest();

		$theme = $uom->getOption( $user, 'continuum-theme', 'imperial-night' );
		// anon cookie fallback
		if ( !$user->isRegistered() ) {
			$cookie = $req->getCookie( 'continuum-theme' );
			if ( $cookie ) {
				$theme = $cookie;
			}
		}

		$valid = [ 'imperial-night', 'ubla-day', 'ubla-night', 'verdant', 'adams-chaos' ];
		if ( !in_array( $theme, $valid, true ) ) {
			$theme = 'imperial-night';
		}

		$out->addBodyClasses( [ 'theme-' . $theme ] );
		$out->addHtmlClasses( [ 'continuum-theme-clientpref-' . $theme ] ); // <-- critical
	}
}