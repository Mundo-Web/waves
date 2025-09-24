<?php

namespace App\Jobs;

use App\Http\Classes\EmailConfig;
use App\Http\Controllers\MailingController;
use App\Models\Atalaya\Business;
use App\Models\History;
use App\Models\HistoryDetail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Notification;
use App\Models\Session;
use App\Models\Template;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;
use PHPMailer\PHPMailer\PHPMailer;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Text;

class SendMessagesJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  private History $historyJpa;
  private array $rows;

  public function __construct(History $historyJpa, array $rows)
  {
    $this->historyJpa = $historyJpa;
    $this->rows = $rows;
  }

  public function handle()
  {
    $historyJpa = $this->historyJpa;
    try {
      $templateJpa = Template::find($historyJpa->template_id);
      $sessionJpa = Session::find($historyJpa->session_id);

      $historyJpa->triggered = true;
      $historyJpa->status = false;
      $historyJpa->save();

      if ($sessionJpa->type == 'Email') {
        $this->sendEmail($sessionJpa, $templateJpa, $historyJpa);
      }
      if ($sessionJpa->type == 'WhatsApp') {
        $this->sendWhatsApp($sessionJpa, $templateJpa, $historyJpa);
      }

      $historyJpa->completed = HistoryDetail::where('history_id', $historyJpa->id)->where('status', true)->count();
      $historyJpa->failed = HistoryDetail::where('history_id', $historyJpa->id)->where('status', false)->count();
      $historyJpa->status = true;
      $historyJpa->save();
    } catch (\Throwable $th) {
      dump($th->getMessage());
      $historyJpa->status = true;
      $historyJpa->save();
    }
  }

  public function sendEmail($sessionJpa, $templateJpa)
  {
    $historyJpa = $this->historyJpa;

    // // INICIO: SMTP Config
    // $encryption = PHPMailer::ENCRYPTION_STARTTLS;
    // if (
    //   $sessionJpa->metadata['type'] != 'gmail' &&
    //   $sessionJpa->metadata['encryption']
    // ) {
    //   $encryption = $sessionJpa->metadata['encryption'] == 'ssl'
    //     ? PHPMailer::ENCRYPTION_SMTPS
    //     : PHPMailer::ENCRYPTION_STARTTLS;
    // }
    // $mail = new PHPMailer(true);
    // $mail->isSMTP();
    // $mail->Host       = $sessionJpa->metadata['type'] == 'gmail' ? 'smtp.gmail.com' : $sessionJpa->metadata['host'];
    // $mail->SMTPAuth   = true;
    // $mail->Username   = $sessionJpa->metadata['email'];
    // $mail->Password   = $sessionJpa->metadata['password'];
    // $mail->SMTPSecure = $encryption;
    // $mail->Port       = $sessionJpa->metadata['type'] == 'gmail' ? 587 : $sessionJpa->metadata['port'];
    // if (!$mail->smtpConnect()) throw new Exception('No se pudo conectar a SMTP');
    // // FIN: SMTP Config

    foreach ($this->rows as $row) {
      $success = false;
      $error = 'Error desconocido';

      $emailField = $historyJpa->mapping['waves_send_to'];
      $email = $row[$emailField];

      try {
        $data = [];
        foreach ($templateJpa->vars as $var) {
          $data[$var] = $row[$historyJpa->mapping[$var]];
        }

        $html = Text::replaceData($templateJpa->content, $data);

        // $mail->setFrom($sessionJpa->metadata['email']);
        // $mail->addAddress($email);
        // $mail->Subject = $templateJpa->name;
        // $mail->Body = $html;
        // $mail->isHTML(true);
        // $mail->send();

        MailingController::send($sessionJpa, $email, $templateJpa->name, $html);

        $success = true;
        $error = null;

        $historyJpa->completed++;
      } catch (\Throwable $th) {
        $error = $th->getMessage();
        $historyJpa->failed++;
      } finally {
        // $mail->clearAddresses();
        $historyJpa->save();
        HistoryDetail::create([
          'history_id' => $historyJpa->id,
          'sent_to' => $email,
          'data' => $row,
          'status' => $success,
          'error' => $error,
        ]);
      }
    }
    // $mail->smtpClose();
  }

  public function sendWhatsApp($sessionJpa, $templateJpa)
  {
    $historyJpa = $this->historyJpa;

    foreach ($this->rows as $row) {
      $success = false;
      $error = 'Error desconocido';
      $phoneField = $historyJpa->mapping['waves_send_to'];
      $phone = Text::keep($row[$phoneField], '0123456789');

      try {
        $data = [];
        foreach ($templateJpa->vars as $var) {
          $data[$var] = $row[$historyJpa->mapping[$var]];
        }

        $content = Text::replaceData($templateJpa->content, $data);

        $businessJpa = Business::with(['person'])->find(Auth::user()->business_id);
        $instanceName = $businessJpa->person->document_number . '-' . $sessionJpa->id;

        // Determine if we should use sendMedia or sendText based on attachment
        if ($templateJpa->attachment) {
          $res = new Fetch(env('APP_URL') . '/' . $templateJpa->attachment);

          $mimetype = $res->contentType ?? 'application/octet-stream';
          $mediaType = 'document';
          if (str_starts_with($mimetype, 'image/')) {
            $mediaType = 'image';
          } else if (str_starts_with($mimetype, 'video/')) {
            $mediaType = 'video';
          }

          $body = [
            'number' => $phone,
            'mediatype' => $mediaType,
            'mimetype' => $mimetype,
            'caption' => $content,
            'media' => env('APP_URL') . '/' . $templateJpa->attachment,
            'fileName' => basename($templateJpa->attachment),
          ];

          $res = new Fetch(env('EVOAPI_URL') . '/message/sendMedia/' . $instanceName, [
            'method' => 'POST',
            'headers' => [
              'Content-Type' => 'application/json',
              'apikey' => $businessJpa->uuid
            ],
            'body' => $body
          ]);
        } else {
          $res = new Fetch(env('EVOAPI_URL') . '/message/sendText/' . $instanceName, [
            'method' => 'POST',
            'headers' => [
              'Content-Type' => 'application/json',
              'apikey' => $businessJpa->uuid
            ],
            'body' => [
              'number' => $phone,
              'text' => $content
            ]
          ]);
        }

        if (!$res->ok) {
          $data = JSON::parseable($res->text());
          throw new Exception(is_array($data['response']['message']) 
            ? implode(', ', $data['response']['message']) 
            : ($data['response']['message'] ?? 'Error desconocido'));
        }

        $success = true;
        $error = null;
      } catch (\Throwable $th) {
        $error = $th->getMessage();
      } finally {
        HistoryDetail::create([
          'history_id' => $historyJpa->id,
          'sent_to' => $phone,
          'data' => $row,
          'status' => $success,
          'error' => $error,
        ]);
      }
    }
  }
}
