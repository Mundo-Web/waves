<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Exception;
use Illuminate\Http\Request;
use PHPMailer\PHPMailer\PHPMailer;

class MailingController extends Controller
{
    static string $GMAIL_HOST = 'smtp.gmail.com';
    static int $GMAIL_PORT = 587;
    static string $GMAIL_ENCRYPTION = PHPMailer::ENCRYPTION_STARTTLS;

    public static function send(Session $session, $to, $subject, $body)
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
        // $mail->Body    = $body;
        $mail->Body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ping</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <div style="height: 4px; background-color: #3b82f6;"></div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px; text-align: left;">
              <h1 style="margin: 0; font-size: 24px; color: #333333;">Ping</h1>
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">Solo quería pasar a saludar. Avísame si necesitas algo.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: left; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; font-size: 14px; color: #888888;">Saludos,<br>Atalaya Waves</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

        $mail->isHTML(true);

        try {
            $mail->send();
        } catch (\Throwable $th) {
            throw new Exception($mail->ErrorInfo);
        }
    }
}
