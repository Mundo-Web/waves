<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class History extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'session_id',
        'template_id',
        'business_id',
        'name',
        'description',
        'type',
        'mapping',
        'triggered',
        'completed',
        'failed',
        'total',
        'status'
    ];

    protected $casts = [
        'mapping' => 'array',
    ];
}
