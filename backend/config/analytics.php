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
        'min_student_responses' => env('AI_MIN_STUDENT_RESPONSES', 10),
        'min_industry_responses' => env('AI_MIN_INDUSTRY_RESPONSES', 5),
        'min_relevance_score' => env('AI_MIN_RELEVANCE_SCORE', 0.5),
    ],

    'weights' => [
        'interest_match' => env('AI_WEIGHT_INTEREST_MATCH', 0.7),
        'keyword_similarity' => env('AI_WEIGHT_KEYWORD_SIMILERITY', 0.3),
    ],

];
