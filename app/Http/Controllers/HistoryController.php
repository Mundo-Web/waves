<?php

namespace App\Http\Controllers;

use App\Models\History;
use App\Models\Session;
use App\Models\Template;
use Illuminate\Http\Request;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class HistoryController extends BasicController
{
    public $model = History::class;
    public $reactView = 'History';

    public function beforeSave(Request $request)
    {
        $mapping = JSON::parse($request->input('mapping'));
        $data = JSON::parse(file_get_contents($request->file('data')));

        $sessionJpa = Session::find($mapping['waves_send_with']);
        $templateJpa = Template::find($request->input('template_id'));

        return [
            'name' => $templateJpa->name,
            // 'description' => '',
            'type' => $sessionJpa->type,
            'mapping' => $mapping,
            'total' => count($data),
        ];
    }
}
