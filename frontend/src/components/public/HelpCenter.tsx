import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Search, HelpCircle, BookOpen, FileText, Calendar,
    RefreshCw, Mail, UserPlus, AlertTriangle, Info
} from 'lucide-react';
import './HelpCenter.css';

interface Guide {
    id: string;
    titleEn: string;
    titleSi: string;
    descEn: string;
    descSi: string;
    icon: any;
    color: string;
    videoId: string;
    introEn: string;
    introSi: string;
    notesEn?: string[];
    notesSi?: string[];
}

export const HelpCenter: React.FC = () => {
    const { guideId } = useParams<{ guideId?: string }>();

    // Persist language state dynamically using sessionStorage
    const [lang, setLang] = useState<'en' | 'si'>(() => {
        return (sessionStorage.getItem('help_lang') as 'en' | 'si') || 'en';
    });

    const [searchTerm, setSearchTerm] = useState('');

    const handleLangChange = (newLang: 'en' | 'si') => {
        setLang(newLang);
        sessionStorage.setItem('help_lang', newLang);
    };

    // UI interface and branding labels must ALWAYS remain in English
    const branding = {
        logo: '/images/logo.png',
        institution: 'Centre for Open & Distance Learning',
        university: 'Sabaragamuwa University of Sri Lanka',
        title: 'CODL Student Help Center',
        subtitle: 'Access step-by-step guides and documentation to navigate the educational portals easily.',
        searchPlaceholder: 'Search for guides, processes...',
        langLabel: 'Language',
        backLabel: 'Back to Login',
        backToHubLabel: 'Back to Help Center',
        categoriesTitle: 'Guide Categories',
        notesLabel: 'Important Notes',
        noResults: 'No guides match your search criteria.',
        viewGuideLabel: 'View Guide',
        videoAlertSi: 'මෙම මාර්ගෝපදේශය සඳහා වන උපදෙස් වීඩියෝව දැනට සූදානම් වෙමින් පවතී.',
        videoAlertEn: 'The instructional video for this guide is currently being prepared.'
    };

    // Main guide database structured with English and Sinhala content
    const guides: Guide[] = [
        {
            id: 'create-account',
            titleEn: 'Create an Account',
            titleSi: 'ගිණුමක් සාදා ගන්නා ආකාරය',
            descEn: 'Setup and activate your new applicant workspace',
            descSi: 'අයදුම්කරුගේ නව ගිණුම සකසා සක්‍රිය කරන ආකාරය',
            icon: UserPlus,
            color: '#7C3AED',
            videoId: 'ezbJwaLmOeM', // Provided testing video id
            introEn: 'To access CODL student features and submit applications, you need to create a secure personal portal. Watch the guide video below.',
            introSi: 'CODL ශිෂ්‍ය පහසුකම් භාවිතා කිරීමට සහ අයදුම්පත් ඉදිරිපත් කිරීමට, ඔබ ආරක්ෂිත පුද්ගලික ද්වාරයක් සෑදිය යුතුය. මේ සඳහා පහත වීඩියෝ මාර්ගෝපදේශය නරඹන්න.',
            notesEn: [
                'Always use your active personal Google Mail (Gmail) account for registration.',
                'System alerts and confirmations will be sent directly to your registered email address.'
            ],
            notesSi: [
                'ලියාපදිංචි වීමේදී සැමවිටම ඔබගේ සක්‍රීය පුද්ගලික Gmail ගිණුම භාවිතා කරන්න.',
                'ආයතනික නිවේදන සියල්ල ඔබගේ මෙම විද්‍යුත් තැපෑලට එවනු ලැබේ.'
            ]
        },
        {
            id: 'course-registration',
            titleEn: 'Register for a Course',
            titleSi: 'පාඨමාලාවකට ලියාපදිංචි වන ආකාරය',
            descEn: 'Search and apply for available academic programs',
            descSi: 'පවතින අධ්‍යයන පාඨමාලා සඳහා අයදුම් කරන ආකාරය',
            icon: BookOpen,
            color: '#3B82F6',
            videoId: '', // Handled gracefully
            introEn: 'View and enroll in new academic degrees, diplomas, or certificate programs offered by the Centre for Distance Learning. Watch the guide video below.',
            introSi: 'බාහිර හා දුරස්ථ අධ්‍යාපන මධ්‍යස්ථානය මඟින් පිරිනමනු ලබන නව උපාධි, ඩිප්ලෝමා හෝ සහතික පත්‍ර පාඨමාලාවකට ලියාපදිංචි වීමට අදාළ උපදෙස් මාලාව පහත වීඩියෝවෙන් නරඹන්න.',
            notesEn: [
                'Review all entry qualification prerequisites before starting your application.',
                'Upload certified, scanned copies of your school certificates and relevant documents.'
            ],
            notesSi: [
                'අයදුම්පත පුරවා අවසානයේ සහතික කරන ලද සාමාන්‍ය පෙළ සහ උසස් පෙළ සහතික පත් උඩුගත කරන්න.'
            ]
        },
        {
            id: 'exam-application',
            titleEn: 'Apply for an Examination',
            titleSi: 'විභාගයක් සඳහා අයදුම් කරන ආකාරය',
            descEn: 'Register for end-of-semester subject evaluations',
            descSi: 'වාර අවසාන විභාග ඇගයීම් සඳහා අයදුම්පත් ඉදිරිපත් කරන ආකාරය',
            icon: FileText,
            color: '#10B981',
            videoId: '',
            introEn: 'Students must register and apply for their registered subject examinations before academic deadlines. Watch the guide video below.',
            introSi: 'ශිෂ්‍යයන් අධ්‍යයන කාලසීමාවන්ට පෙර තමන් ලියාපදිංචි විෂයයන් සඳහා වන විභාග අයදුම්පත් ඉදිරිපත් කිරීමේ ක්‍රියාවලිය පහත වීඩියෝවෙන් නරඹන්න.',
            notesEn: [
                'Make sure you satisfy the minimum attendance requirements of 80% to be eligible.',
                'Late submissions after the deadline will not be accepted under any circumstances.'
            ],
            notesSi: [
                'විභාගය සඳහා අවම වශයෙන් 80% ක පැමිණීමේ ප්‍රතිශතයක් සපුරා තිබිය යුතුය.'
            ]
        },
        {
            id: 'postponement-request',
            titleEn: 'Submit a Postponement Request',
            titleSi: 'විභාගය කල් දැමීම සඳහා ඉල්ලීමක් කරන ආකාරය',
            descEn: 'Request exam deferrals due to medical or personal emergencies',
            descSi: 'හදිසි අවස්ථාවන් හේතුවෙන් විභාග කල් දැමීම සඳහා ඉල්ලුම් කරන ආකාරය',
            icon: Calendar,
            color: '#F59E0B',
            videoId: '',
            introEn: 'If you cannot sit for an exam due to serious medical issues or personal emergencies, request an official postponement. Watch the guide video below.',
            introSi: 'වෛද්‍යමය හේතූන් හෝ හදිසි පුද්ගලික අවශ්‍යතාවක් නිසා විභාගයකට පෙනී සිටීමට නොහැකි නම්, නිල කල් දැමීමේ ඉල්ලීමක් ඉදිරිපත් කිරීමේ ක්‍රියාවලිය පහත වීඩියෝවෙන් නරඹන්න.',
            notesEn: [
                'Upload a scanned copy of a valid Medical Certificate signed by a registered government practitioner.',
                'Approved postponements do not count as a failed attempt.'
            ],
            notesSi: [
                'විභාගයට පෙනී නොසිටීමට හේතුව සනාථ කරන රජයේ ලියාපදිංචි වෛද්‍ය සහතිකය අයදුම්පත සමඟ ඉදිරිපත් කරන්න.'
            ]
        },
        {
            id: 'reattempt-request',
            titleEn: 'Submit a Reattempt Request',
            titleSi: 'නැවත විභාගයට පෙනී සිටීම සඳහා ඉල්ලීමක් කරන ආකාරය',
            descEn: 'Re-register for repeat exams or semester completions',
            descSi: 'අසමත් වූ විෂයයන් සඳහා නැවත විභාග අයදුම් කරන ආකාරය',
            icon: RefreshCw,
            color: '#EC4899',
            videoId: '',
            introEn: 'Re-apply for failed subject modules or repeat exams to improve your academic grading. Watch the guide video below.',
            introSi: 'අධ්‍යයන ශ්‍රේණි වැඩි දියුණු කිරීම සඳහා අසමත් වූ විෂයයන් හෝ නැවත වාර සඳහා නැවත අයදුම් කිරීමේ පියවර පහත වීඩියෝවෙන් නරඹන්න.',
            notesEn: [
                'Ensure repeat registration fees are paid to the bank and upload the deposit slip receipt.',
                'Verify all repeating subject codes match your academic transcript record.'
            ],
            notesSi: [
                'නැවත පෙනී සිටින සෑම විෂයයක් සඳහාම නියමිත ගාස්තුව බැංකුවට ගෙවා ලදුපත උඩුගත කරන්න.'
            ]
        },
        {
            id: 'letter-request',
            titleEn: 'Request Official Letters',
            titleSi: 'නිල ලිපි සඳහා ඉල්ලීමක් කරන ආකාරය',
            descEn: 'Apply for status, visa, or examination verification letters',
            descSi: 'ශිෂ්‍යභාවය තහවුරු කිරීමේ හෝ වීසා සහාය ලිපි ලබාගන්නා ආකාරය',
            icon: Mail,
            color: '#10B981',
            videoId: '',
            introEn: 'Request student status confirmation letters, visa support letters, or examination results verification letters. Watch the guide video below.',
            introSi: 'ශිෂ්‍යභාවය තහවුරු කිරීමේ ලිපි, වීසා ආධාරක ලිපි හෝ විභාග සත්‍යාපන ලිපි වැනි නිල පරිපාලන ලිපි ඉල්ලා සිටීමේ ක්‍රියාවලිය පහත වීඩියෝවෙන් නරඹන්න.',
            notesEn: [
                'Processing and signature verification takes approximately 2-3 working days.',
                'State the target embassy or organization clearly in the remarks field.'
            ],
            notesSi: [
                'ඉල්ලුම් කරන ලද ලිපිය සූදානම් කිරීමට සාමාන්‍යයෙන් වැඩ කරන දින 2-3ක් ගතවේ.'
            ]
        }
    ];

    const currentGuide = guideId ? guides.find(g => g.id === guideId) : null;

    const filteredGuides = guides.filter(g => {
        const title = lang === 'en' ? g.titleEn : g.titleSi;
        const desc = lang === 'en' ? g.descEn : g.descSi;
        return !searchTerm ||
            title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            desc.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="help-center-page">
            {/* Header Layout matches application layout (Always English) */}
            <div className="help-center-header">
                <div className="hc-branding">
                    <img src={branding.logo} alt="Logo" className="hc-logo" />
                    <div className="hc-branding-text">
                        <h2>{branding.institution}</h2>
                        <p>{branding.university}</p>
                    </div>
                </div>

                <div className="hc-header-actions">
                    <div className="hc-lang-selector">
                        <label>{branding.langLabel}:</label>
                        <select 
                            value={lang} 
                            onChange={(e) => handleLangChange(e.target.value as 'en' | 'si')}
                            className="hc-lang-select"
                        >
                            <option value="en">English</option>
                            <option value="si">සිංහල</option>
                        </select>
                    </div>
                    {/* Always display standard navigation actions in the header, but hide Back to Login on guide detail pages */}
                    {!currentGuide && (
                        <Link to="/login" className="hc-back-btn">
                            <ArrowLeft size={16} /> {branding.backLabel}
                        </Link>
                    )}
                </div>
            </div>

            {currentGuide ? (
                /* =========================================================
                   STATE B: GUIDE DETAIL PAGE (ALWAYS ENGLISH CARD TITLE)
                   ========================================================= */
                <div className="hc-detail-wrapper fade-in-up">
                    <Link to="/help-center" className="hc-back-btn" style={{ marginBottom: '24px' }}>
                        <ArrowLeft size={16} /> {branding.backToHubLabel}
                    </Link>

                    <div className="hc-detail-card" style={{ borderTop: `6px solid ${currentGuide.color}` }}>
                        <div className="hc-detail-header">
                            <div className="hc-card-icon big" style={{ background: `${currentGuide.color}15`, color: currentGuide.color }}>
                                <currentGuide.icon size={28} />
                            </div>
                            <div>
                                {/* Detail page title must ALWAYS be English as required */}
                                <h1>{currentGuide.titleEn}</h1>
                                <p className="hc-detail-desc">{lang === 'en' ? currentGuide.descEn : currentGuide.descSi}</p>
                            </div>
                        </div>

                        <div className="hc-detail-content">
                            <p className="hc-intro-text">{lang === 'en' ? currentGuide.introEn : currentGuide.introSi}</p>

                            {/* Embed Video Player */}
                            {currentGuide.videoId ? (
                                <div className="hc-video-container">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${currentGuide.videoId}`}
                                        title={currentGuide.titleEn}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            ) : (
                                <div className="hc-no-video-alert">
                                    <AlertTriangle size={28} />
                                    <p>{lang === 'en' ? branding.videoAlertEn : branding.videoAlertSi}</p>
                                </div>
                            )}

                            {((lang === 'en' ? currentGuide.notesEn : currentGuide.notesSi) || []).length > 0 && (
                                <div className="hc-info-box note">
                                    <div className="hc-info-box-header">
                                        <Info size={16} />
                                        <h6>{branding.notesLabel}</h6>
                                    </div>
                                    <ul>
                                        {(lang === 'en' ? currentGuide.notesEn : currentGuide.notesSi)?.map((n, i) => (
                                            <li key={i}>{n}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* =========================================================
                   STATE A: HELP CENTER LANDING HUB
                   ========================================================= */
                <>
                    {/* Hero Section (Always English UI) */}
                    <div className="help-center-hero">
                        <h1>{branding.title}</h1>
                        <p>{branding.subtitle}</p>

                        <div className="hc-search-bar">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder={branding.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Guide categories (Titles & descriptions translate, Heading remains English) */}
                    <div className="help-center-content">
                        <h3>{branding.categoriesTitle}</h3>

                        <div className="hc-categories-grid">
                            {filteredGuides.map(guide => {
                                const IconComponent = guide.icon;
                                return (
                                    <Link 
                                        key={guide.id} 
                                        to={`/help-center/${guide.id}`}
                                        className="hc-category-link-card"
                                        style={{ borderLeft: `5px solid ${guide.color}` }}
                                    >
                                        <div className="hc-card-icon" style={{ background: `${guide.color}15`, color: guide.color }}>
                                            <IconComponent size={24} />
                                        </div>
                                        <h4>{lang === 'en' ? guide.titleEn : guide.titleSi}</h4>
                                        <p>{lang === 'en' ? guide.descEn : guide.descSi}</p>
                                        <div className="hc-card-action-row">
                                            <span>{branding.viewGuideLabel}</span>
                                            <ArrowRight size={16} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {filteredGuides.length === 0 && (
                            <div className="hc-empty-state">
                                <HelpCircle size={48} />
                                <p>{branding.noResults}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
