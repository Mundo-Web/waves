<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use PHPMailer\PHPMailer\PHPMailer;
use SoDe\Extend\Text;

class MailingController extends Controller
{
    static string $GMAIL_HOST = 'smtp.gmail.com';
    static int $GMAIL_PORT = 587;
    static string $GMAIL_ENCRYPTION = PHPMailer::ENCRYPTION_STARTTLS;

    public static function send(Session $session, $to, $subject, $body = '')
    {

        $encryption = MailingController::$GMAIL_ENCRYPTION;
        if (
            $session->metadata['type'] != 'gmail' &&
            $session->metadata['encryption']
        ) {
            $encryption = $session->metadata['encryption'] == 'ssl'
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
        }

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = $session->metadata['type'] == 'gmail' ? MailingController::$GMAIL_HOST : $session->metadata['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $session->metadata['email'];
        $mail->Password   = $session->metadata['password'];
        $mail->SMTPSecure = $encryption;
        $mail->Port       = $session->metadata['type'] == 'gmail' ? MailingController::$GMAIL_PORT : $session->metadata['port'];

        $mail->setFrom($session->metadata['email']);
        $mail->addAddress($to);
        $mail->Subject = $subject;

        if (Text::startsWith($body, 'view:')) {
            $view = explode(':', $body)[1];
            $body = View::make($body)->render();
        }
        $mail->Body    = $body;

        $mail->isHTML(true);

        try {
            $mail->send();
        } catch (\Throwable $th) {
            throw new Exception($mail->ErrorInfo);
        }
    }
}
