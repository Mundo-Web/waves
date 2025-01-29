<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class SessionController extends BasicController
{
    public $model = Session::class;
    public $reactView = 'Session';

    public function setReactViewProperties(Request $request)
    {
        $sessions = $this->model::where('business_id', Auth::user()->business_id)->get();
        return [
            'sessions' => $sessions
        ];
    }
}
