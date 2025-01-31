<?php

namespace App\Http\Controllers;

use App\Models\Template;

class TemplateController extends BasicController
{
    public $model = Template::class;
    public $reactView = 'Templates';

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
