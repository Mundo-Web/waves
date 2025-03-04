<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('histories', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();

            $table->foreignUuid('session_id')->constrained('sessions');
            $table->foreignUuid('template_id')->constrained('templates');
            $table->string('name');
            $table->longText('description')->nullable();
            $table->string('type');
            $table->json('mapping');
            $table->boolean('triggered')->default(false);
            $table->integer('completed')->default(false);
            $table->integer('failed')->default(false);
            $table->integer('total')->default(false);
            $table->boolean('status')->nullable()->default(null);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('histories');
    }
};
