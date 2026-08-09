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
        ]
    ],

];
