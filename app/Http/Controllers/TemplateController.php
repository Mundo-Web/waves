<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;

class TemplateController extends BasicController
{
    public $model = Template::class;
    public $reactView = 'Templates';

    public function setReactViewProperties(Request $request)
    {
        return [
            'TINYMCE_KEY' => \env('TINYMCE_KEY')
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
