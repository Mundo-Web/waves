<?php

namespace App\Jobs;

use App\Http\Classes\EmailConfig;
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
use PHPMailer\PHPMailer\PHPMailer;
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
    } catch (\Throwable $th) {
      dump($th->getMessage());
    }
  }

  public function sendEmail($sessionJpa, $templateJpa)
  {

    $historyJpa = $this->historyJpa;

    // INICIO: SMTP Config
    $mail = new PHPMailer(true);
    // $mail->SMTPDebug = SMTP::DEBUG_SERVER;
    $mail->isSMTP();
    $mail->Host       = $sessionJpa->metadata['type'] == 'gmail'
      ? 'smtp.gmail.com'
      : $sessionJpa->metadata['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $sessionJpa->metadata['email'];
    $mail->Password   = $sessionJpa->metadata['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $sessionJpa->metadata['type'] == 'gmail'
      ? 587
      : $sessionJpa->metadata['port'];
    if (!$mail->smtpConnect()) throw new Exception('No se pudo conectar a SMTP');
    // FIN: SMTP Config

    foreach ($this->rows as $row) {
      $success = false;
      $error = 'Error desconocido';
      try {
        $emailField = $historyJpa->mapping['waves_send_to'];

        $data = [];
        foreach ($templateJpa->vars as $value) {
          $data['{{' . $value . '}}'] = $row[$historyJpa->mapping[$value]];
        }

        $mail->addAddress($row[$emailField]);
        $mail->Subject = $templateJpa->name;
        $mail->Body = Text::replaceData($templateJpa->content, $data);
        $mail->isHTML(true);
        $mail->send();
        
        $success = true;
        $error = null;
      } catch (\Throwable $th) {
        $error = $th->getMessage();
      } finally {
        HistoryDetail::create([
          'history_id' => $historyJpa->id,
          'data' => $row,
          'status' => $success,
          'error' => $error,
        ]);
      }
    }
    $mail->smtpClose();

    $historyJpa->completed = HistoryDetail::where('history_id', $historyJpa->id)->where('status', true)->count();
    $historyJpa->failed = HistoryDetail::where('history_id', $historyJpa->id)->where('status', false)->count();
    $historyJpa->status = true;
    $historyJpa->save();
  }

  public function sendWhatsApp($sessionJpa, $templateJpa) {}
}
