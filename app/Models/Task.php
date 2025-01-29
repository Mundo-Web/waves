<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'model_id',
        'note_id',
        'name',
        'description',
        'ends_at',
        'status',
        'asignable',
        'type',
        'priority',
        'assigned_to'
    ];

    public function clientNote() {
        return $this->hasOne(ClientNote::class, 'id', 'note_id');
    }

    public function assigned()
    {
        return $this->hasOne(User::class, 'id', 'assigned_to');
    }
}
