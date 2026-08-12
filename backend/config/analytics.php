<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Semantic Synonym Dictionary
    |--------------------------------------------------------------------------
    |
    | This dictionary maps raw text keywords found in student and industry
    | surveys to standardized technology domains. It is used by the
    | AnalyticsNLPService for text normalization and deduplication.
    |
    */

    'synonyms' => [
        'DevOps' => [
            'docker', 'kubernetes', 'ci/cd', 'cicd', 'jenkins', 'devops', 'gitops', 
            'ansible', 'terraform', 'containers', 'github actions', 'yaml'
        ],
        
        'Artificial Intelligence' => [
            'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 
            'neural networks', 'nlp', 'natural language', 'computer vision', 'pytorch', 
            'tensorflow', 'keras'
        ],
        
        'Cloud Computing' => [
            'cloud', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 
            'serverless', 'cloud infrastructure', 'cloud deployment'
        ],
        
        'Mobile Development' => [
            'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 
            'mobile development', 'mobile programming', 'mobile applications'
        ],
        
        'Cyber Security' => [
            'security', 'cybersecurity', 'information security', 'network security', 
            'cryptography', 'penetration testing', 'ethical hacking', 'firewall'
        ],
        
        'Data Science' => [
            'data science', 'data analytics', 'data analysis', 'big data', 'pandas', 
            'numpy', 'sql', 'r programming', 'data visualization', 'power bi'
        ],
        
        'Web Development' => [
            'web development', 'frontend', 'backend', 'full stack', 'react', 'angular', 
            'vue', 'nodejs', 'php', 'laravel', 'html', 'css', 'javascript', 'typescript'
        ],

        'Business & Management' => [
            'business', 'management', 'mba', 'administration', 'hr', 'human resource', 
            'entrepreneurship', 'leadership', 'organizational behaviour', 'strategy',
            'organizations and behaviour', 'business environment'
        ],

        'Accounting & Finance' => [
            'accounting', 'finance', 'audit', 'taxation', 'banking', 'bookkeeping', 
            'financial resources', 'accounts', 'auditing'
        ],

        'Marketing' => [
            'marketing', 'digital marketing', 'advertising', 'sales', 'e-commerce', 
            'retail', 'consumer behavior', 'branding', 'social media marketing',
            'marketing principles', 'e-commerce fundamentals'
        ],

        'Economics' => [
            'economics', 'macroeconomics', 'microeconomics', 'econometrics', 'finance economics'
        ],

        'Psychology' => [
            'psychology', 'counseling', 'behavior', 'organizational behavior', 'mental health'
        ],

        'Media & Communication' => [
            'media', 'communication', 'journalism', 'public relations', 'digital communication',
            'broadcasting', 'mass media', 'business communication'
        ],

        'Mathematics & Statistics' => [
            'mathematics', 'statistics', 'math', 'actuarial', 'algebra', 'calculus', 
            'applied mathematics', 'financial mathematics', 'pure mathematics', 'business mathematics',
            'business statistics'
        ],

        'Law' => [
            'law', 'legal', 'jurisprudence', 'cyber law', 'digital rights', 'court',
            'ethics', 'human rights', 'e-business law'
        ],

        'Arts & Humanities' => [
            'arts', 'humanities', 'english', 'history', 'philosophy', 'language', 'literature',
            'creative writing', 'digital arts', 'animation', 'fine arts'
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Thresholds & Weights Configurations
    |--------------------------------------------------------------------------
    |
    */
    'thresholds' => [
        'min_student_responses' => env('AI_MIN_STUDENT_RESPONSES', 3),
        'min_industry_responses' => env('AI_MIN_INDUSTRY_RESPONSES', 1),
        'min_relevance_score' => env('AI_MIN_RELEVANCE_SCORE', 0.35),
        'core_gap_pct' => 15.0,
        'enhancement_pct' => 8.0,
    ],

    'weights' => [
        'interest_match' => env('AI_WEIGHT_INTEREST_MATCH', 0.7),
        'keyword_similarity' => env('AI_WEIGHT_KEYWORD_SIMILERITY', 0.3),
    ],

    /*
    |--------------------------------------------------------------------------
    | Dynamic Profile Classifiers (Sectors, Interests, Sub-disciplines)
    |--------------------------------------------------------------------------
    |
    | Used to dynamically map courses to relevant sectors, interests, and fields
    | by calculating keyword overlap against the course profile.
    |
    */
    'sectors' => [
        'Information Technology' => ['it', 'computer', 'software', 'technology', 'network', 'system', 'cloud', 'security', 'programming', 'code', 'data', 'devops', 'web', 'e-business', 'digital'],
        'Telecommunications' => ['telecom', 'network', 'mobile', 'wireless', 'satellite', 'routing', 'switching'],
        'Finance & Banking' => ['finance', 'banking', 'investment', 'accounting', 'audit', 'taxation', 'accounts', 'ledger'],
        'Tourism & Hospitality' => ['tourism', 'hospitality', 'hotel', 'travel', 'event', 'restaurant', 'resort'],
        'Creative Arts & Design' => ['graphic', 'design', 'art', 'arts', 'fine arts', 'creative', 'illustration', 'multimedia', 'animation'],
        'Marketing & Advertising' => ['marketing', 'advertising', 'sales', 'e-commerce', 'digital marketing', 'retail', 'brand', 'branding'],
        'Education' => ['education', 'teaching', 'school', 'university', 'pedagogy', 'elearning', 'english', 'languages'],
        'Media & Entertainment' => ['media', 'entertainment', 'journalism', 'communication', 'broadcasting', 'video', 'music'],
        'Agriculture & Forestry' => ['agriculture', 'agri', 'farming', 'crop', 'plant', 'animal', 'forestry', 'soil'],
        'Environmental Services' => ['environmental', 'ecology', 'nature', 'conservation', 'pollution'],
        'Management Consulting' => ['management', 'consulting', 'strategy', 'hr', 'human resource', 'advisory', 'business'],
        'Professional Services' => ['services', 'advisory', 'legal', 'law', 'translation']
    ],

    'academic_interests' => [
        'Computing & Information Technology' => ['computing', 'information technology', 'software', 'computer', 'it', 'programming', 'network', 'system', 'database', 'developer'],
        'Cloud Computing' => ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'infrastructure', 'virtualization'],
        'Data Science' => ['data science', 'analytics', 'big data', 'pandas', 'numpy', 'sql', 'r programming', 'power bi'],
        'Artificial Intelligence' => ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural networks', 'nlp'],
        'Web Development' => ['web', 'frontend', 'backend', 'full stack', 'react', 'vue', 'nodejs', 'php', 'laravel', 'html', 'css', 'javascript', 'e-business'],
        'Cyber Security' => ['security', 'cybersecurity', 'cryptography', 'firewall', 'penetration'],
        'DevOps' => ['devops', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'gitlab', 'terraform'],
        'Mobile Development' => ['android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 'mobile development'],
        'UI/UX Design' => ['ui/ux', 'user interface', 'user experience', 'figma', 'prototype', 'wireframe', 'design'],
        'Accounting & Finance' => ['accounting', 'finance', 'audit', 'taxation', 'banking', 'bookkeeping'],
        'Business & Management' => ['business', 'management', 'mba', 'administration', 'hr', 'human resource', 'entrepreneurship'],
        'Marketing' => ['marketing', 'digital marketing', 'advertising', 'sales', 'e-commerce'],
        'Economics' => ['economics', 'macroeconomics', 'microeconomics'],
        'Psychology' => ['psychology', 'counseling', 'behavior'],
        'Media & Communication' => ['media', 'communication', 'journalism', 'public relations'],
        'Mathematics & Statistics' => ['mathematics', 'statistics', 'math', 'actuarial', 'algebra'],
        'Law' => ['law', 'legal', 'jurisprudence'],
        'Arts & Humanities' => ['arts', 'humanities', 'english', 'history', 'philosophy', 'language', 'literature', 'creative writing'],
        'Agriculture' => ['agriculture', 'farming', 'crop', 'horticulture'],
        'Science' => ['science', 'chemistry', 'physics', 'biology', 'zoology', 'botany'],
        'Education' => ['education', 'teaching', 'pedagogy']
    ],

    /*
    |--------------------------------------------------------------------------
    | Outdated Legacy Technology Keywords
    |--------------------------------------------------------------------------
    |
    | Used by the curriculum gap analysis to identify subjects that teach
    | outdated/deprecated frameworks, programming languages or libraries.
    |
    */
    'legacy_keywords' => [
        'visual basic', 'flash', 'silverlight', 'cobol', 'dreamweaver', 'pascal', 'fortran'
    ],

];
