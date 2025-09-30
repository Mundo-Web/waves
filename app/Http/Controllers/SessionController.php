<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Business;
use App\Models\Session;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use PHPMailer\PHPMailer\PHPMailer;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class SessionController extends BasicController
{
  public $model = Session::class;
  public $reactView = 'Sessions';
  public $gmailHost = 'smtp.gmail.com';
  public $gmailPort = 587;

  public function setReactViewProperties(Request $request)
  {
    $sessions = $this->model::query()
      ->where('business_id', Auth::user()->business_id)
      ->whereNotNull('status')
      ->get();
    return [
      'sessions' => $sessions
    ];
  }

  public function afterSave(Request $request, object $jpa, ?bool $isNew)
  {
    return $jpa;
  }

  private function getProfile(array $session): array
  {
    return [
      'pushname' => $session['profileName'] ?? null,
      'profile' => $session['profilePicUrl'] ?? null,
      'me' => [
        'user'   => explode('@', $session['ownerJid'])[0] ?? null,
        'server' => explode('@', $session['ownerJid'])[1] ?? null,
      ],
      'count' => [
        'messages' => $session['_count']['Message'] ?? 0,
        'contacts' => $session['_count']['Contact'] ?? 0,
        'chats' => $session['_count']['Chat'] ?? 0
      ]
    ];
  }

  public function verify(Request $request, string $id)
  {
    $mail = new PHPMailer(true);

    $response = Response::simpleTryCatch(function () use ($id, $mail) {

      $session = Session::find($id);

      if ($session->type == 'Email') {
        $encryption = PHPMailer::ENCRYPTION_STARTTLS;
        if ($session->metadata['type'] != 'gmail' && $session->metadata['encryption']) {
          $encryption = $session->metadata['encryption'] == 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
        }

        $mail->isSMTP();
        $mail->Host       = $session->metadata['type'] == 'gmail' ? 'smtp.gmail.com' : $session->metadata['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $session->metadata['email'];
        $mail->Password   = $session->metadata['password'];
        $mail->SMTPSecure = $encryption;
        $mail->Port       = $session->metadata['type'] == 'gmail' ? 587 : $session->metadata['port'];

        if (!$mail->smtpConnect()) throw new Exception('No se pudo conectar a SMTP');

        $mail->smtpClose();
      } else {
        $businessJpa = Business::with(['person'])->find(Auth::user()->business_id);
        if (!$businessJpa) throw new Exception('Empresa no encontrada');

        $instanceName = $businessJpa->person->document_number . '-' . $session->id;
        $res = new Fetch(env('EVOAPI_URL') . '/instance/fetchInstances?instanceName=' . $instanceName, [
          'headers' => ['apikey' => $businessJpa->uuid]
        ]);

        $raw = $res->text();
        $data = JSON::parseable($raw);
        if (!$res->ok) {
          if ($data['response']['message'] === 'Unauthorized') {
            throw new Exception('No hay una sesión activa, escanee el QR');
          }
          throw new Exception($data['response']['message'] ?? 'Error al verificar WhatsApp');
        }
        if ($data[0]['connectionStatus'] !== 'open') throw new Exception('WhatsApp desconectado. Escanee el QR');
        $metadata = $this->getProfile($data[0]);
        $session->metadata = [
          'name' => $metadata['pushname'],
          'email' => $metadata['me']['user'] . '@' . $metadata['me']['server'],
          'phone' => $metadata['me']['user'],
        ];
        $session->save();
        return $metadata;
      }
    });

    return response($response->toArray(), $response->status);
  }

  public function ping(Request $request)
  {
    $response = Response::simpleTryCatch(function () use ($request) {
      $from = $request->input('from');
      $to = $request->input('to');

      if (!$from || !$to) throw new Exception('Envie todos los campos necesarios');

      $session = Session::find($from);

      if (!$session) throw new Exception('La sesion que intentas usar no existe');

      if ($session->type == 'Email') {
        MailingController::send($session, $to, $session->name . ' - Ping', 'view:mailing.ping');
      } else {
        $businessJpa = Business::with(['person'])->find(Auth::user()->business_id);
        if (!$businessJpa) throw new Exception('Empresa no encontrada');

        $instanceName = $businessJpa->person->document_number . '-' . $session->id;

        $res = new Fetch(env('EVOAPI_URL') . '/message/sendText/' . $instanceName, [
          'method' => 'POST',
          'headers' => [
            'Content-Type' => 'application/json',
            'apikey' => $businessJpa->uuid
          ],
          'body' => [
            'number' => $to,
            'text' => "¡Hola! 👋\nEste es un mensaje de prueba para confirmar que el servicio de WhatsApp está funcionando correctamente.\n> Mensaje automático de verificación"
          ]
        ]);

        if (!$res->ok) {
          $data = $res->json();
          throw new Exception($data['message'] ?? 'Ocurrio un error al enviar el ping');
        }
      }
    });

    return response($response->toArray(), $response->status);
  }

  public function delete(Request $request, string $id)
  {
    $response = Response::simpleTryCatch(function () use ($id) {
      $session = Session::find($id);
      if (!$session) throw new Exception('Sesión no encontrada');

      if ($session->type === 'WhatsApp') {
        $businessJpa = Business::with(['person'])->find(Auth::user()->business_id);
        if (!$businessJpa) throw new Exception('Empresa no encontrada');

        $instanceName = $businessJpa->person->document_number . '-' . $session->id;

        $res = new Fetch(env('EVOAPI_URL') . '/instance/delete/' . $instanceName, [
          'method' => 'DELETE',
          'headers' => ['apikey' => $businessJpa->uuid]
        ]);

        // if (!$res->ok) {
        //   $data = $res->json();
        //   throw new Exception($data['message'] ?? 'Error al eliminar la instancia de WhatsApp');
        // }
      }

      $session->update([
        'status' => null
      ]);
    });

    return response($response->toArray(), $response->status);
  }
}
