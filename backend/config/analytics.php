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
            'infrastructure as code', 'iac', 'argocd', 'circleci', 'kustomize', 
            'docker swarm', 'podman', 'openshift', 'fluxcd', 'travis ci', 
            'bitbucket pipelines', 'saltstack', 'packer', 'vagrant', 'datadog', 
            'splunk', 'elk stack', 'logstash', 'kibana', 'opentelemetry', 
            'jaeger', 'chaos engineering', 'gremlin', 'argo workflows', 'tekton', 
            'sonarqube', 'trivy', 'snyk', 'hashicorp vault', 'artifactory', 'nexus'
        ],
        
        'Artificial Intelligence' => [
            'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 
            'neural networks', 'nlp', 'natural language', 'computer vision', 'pytorch', 
            'tensorflow', 'keras', 'scikit-learn', 'llm', 'large language models', 
            'reinforcement learning', 'transformers', 'gpt', 'image processing', 
            'object detection', 'supervised learning', 'unsupervised learning', 
            'generative ai', 'hugging face', 'artificial neural network', 'ann', 'cnn', 'rnn',
            'langchain', 'llamaindex', 'vector databases', 'pinecone', 'milvus', 
            'chromadb', 'retrieval-augmented generation', 'rag', 'prompt engineering', 
            'stable diffusion', 'midjourney', 'speech recognition', 'whisper', 
            'autoencoder', 'gan', 'generative adversarial network', 'transfer learning', 
            'xgboost', 'lightgbm', 'random forest', 'support vector machine', 'mlops', 
            'mlflow', 'kubeflow', 'dvc', 'optuna', 'hyperparameter tuning', 
            'dimensionality reduction', 'pca', 'semantic search'
        ],
        
        'Cloud Computing' => [
            'cloud', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 
            'serverless', 'cloud infrastructure', 'cloud deployment', 'ec2', 's3', 
            'lambda', 'virtual machines', 'virtualization', 'cloud security', 
            'cloud architecture', 'hybrid cloud', 'multi-cloud', 'openstack', 
            'cloud engineering', 'cloud storage', 'fargate', 'dynamodb', 'rds', 
            'azure functions', 'google cloud run', 'blob storage', 'iam', 'cloudtrail', 
            'cloudwatch', 'azure active directory', 'gcp iam', 'vpc', 'virtual private cloud', 
            'cloud networking', 'route 53', 'api gateway', 'cloudfront', 'azure cdn', 
            'load balancer', 'auto-scaling', 'cloud migration', 'cloud cost management', 
            'cloud native', 'cloud computing fundamentals', 'heroku', 'netlify', 
            'vercel', 'digitalocean', 'firebase', 'cloud database', 'redshift', 
            'bigquery', 'snowflake'
        ],
        
        'Mobile Development' => [
            'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 
            'mobile development', 'mobile programming', 'mobile applications', 
            'objective-c', 'xcode', 'android studio', 'mobile app development', 
            'ionic', 'cordova', 'nativescript', 'mobile', 'mobile application development', 'mobile app',
            'swiftui', 'jetpack compose', 'cocoapods', 'gradle', 'flutter sdk', 
            'dart', 'mobile ui design', 'mobile ux', 'push notifications', 
            'firebase cloud messaging', 'core data', 'sqlite mobile', 'room database', 
            'mobile security', 'app store deployment', 'google play deployment', 
            'testflight', 'mobile analytics', 'expo cli', 'react navigation', 
            'offline-first', 'state management mobile', 'bloc pattern', 
            'mobile responsive design', 'mobile performance optimization', 
            'location services mobile', 'maps api mobile', 'camera api mobile', 
            'camera development mobile', 'bluetooth development mobile', 
            'in-app purchases', 'mobile devops', 'fastlane'
        ],
        
        'Cyber Security' => [
            'security', 'cybersecurity', 'information security', 'network security', 
            'cryptography', 'penetration testing', 'ethical hacking', 'firewall', 
            'vulnerability assessment', 'owasp', 'siem', 'soc', 'incident response', 
            'malware analysis', 'digital forensics', 'network monitoring', 
            'identity management', 'zero trust', 'cissp', 'ceh', 'risk assessment', 
            'secure coding', 'threat intelligence', 'metasploit', 'nmap', 'wireshark', 
            'burp suite', 'intrusion detection system', 'ids', 'intrusion prevention system', 
            'ips', 'encryption', 'decryption', 'ssl/tls', 'public key infrastructure', 
            'pki', 'multi-factor authentication', 'mfa', 'saml', 'oauth', 
            'dynamic application security testing', 'dast', 'static application security testing', 
            'sast', 'network scanning', 'log analysis', 'access control list', 
            'acl', 'disaster recovery', 'computer forensic', 'buffer overflow', 
            'cross-site scripting', 'sql injection', 'ransomware mitigation'
        ],
        
        'Data Science' => [
            'data science', 'data analytics', 'data analysis', 'big data', 'pandas', 
            'numpy', 'sql', 'r programming', 'data visualization', 'power bi', 
            'tableau', 'data mining', 'spark', 'hadoop', 'statistical analysis', 
            'jupyter', 'data warehousing', 'matplotlib', 'seaborn', 'data pipelines', 'etl',
            'apache spark', 'apache hadoop', 'pyspark', 'sql server', 'postgresql', 
            'mysql', 'oracle database', 'data quality', 'data cleaning', 'data wrangling', 
            'predictive modeling', 'descriptive statistics', 'hypothesis testing', 
            'time series analysis', 'regression analysis', 'classification analysis', 
            'clustering analysis', 'nosql databases', 'mongodb', 'cassandra', 
            'neo4j', 'graph databases', 'dbt', 'data mesh', 'data lake', 
            'data lakehouse', 'data integration', 'business intelligence', 
            'bi reporting', 'apache airflow', 'data architecture', 'data profiling'
        ],
        
        'Web Development' => [
            'web development', 'frontend', 'backend', 'full stack', 'react', 'angular', 
            'vue', 'nodejs', 'php', 'laravel', 'html', 'css', 'javascript', 'typescript', 
            'expressjs', 'django', 'spring boot', 'asp.net', 'jquery', 'web applications', 
            'semantic html', 'css3', 'bootstrap', 'tailwind', 'web programming', 'web', 'web technologies', 'web design',
            'nextjs', 'svelte', 'solidjs', 'graphql', 'rest api', 'api design', 
            'websocket', 'single page application', 'spa', 'server side rendering', 
            'ssr', 'static site generation', 'ssg', 'progressive web application', 
            'pwa', 'responsive web design', 'css grid', 'flexbox', 'web accessibility', 
            'a11y', 'web performance', 'lighthouse audit', 'webpack', 'vite', 
            'npm', 'yarn', 'pnpm', 'semantic web', 'web server', 'nginx', 
            'apache web server', 'database integration'
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
    | Career Path Role Mapping
    |--------------------------------------------------------------------------
    |
    | Maps standard professional career titles to the required academic domains.
    | Used to dynamically calculate student career path readiness scores.
    |
    */
    'career_paths' => [
        'Cloud Engineer' => ['Cloud Computing', 'DevOps'],
        'Data Scientist' => ['Data Science', 'Artificial Intelligence', 'Mathematics & Statistics'],
        'Software Developer' => ['Web Development', 'Computing & Information Technology'],
        'Cybersecurity Specialist' => ['Cyber Security', 'Computing & Information Technology'],
        'Mobile App Developer' => ['Mobile Development', 'Computing & Information Technology'],
        'HR Manager' => ['Business & Management', 'Psychology'],
        'Management Consultant' => ['Business & Management', 'Economics'],
        'Project Manager' => ['Business & Management', 'Computing & Information Technology'],
        'Marketing Specialist' => ['Marketing', 'Media & Communication'],
        'Digital Marketer' => ['Marketing', 'Web Development'],
        'Corporate Accountant' => ['Accounting & Finance'],
        'Investment Banker' => ['Accounting & Finance', 'Economics'],
        'Corporate Lawyer' => ['Law', 'Business & Management'],
        'Agricultural Manager' => ['Agriculture', 'Business & Management'],
        'Clinical Psychologist' => ['Psychology'],
        'Public Relations Officer' => ['Media & Communication', 'Business & Management'],
        'Statistician / Actuary' => ['Mathematics & Statistics', 'Data Science'],
        'Language Instructor' => ['Arts & Humanities']
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
