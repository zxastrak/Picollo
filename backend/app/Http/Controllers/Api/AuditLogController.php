<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name')
            ->orderByDesc('created_at');

        // Filter by user kalau diminta
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->action) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }

        return response()->json([
            'success' => true,
            'data'    => $query->paginate(20),
        ]);
    }
}