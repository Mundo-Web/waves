<?php

namespace App\Http\Controllers;

use App\Jobs\SendMessagesJob;
use App\Models\History;
use App\Models\Session;
use App\Models\Template;
use Illuminate\Http\Request;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Trace;

class HistoryController extends BasicController
{
    public $model = History::class;
    public $reactView = 'History';
    public $ignoreStatus4pagination = true;

    public function beforeSave(Request $request)
    {
        $mapping = JSON::parse($request->input('mapping'));
        $data = JSON::parse(file_get_contents($request->file('data')));

        $sessionJpa = Session::find($mapping['waves_send_with']);
        $templateJpa = Template::find($request->input('template_id'));

        return [
            'session_id' => $sessionJpa->id,
            'template_id' => $templateJpa->id,
            'name' => $templateJpa->name . ' - ' . Trace::getDate('mysql'),
            // 'description' => '',
            'type' => $sessionJpa->type,
            'mapping' => $mapping,
            'total' => count($data),
        ];
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        if (!$jpa->triggered) {
            $data = JSON::parse(file_get_contents($request->file('data')));
            SendMessagesJob::dispatchAfterResponse($jpa, $data);
        }
    }

    public function reSend(Request $request, $id)
    {
        $response = Response::simpleTryCatch(function () use ($id) {
            $jpa = $this->model::find($id);
            if (!$jpa->triggered) {
                SendMessagesJob::dispatchAfterResponse($jpa);
            }
        });
        return response($response->toArray(), $response->status);
    }
}
