<?php

use App\Http\Controllers\ApikeyController;
use App\Http\Controllers\ArchivedController;
use App\Http\Controllers\BasicController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\Controller;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\KPILeadsController;
use App\Http\Controllers\KPIProjectsController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProcessController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\SubdomainController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TypeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ViewController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get(
    'login',
    fn () => Auth::check()
        ? redirect('/home')
        : Inertia::render('Login', [
            'PUBLIC_RSA_KEY' => Controller::$PUBLIC_RSA_KEY,
            'NOCAPTCHA_SITEKEY' => env('NOCAPTCHA_SITEKEY'),
            'token' => csrf_token()
        ])
)->name('login');

Route::get('/', function (Request $request) {
    return redirect('/login');
});

Route::middleware('auth')->group(function () {
    Route::get('/home', [HomeController::class, 'reactView'])->name('Home.jsx');
    Route::get('/sessions', [SessionController::class, 'reactView'])->name('Sessions.jsx');
    Route::get('/clients', [ClientController::class, 'reactView'])->name('Clients.jsx');
    Route::get('/tasks', [TaskController::class, 'reactView'])->name('Tasks.jsx');
    Route::get('/leads', [LeadController::class, 'reactView'])->name('Leads.jsx');
    Route::get('/leads/{lead}', [LeadController::class, 'reactView'])->name('Leads.jsx');
    Route::get('/clients/{client}', [ClientController::class, 'reactView'])->name('Clients.jsx');
    Route::get('/archived', [ArchivedController::class, 'reactView'])->name('Archived.jsx');
    Route::get('/archived/{archived}', [ClientController::class, 'reactView'])->name('Archived.jsx');
    Route::get('/products', [ProductController::class, 'reactView'])->name('Products.jsx');
    Route::get('/processes', [ProcessController::class, 'reactView'])->name('Processes.jsx');
    Route::get('/views', [ViewController::class, 'reactView'])->name('Views.jsx');
    Route::get('/projects', [ProjectController::class, 'reactView'])->name('Projects.jsx');
    Route::get('/pages/{correlative}', [SubdomainController::class, 'reactView'])->name('Pages.jsx');
    Route::get('/users', [UserController::class, 'reactView'])->name('Users.jsx');
    Route::get('/roles', [RoleController::class, 'reactView'])->name('Roles.jsx');
    Route::get('/statuses', [StatusController::class, 'reactView'])->name('Statuses.jsx');
    Route::get('/apikeys', [ApikeyController::class, 'reactView'])->name('Apikeys.jsx');
    Route::get('/types', [TypeController::class, 'reactView'])->name('Types.jsx');
    Route::get('/settings', [SettingController::class, 'reactView'])->name('Settings.jsx');
});
