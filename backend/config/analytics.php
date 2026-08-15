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
            'ansible', 'terraform', 'containers', 'github actions', 'yaml', 'chef', 
            'puppet', 'helm', 'gitlab ci', 'vagarant', 'nagios', 'prometheus', 
            'grafana', 'cloudformation', 'continuous integration', 'continuous deployment', 
            'platform engineering', 'site reliability engineering', 'sre', 
            'infrastructure as code', 'iac', 'argocd', 'circleci'
        ],
        
        'Artificial Intelligence' => [
            'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 
            'neural networks', 'nlp', 'natural language', 'computer vision', 'pytorch', 
            'tensorflow', 'keras', 'scikit-learn', 'llm', 'large language models', 
            'reinforcement learning', 'transformers', 'gpt', 'image processing', 
            'object detection', 'supervised learning', 'unsupervised learning', 
            'generative ai', 'hugging face', 'artificial neural network', 'ann', 'cnn', 'rnn'
        ],
        
        'Cloud Computing' => [
            'cloud', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 
            'serverless', 'cloud infrastructure', 'cloud deployment', 'ec2', 's3', 
            'lambda', 'virtual machines', 'virtualization', 'cloud security', 
            'cloud architecture', 'hybrid cloud', 'multi-cloud', 'openstack', 
            'cloud engineering', 'cloud storage'
        ],
        
        'Mobile Development' => [
            'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 
            'mobile development', 'mobile programming', 'mobile applications', 
            'objective-c', 'xcode', 'android studio', 'mobile app development', 
            'ionic', 'cordova', 'nativescript'
        ],
        
        'Cyber Security' => [
            'security', 'cybersecurity', 'information security', 'network security', 
            'cryptography', 'penetration testing', 'ethical hacking', 'firewall', 
            'vulnerability assessment', 'owasp', 'siem', 'soc', 'incident response', 
            'malware analysis', 'digital forensics', 'network monitoring', 
            'identity management', 'zero trust', 'cissp', 'ceh', 'risk assessment', 
            'secure coding'
        ],
        
        'Data Science' => [
            'data science', 'data analytics', 'data analysis', 'big data', 'pandas', 
            'numpy', 'sql', 'r programming', 'data visualization', 'power bi', 
            'tableau', 'data mining', 'spark', 'hadoop', 'statistical analysis', 
            'jupyter', 'data warehousing', 'matplotlib', 'seaborn', 'data pipelines', 'etl'
        ],
        
        'Web Development' => [
            'web development', 'frontend', 'backend', 'full stack', 'react', 'angular', 
            'vue', 'nodejs', 'php', 'laravel', 'html', 'css', 'javascript', 'typescript', 
            'expressjs', 'django', 'spring boot', 'asp.net', 'jquery', 'web applications', 
            'semantic html', 'css3', 'bootstrap', 'tailwind', 'web programming'
        ],
 
        'Business & Management' => [
            'business', 'management', 'mba', 'administration', 'hr', 'human resource', 
            'entrepreneurship', 'leadership', 'organizational behaviour', 'strategy',
            'organizations and behaviour', 'business environment', 'project management', 
            'agile', 'scrum', 'operation management', 'product management', 
            'strategic planning', 'human resources', 'organizational leadership', 
            'business administration'
        ],
 
        'Accounting & Finance' => [
            'accounting', 'finance', 'audit', 'taxation', 'banking', 'bookkeeping', 
            'financial resources', 'accounts', 'auditing', 'financial accounting', 
            'management accounting', 'corporate finance', 'financial analysis', 
            'quickbooks', 'tax law', 'cost accounting', 'financial statements', 
            'investment management'
        ],
 
        'Marketing' => [
            'marketing', 'digital marketing', 'advertising', 'sales', 'e-commerce', 
            'retail', 'consumer behavior', 'branding', 'social media marketing',
            'marketing principles', 'e-commerce fundamentals', 'seo', 
            'search engine optimization', 'market research', 'brand management', 
            'content marketing', 'google analytics', 'customer relationship management', 'crm'
        ],
 
        'Economics' => [
            'economics', 'macroeconomics', 'microeconomics', 'econometrics', 
            'finance economics', 'economic policy', 'game theory', 'development economics', 
            'economic analysis', 'market dynamics'
        ],
 
        'Psychology' => [
            'psychology', 'counseling', 'behavior', 'organizational behavior', 
            'mental health', 'cognitive psychology', 'social psychology', 
            'clinical psychology', 'human behavior', 'developmental psychology'
        ],
 
        'Media & Communication' => [
            'media', 'communication', 'journalism', 'public relations', 
            'digital communication', 'broadcasting', 'mass media', 'business communication', 
            'mass communication', 'social media', 'copywriting', 'media production', 'public speaking'
        ],
 
        'Mathematics & Statistics' => [
            'mathematics', 'statistics', 'math', 'actuarial', 'algebra', 'calculus', 
            'applied mathematics', 'financial mathematics', 'pure mathematics', 
            'business mathematics', 'business statistics', 'probability', 'linear algebra', 
            'numerical analysis', 'statistical modeling'
        ],
 
        'Law' => [
            'law', 'legal', 'jurisprudence', 'cyber law', 'digital rights', 'court',
            'ethics', 'human rights', 'e-business law', 'corporate law', 'contract law', 
            'commercial law', 'intellectual property', 'ip law'
        ],
 
        'Arts & Humanities' => [
            'arts', 'humanities', 'english', 'history', 'philosophy', 'language', 'literature',
            'creative writing', 'digital arts', 'animation', 'fine arts', 'graphic design', 
            'illustration', 'performing arts', 'sociology', 'anthropology'
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
