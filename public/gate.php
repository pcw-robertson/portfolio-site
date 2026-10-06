<?php
// Password gate for the site. Apache (see .htaccess) sends every page request
// here; this serves the page itself once the visitor has entered the password,
// and a password form until then.
//
// Nothing secret lives in the repo. The password is checked against a bcrypt
// hash kept in the home folder, ABOVE public_html:
//
//     /home1/peterro3/.site-gate-hash        (one line: the $2y$... hash)
//
// so it is neither web-readable nor touched by deploys. If that file is
// missing the site fails CLOSED (503), it never falls open.
//
// The "logged in" cookie is an HMAC of the hash, so it can't be forged
// without the file, and changing the password invalidates every old cookie.
//
// Only pages (and the CV) go through here. Images, video, fonts and CSS/JS
// are served directly by Apache (see the bypass rules in .htaccess) — the gate
// keeps the site out of casual browsing and search, it is not a vault.
//
// To remove the gate: delete the "PASSWORD GATE" block in .htaccess.

$root = realpath(__DIR__);
$secretFile = dirname($root) . '/.site-gate-hash';
$hash = is_readable($secretFile) ? trim((string) file_get_contents($secretFile)) : '';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: private, no-store');

if ($hash === '') {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "This site is being set up. Please check back soon.\n";
    exit;
}

$cookieName = 'pg_access';
$token = hash_hmac('sha256', 'peter-robertson-gate', $hash);
$authed = isset($_COOKIE[$cookieName]) && is_string($_COOKIE[$cookieName])
    && hash_equals($token, $_COOKIE[$cookieName]);

// The page that was asked for (path only), reused as the post-login redirect.
$path = parse_url(isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/', PHP_URL_PATH);
if (!is_string($path) || $path === '' || $path[0] !== '/' || strpos($path, '//') === 0) {
    $path = '/';
}
$requestPath = $path;                 // as sent (still encoded): for redirects and the form
$path = rawurldecode($path);          // decoded: for finding the file
if (strpos($path, "\0") !== false) {
    http_response_code(400);
    exit;
}
$isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

$error = false;
if (!$authed && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    usleep(500000); // slow down guessing a little
    if (is_string($_POST['password']) && password_verify($_POST['password'], $hash)) {
        header(
            'Set-Cookie: ' . $cookieName . '=' . $token
            . '; Max-Age=' . (60 * 60 * 24 * 30)
            . '; Path=/; HttpOnly; SameSite=Lax' . ($isHttps ? '; Secure' : '')
        );
        header('Location: ' . $requestPath, true, 303);
        exit;
    }
    $error = true;
}

if (!$authed) {
    http_response_code($error ? 403 : 401);
    header('Content-Type: text/html; charset=utf-8');
    $action = htmlspecialchars($requestPath, ENT_QUOTES, 'UTF-8');
    ?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#000000">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" href="/favicon.png" sizes="40x40">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>Peter Robertson</title>
<style>
@font-face { font-family: "Söhne"; src: url("/fonts/soehne-buch.woff2") format("woff2"); font-weight: 400; font-display: swap; }
* { box-sizing: border-box; }
html { color-scheme: dark; }
body { margin: 0; min-height: 100vh; background: #000; color: #fff; font-family: "Söhne", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 1.25rem; line-height: 1.5rem; display: flex; flex-direction: column; }
main { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 16px; width: 100%; }
form { width: 100%; max-width: 380px; }
/* Same left edge as the site's grid (1280 container, 100px margins), so the form lines up with the name above it. */
@media (min-width: 1280px) { main { max-width: 1280px; padding: 0 100px; margin: 0 auto; } }
p { margin: 0 0 24px; }
.name { position: absolute; top: 28px; left: 16px; }
@media (min-width: 1280px) { .name { top: 65px; left: max(100px, calc(50% - 540px)); } }
label { display: block; color: #bababa; font-size: 1rem; margin-bottom: 8px; }
input { width: 100%; font: inherit; color: #fff; background: transparent; border: 0; border-bottom: 1px solid #fff; border-radius: 0; padding: 8px 0; outline: none; }
input:focus { border-bottom-color: #bababa; }
button { margin-top: 24px; font: inherit; font-size: 1rem; color: #000; background: #fff; border: 0; border-radius: 0; padding: 10px 20px; cursor: pointer; }
button:hover { background: #bababa; }
.error { color: #bababa; font-size: 1rem; margin: 12px 0 0; }
</style>
</head>
<body>
<span class="name">Peter Robertson</span>
<main>
<p>This site is private for now.</p>
<form method="post" action="<?php echo $action; ?>">
<label for="password">Password</label>
<input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
<?php if ($error) { ?><p class="error">That password isn't right.</p><?php } ?>
<button type="submit">Enter</button>
</form>
</main>
</body>
</html>
<?php
    exit;
}

// ---- Authenticated: serve the requested static file --------------------------

$rel = ltrim($path, '/');
$candidates = array();
if ($rel === '') {
    $candidates[] = 'index.html';
} else {
    $candidates[] = $rel;
    $candidates[] = rtrim($rel, '/') . '/index.html';
    $candidates[] = rtrim($rel, '/') . '.html';
}

$types = array(
    'html' => 'text/html; charset=utf-8',
    'pdf' => 'application/pdf',
    'txt' => 'text/plain; charset=utf-8',
    'xml' => 'application/xml',
    'json' => 'application/json',
    'css' => 'text/css',
    'js' => 'application/javascript',
    'svg' => 'image/svg+xml',
    'jpg' => 'image/jpeg',
    'png' => 'image/png',
    'ico' => 'image/x-icon',
);

$file = null;
foreach ($candidates as $candidate) {
    $real = realpath($root . '/' . $candidate);
    if ($real === false || !is_file($real)) {
        continue;
    }
    if (strpos($real, $root . DIRECTORY_SEPARATOR) !== 0) {
        continue; // outside the site folder
    }
    $name = basename($real);
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if ($name[0] === '.' || !isset($types[$ext])) {
        continue; // never serve dotfiles, scripts or anything unexpected
    }
    $file = $real;
    break;
}

if ($file === null) {
    $notFound = $root . '/404.html';
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    if (is_file($notFound)) {
        readfile($notFound);
    } else {
        echo "Page not found.\n";
    }
    exit;
}

$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
header('Content-Type: ' . $types[$ext]);
header('Content-Length: ' . filesize($file));
if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') {
    readfile($file);
}
