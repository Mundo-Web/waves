<?php

namespace App\Http\Controllers;

use App\Models\Session;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TemplateController extends BasicController
{
    public $model = Template::class;
    public $reactView = 'Templates';

    public function setReactViewProperties(Request $request)
    {
        $sessions = Session::where('business_id', Auth::user()->business_id)->get();
        return [
            'TINYMCE_KEY' => env('TINYMCE_KEY'),
            'sessions' => $sessions
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select([
            'id',
            'type',
            'name',
            'description',
            'created_at',
            'updated_at',
            'status'
        ]);
    }
}
