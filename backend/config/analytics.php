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
        ],

        'Computing & Information Technology' => [
            'computing', 'information technology', 'software', 'computer science', 'it',
            'programming', 'coding', 'computer programming', 'software development',
            'systems analysis', 'computer systems', 'information systems', 'ict',
            'operating systems', 'computer organisation', 'computer architecture',
            'object oriented', 'oop', 'software engineering', 'system design',
            'computer fundamentals', 'introduction to computing', 'computing fundamentals'
        ],

        'Network Engineering' => [
            'networking', 'network engineering', 'computer networks', 'network administration',
            'tcp/ip', 'routing', 'switching', 'cisco', 'network protocols', 'wan', 'lan',
            'network infrastructure', 'network design', 'network management', 'vpn',
            'network security', 'wireless networking', 'network troubleshooting',
            'network topology', 'data communications', 'telecommunications'
        ],

        'Database Management' => [
            'database', 'database management', 'database design', 'sql', 'mysql',
            'postgresql', 'oracle', 'mongodb', 'nosql', 'database administration',
            'dba', 'data modeling', 'relational database', 'database systems',
            'sql server', 'database engineering', 'data management', 'database programming'
        ],

        'System Administration' => [
            'system administration', 'linux', 'unix', 'windows server', 'bash',
            'shell scripting', 'active directory', 'server management', 'sysadmin',
            'operating system administration', 'virtualisation', 'virtualization',
            'server configuration', 'it infrastructure', 'system management'
        ],

        'UI/UX Design' => [
            'ui/ux', 'user interface', 'user experience', 'ux design', 'ui design',
            'figma', 'prototype', 'wireframe', 'usability', 'interaction design',
            'human computer interaction', 'hci', 'web design', 'product design',
            'design thinking', 'visual design', 'accessibility', 'interface design'
        ],

        'Software Testing & QA' => [
            'software testing', 'quality assurance', 'qa', 'test automation', 'selenium',
            'unit testing', 'integration testing', 'system testing', 'test driven development',
            'tdd', 'bdd', 'performance testing', 'load testing', 'manual testing',
            'bug tracking', 'software quality', 'test management', 'testing methodology'
        ],

        'Emerging Technologies' => [
            'iot', 'internet of things', 'blockchain', 'cryptocurrency', 'smart contracts',
            'augmented reality', 'ar', 'virtual reality', 'vr', 'mixed reality',
            'robotics', 'automation', 'edge computing', 'quantum computing',
            '5g', 'digital transformation', 'industry 4.0', 'embedded systems'
        ],
        'Agriculture' => [
            'agriculture', 'farming', 'agronomy', 'crop science', 'soil science', 
            'horticulture', 'livestock', 'animal husbandry', 'farm management', 
            'agribusiness', 'pest management', 'post-harvest', 'irrigation',
            'agricultural', 'crop', 'plant', 'animal', 'soil', 'forestry', 'farm'
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
    | Maps professional career titles to required knowledge domain AREAS.
    | These domains are verified against curriculum subject names via the
    | synonyms dictionary - only what can be confirmed from subject titles is used.
    | Readiness % = matched domains / total required domains.
    | Only the top 5 missing knowledge areas are shown in the UI.
    |
    */
    'career_paths' => [

        // IT & Software Engineering
        'Cloud Engineer' => [
            'Cloud Computing',
            'DevOps',
            'Network Engineering',
            'Cyber Security',
            'Database Management',
            'System Administration',
            'Computing & Information Technology',
            'Mathematics & Statistics',
            'Emerging Technologies',
        ],

        'Software Developer' => [
            'Web Development',
            'Computing & Information Technology',
            'Database Management',
            'Software Testing & QA',
            'Network Engineering',
            'Cyber Security',
            'UI/UX Design',
            'Mobile Development',
            'Mathematics & Statistics',
        ],

        'Cybersecurity Specialist' => [
            'Cyber Security',
            'Network Engineering',
            'Computing & Information Technology',
            'System Administration',
            'Cloud Computing',
            'Database Management',
            'Mathematics & Statistics',
            'Emerging Technologies',
        ],

        'Data Scientist' => [
            'Data Science',
            'Artificial Intelligence',
            'Mathematics & Statistics',
            'Database Management',
            'Computing & Information Technology',
            'Cloud Computing',
            'Web Development',
            'Software Testing & QA',
        ],

        'Mobile App Developer' => [
            'Mobile Development',
            'UI/UX Design',
            'Web Development',
            'Computing & Information Technology',
            'Database Management',
            'Cloud Computing',
            'Cyber Security',
            'Emerging Technologies',
        ],

        'AI / ML Engineer' => [
            'Artificial Intelligence',
            'Data Science',
            'Mathematics & Statistics',
            'Computing & Information Technology',
            'Cloud Computing',
            'Database Management',
            'Software Testing & QA',
            'Web Development',
            'Emerging Technologies',
        ],

        'DevOps Engineer' => [
            'DevOps',
            'Cloud Computing',
            'System Administration',
            'Network Engineering',
            'Cyber Security',
            'Computing & Information Technology',
            'Software Testing & QA',
            'Database Management',
            'Emerging Technologies',
        ],

        // Business & Management
        'HR Manager' => [
            'Business & Management',
            'Psychology',
            'Law',
            'Economics',
            'Mathematics & Statistics',
            'Media & Communication',
        ],

        'Management Consultant' => [
            'Business & Management',
            'Economics',
            'Mathematics & Statistics',
            'Accounting & Finance',
            'Media & Communication',
            'Marketing',
            'Data Science',
        ],

        'Project Manager' => [
            'Business & Management',
            'Computing & Information Technology',
            'Mathematics & Statistics',
            'Economics',
            'Media & Communication',
            'Software Testing & QA',
        ],

        // Marketing & Media
        'Marketing Specialist' => [
            'Marketing',
            'Media & Communication',
            'Business & Management',
            'Economics',
            'Data Science',
            'UI/UX Design',
        ],

        'Digital Marketer' => [
            'Marketing',
            'Web Development',
            'Media & Communication',
            'Data Science',
            'UI/UX Design',
            'Business & Management',
        ],

        // Finance
        'Corporate Accountant' => [
            'Accounting & Finance',
            'Economics',
            'Business & Management',
            'Mathematics & Statistics',
            'Law',
            'Data Science',
        ],

        'Investment Banker' => [
            'Accounting & Finance',
            'Economics',
            'Mathematics & Statistics',
            'Business & Management',
            'Data Science',
            'Law',
        ],

        // Law
        'Corporate Lawyer' => [
            'Law',
            'Business & Management',
            'Economics',
            'Media & Communication',
            'Psychology',
        ],

        // Agriculture
        'Agricultural Manager' => [
            'Agriculture',
            'Business & Management',
            'Economics',
            'Mathematics & Statistics',
            'Data Science',
        ],
        
        'Agronomist / Agricultural Consultant' => [
            'Agriculture',
            'Business & Management',
            'Economics',
            'Media & Communication',
        ],

        'Agribusiness Manager' => [
            'Agriculture',
            'Business & Management',
            'Accounting & Finance',
            'Economics',
            'Marketing',
        ],

        'Precision Agriculture Specialist' => [
            'Agriculture',
            'Computing & Information Technology',
            'Emerging Technologies',
            'Data Science',
            'Mathematics & Statistics',
        ],

        'Food Security Analyst' => [
            'Agriculture',
            'Economics',
            'Data Science',
            'Mathematics & Statistics',
        ],

        // Communication
        'Public Relations Officer' => [
            'Media & Communication',
            'Business & Management',
            'Marketing',
            'Psychology',
            'Arts & Humanities',
        ],

        // Mathematics
        'Statistician / Actuary' => [
            'Mathematics & Statistics',
            'Data Science',
            'Accounting & Finance',
            'Economics',
            'Artificial Intelligence',
            'Computing & Information Technology',
        ],

        // Education
        'Language Instructor' => [
            'Arts & Humanities',
            'Media & Communication',
            'Psychology',
        ],
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