<?php

// ==========================================================
// Este archivo recibe los datos del formulario de reseñas
// (nombre, apellido, correo y comentario), los valida y,
// si todo está bien, envía un mail con la reseña.
// Se ejecuta de arriba hacia abajo, en este orden:
//   1) Funciones de ayuda (más abajo).
//   2) Comprobar que la petición sea válida (método POST).
//   3) Leer y validar cada campo del formulario.
//   4) Si hay errores, mostrarlos y terminar.
//   5) Si todo está bien, enviar el mail y redirigir.
// ==========================================================

// Convierte texto en HTML seguro, para que si alguien escribe
// código en el formulario no se ejecute en la página, solo se vea como texto.
function escapar($valor)
{
    return htmlspecialchars($valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

// Cuenta caracteres correctamente (incluyendo tildes y eñes).
function longitud($valor)
{
    return function_exists('mb_strlen') ? mb_strlen($valor, 'UTF-8') : strlen($valor);
}

// Lee un campo del formulario. Devuelve null si no vino,
// o el texto ya sin espacios de más al principio, al final o en el medio.
function leerCampo($nombre)
{
    if (!isset($_POST[$nombre]) || !is_string($_POST[$nombre])) {
        return null;
    }

    $valor = trim($_POST[$nombre]);
    return preg_replace('/[ \t]+/u', ' ', $valor);
}

// Un nombre/apellido válido: solo letras (con acentos), espacios, puntos,
// guiones o apóstrofes, y entre 2 y 50 caracteres.
function esNombreValido($valor)
{
    if ($valor === null) {
        return false;
    }
    $patron = '/\A[\p{L}\p{M}][\p{L}\p{M} .\'’-]*\z/u';
    $largo = longitud($valor);
    return $largo >= 2 && $largo <= 50 && preg_match($patron, $valor) === 1;
}

// Muestra una página HTML simple con un título y un mensaje, y termina la ejecución.
// Se usa tanto para errores como para respuestas inesperadas.
function mostrarRespuesta($titulo, $mensaje, $codigoHttp)
{
    http_response_code($codigoHttp);
    header('Content-Type: text/html; charset=UTF-8');
    $tituloSeguro = escapar($titulo);
    $mensajeSeguro = escapar($mensaje);

    echo '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <link rel="stylesheet" href="estilos_formulario.css">
    <link rel="icon" type="image/svg+xml" href="../img/logo/logo-isotipo.svg">
    <title>' . $tituloSeguro . '</title>
</head>
<body>
    <header><h1>' . $tituloSeguro . '</h1></header>
    <p>' . $mensajeSeguro . '</p>
    <p><a href="../index.html#resenas">Volver al formulario</a></p>
</body>
</html>';
    exit;
}

// --- 1) Solo se acepta el envío del formulario por POST ---
if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    mostrarRespuesta('Solicitud inválida', 'El formulario solo puede enviarse mediante POST.', 405);
}

// --- 2) Leer los campos enviados ---
$nombre = leerCampo('nombre');
$apellido = leerCampo('apellido');
$correo = leerCampo('mail');
$comentario = leerCampo('comentario');
$errores = array();

// --- 3) Validar cada campo ---
if (!esNombreValido($nombre)) {
    $errores[] = 'El nombre debe tener entre 2 y 50 caracteres y contener solo letras y separadores habituales.';
}

if (!esNombreValido($apellido)) {
    $errores[] = 'El apellido debe tener entre 2 y 50 caracteres y contener solo letras y separadores habituales.';
}

// El correo, además de tener formato válido, no puede contener saltos de línea
// (eso evita que alguien intente colar cabeceras falsas en el mail).
$correoValido = $correo !== null
    && strlen($correo) <= 254
    && preg_match('/[\r\n]/', $correo) !== 1
    && filter_var($correo, FILTER_VALIDATE_EMAIL) !== false;

if (!$correoValido) {
    $errores[] = 'Ingresá una dirección de correo válida.';
}

if ($comentario === null || longitud($comentario) < 10 || longitud($comentario) > 80) {
    $errores[] = 'El comentario debe tener entre 10 y 80 caracteres.';
}

// --- 4) Si algo no es válido, se muestra el motivo y no se envía nada ---
if ($errores) {
    mostrarRespuesta('Revisá los datos', implode(' ', $errores), 422);
}

// --- 5) Todo válido: se arma y se envía el mail con la reseña ---
$enviaPara = 'martin.viegas@davinci.edu.ar';
$asunto = 'Nuevo comentario recibido - Bandeate';
$mensaje = '<strong>Nombre:</strong> ' . escapar($nombre) . '<br>'
    . '<strong>Apellido:</strong> ' . escapar($apellido) . '<br>'
    . '<strong>Correo:</strong> ' . escapar($correo) . '<br>'
    . '<strong>Comentario:</strong><br>' . nl2br(escapar($comentario), false);

// El remitente ("From") siempre es la dirección del sitio, nunca la que escribe
// la persona que llena el formulario: así evitamos que alguien falsifique el mail.
// El correo de la persona va en "Reply-To", para poder responderle directamente.
$cabeceras = array(
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: Bandeate <martin.viegas@davinci.edu.ar>',
    'Reply-To: ' . $correo
);

$enviado = mail($enviaPara, $asunto, $mensaje, implode("\r\n", $cabeceras));

if (!$enviado) {
    mostrarRespuesta('No se pudo enviar', 'Ocurrió un problema al enviar tu comentario. Intentá nuevamente más tarde.', 500);
}

header('Location: enviado.html', true, 303);
exit;
