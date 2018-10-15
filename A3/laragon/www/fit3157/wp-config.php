<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'fit3157');

/** MySQL database username */
define('DB_USER', 'root');

/** MySQL database password */
define('DB_PASSWORD', 'root');

/** MySQL hostname */
define('DB_HOST', 'localhost');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         '0&/;3+!s-XU<{]mfwzVb}S9c;~6,s8QZhq6<je$?/32AV]~|qy~phrm$sB c7:O>');
define('SECURE_AUTH_KEY',  '%4fx`_E|l> Z(6Isf[n0*&^u:MtM~AA?#3k7u=]P&p%Fw]+t;LGQ7;PI9wW~,X&#');
define('LOGGED_IN_KEY',    'O1Pe~.-NM#dnXhy#U;aLu4swRwCc]&e)( lVHe,*8Y>D#;GBeB+G5F8bnB*Ch|Mk');
define('NONCE_KEY',        '3%^uS&rIGZ5fV@!KlIvAd>n,KG+!OIUB9Ak ]W0K(Td|t&=SqOVIUe4s;MK_K-jJ');
define('AUTH_SALT',        'leRjOb?IuFj56|yXSxjH8P%u!SJ2p=:(anb!;q:qX&Y.nSZer9&@[e)t[^7SrbJ_');
define('SECURE_AUTH_SALT', 'X?o`q{#2sp1v!_cQ04h~6^ea`R)N1Rcq]OI+]y6C!UC(xitwD]OolT^Bh Uw4 t[');
define('LOGGED_IN_SALT',   '2,7ptyZ6h]n(fP*1kTMuw]:Ji_l3:_YvVz2jMgB>hDm,}egwa 91NL[jPE{pdJaX');
define('NONCE_SALT',       '7q`Ij|nfsc|98.=yhNF~%_y2tE=<`?TI{TSnt%{mf{O4@;VHD2N6Lw#qUn?u7KqC');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', false);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
