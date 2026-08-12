<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\AI\Models\StudentInterest;
use App\AI\Models\IndustryRequirement;
use App\AI\Models\RecommendationRule;
use App\AI\Models\AnalyticsCache;

use App\Models\User;
use App\Models\Course;
use App\Models\Category;

echo "User Count: " . User::count() . "\n";
echo "Course Count: " . Course::count() . "\n";
echo "Category Count: " . Category::count() . "\n";
echo "Student Interest Count: " . StudentInterest::count() . "\n";
echo "Industry Requirement Count: " . IndustryRequirement::count() . "\n";
echo "Recommendation Rule Count: " . RecommendationRule::count() . "\n";
echo "Analytics Cache Count: " . AnalyticsCache::count() . "\n";
