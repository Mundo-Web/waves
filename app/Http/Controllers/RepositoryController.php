<?php

namespace App\Http\Controllers;

use App\Models\Repository;
use Illuminate\Http\Request;

class RepositoryController extends BasicController
{
    public $model = Repository::class;
    public $reactView = 'Repository';
    public $imageFields = ['file'];
    public $publicMedia = true;

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        return array_merge($jpa->toArray(), [
            'url' => 'TEMP/repository/' . $jpa->file,
        ]);
    }
}
