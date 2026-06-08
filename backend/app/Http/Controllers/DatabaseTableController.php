<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseTableController extends Controller
{
    /**
     * Get list of all database tables and their row counts.
     */
    public function getTables(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized. Only Super Admin can manage tables.'], 403);
        }

        $tables = Schema::getTables();
        $result = [];
        
        // System tables to exclude/protect
        $excludeTables = [
            'migrations', 
            'failed_jobs', 
            'personal_access_tokens', 
            'sessions', 
            'cache', 
            'cache_locks', 
            'jobs', 
            'job_batches',
            'sqlite_sequence',
            'password_reset_tokens',
            'password_resets',
        ];

        foreach ($tables as $table) {
            $name = '';
            if (is_array($table)) {
                $name = $table['name'] ?? '';
            } elseif (is_object($table)) {
                $name = $table->name ?? '';
            } else {
                $name = (string)$table;
            }

            if (empty($name) || in_array($name, $excludeTables)) {
                continue;
            }
            
            try {
                $count = DB::table($name)->count();
            } catch (\Exception $e) {
                $count = 0;
            }

            $result[] = [
                'name' => $name,
                'rows_count' => $count
            ];
        }

        return response()->json($result);
    }

    /**
     * Get records of a specific table.
     */
    public function getTableData(Request $request, $tableName)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $excludeTables = [
            'migrations', 
            'failed_jobs', 
            'personal_access_tokens', 
            'sessions', 
            'cache', 
            'cache_locks', 
            'jobs', 
            'job_batches',
            'sqlite_sequence',
            'password_reset_tokens',
            'password_resets',
        ];

        if (in_array($tableName, $excludeTables)) {
            return response()->json(['message' => 'Access denied to this table.'], 403);
        }

        if (!Schema::hasTable($tableName)) {
            return response()->json(['message' => 'Table not found.'], 404);
        }

        // Limit to 200 rows for view safety
        $data = DB::table($tableName)->orderBy('id', 'desc')->limit(200)->get();
        $columns = Schema::getColumnListing($tableName);

        return response()->json([
            'table' => $tableName,
            'columns' => $columns,
            'data' => $data
        ]);
    }

    /**
     * Delete a record from a specific table.
     */
    public function deleteRecord(Request $request, $tableName, $id)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $excludeTables = [
            'migrations', 
            'failed_jobs', 
            'personal_access_tokens', 
            'sessions', 
            'cache', 
            'cache_locks', 
            'jobs', 
            'job_batches',
            'sqlite_sequence',
            'password_reset_tokens',
            'password_resets',
        ];

        if (in_array($tableName, $excludeTables)) {
            return response()->json(['message' => 'Access denied to delete from this table.'], 403);
        }

        if (!Schema::hasTable($tableName)) {
            return response()->json(['message' => 'Table not found.'], 404);
        }

        try {
            $deleted = DB::table($tableName)->where('id', $id)->delete();
            if ($deleted) {
                return response()->json(['message' => 'Record deleted successfully.']);
            } else {
                return response()->json(['message' => 'Record not found or already deleted.'], 404);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete record: ' . $e->getMessage()], 500);
        }
    }
}
