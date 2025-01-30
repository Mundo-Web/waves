<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use PHPMailer\PHPMailer\PHPMailer;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;

class SessionController extends BasicController
{
  public $model = Session::class;
  public $reactView = 'Session';
  public $gmailHost = 'smtp.gmail.com';
  public $gmailPort = 587;

  public function setReactViewProperties(Request $request)
  {
    $sessions = $this->model::where('business_id', Auth::user()->business_id)->get();
    return [
      'sessions' => $sessions
    ];
  }

  public function afterSave(Request $request, object $jpa, ?bool $isNew)
  {
    return $jpa;
  }

  public function verify(Request $request, string $id)
  {
    $mail = new PHPMailer(true);

    $response = Response::simpleTryCatch(function () use ($id, $mail) {

      $session = Session::find($id);

      if ($session->type == 'Email') {
        $mail->isSMTP();
        $mail->Host       = $session->metadata['type'] == 'gmail' ? 'smtp.gmail.com' : $session->metadata['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $session->metadata['email'];
        $mail->Password   = $session->metadata['password'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $session->metadata['type'] == 'gmail' ? 587 : $session->metadata['port'];

        if (!$mail->smtpConnect()) throw new Exception('No se pudo conectar a SMTP');

        $mail->smtpClose();
      } else {
        $res = new Fetch(env('WA_URL') . '/api/session/ping/' . $session->id);
        $data = $res->json();
        if (!$res->ok) throw new Exception($data['message'] ?? 'No se pudo verificar la sesión');
      }
    });

    return response($response->toArray(), $response->status);
  }

  public function ping(Request $request)
  {
    $response = Response::simpleTryCatch(function () use ($request) {
      $from = $request->input('from');
      $to = $request->input('to');

      if ($from && $to) {
        $mail = new PHPMailer(true);
        $session = Session::find($from);

        if ($session && $session->metadata['type'] == 'Email') {
          $mail->isSMTP();
          $mail->Host       = $session->metadata['type'] == 'gmail' ? $this->gmailHost : $session->metadata['host'];
          $mail->SMTPAuth   = true;
          $mail->Username   = $session->metadata['email'];
          $mail->Password   = $session->metadata['password'];
          $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
          $mail->Port       = $session->metadata['type'] == 'gmail' ? $this->gmailPort : $session->metadata['port'];

          $mail->setFrom($session->metadata['email']);
          $mail->addAddress($to);
          $mail->Subject = \env('APP_NAME') . ' - Ping';
          $mail->Body    = 'Pong';

          try {
            $mail->send();
          } catch (Exception $e) {
            throw new Exception('Error al enviar el correo: ' . $mail->ErrorInfo);
          }
        }
      }
    });

    return response($response->toArray(), $response->status);
  }
}
