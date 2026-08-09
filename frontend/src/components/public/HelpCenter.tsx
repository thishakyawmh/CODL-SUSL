import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Search, HelpCircle, BookOpen, FileText, Calendar,
    RefreshCw, Mail, UserPlus, AlertTriangle, Info, CheckCircle
} from 'lucide-react';
import './HelpCenter.css';

interface Guide {
    id: string;
    title: string;
    desc: string;
    icon: any;
    color: string;
    videoId: string;
    intro: string;
    notes?: string[];
    tips?: string[];
}

export const HelpCenter: React.FC = () => {
    const { guideId } = useParams<{ guideId?: string }>();

    // Persist language state dynamically using sessionStorage
    const [lang, setLang] = useState<'en' | 'si'>('si'); // Defaulting to Sinhala

    const [searchTerm, setSearchTerm] = useState('');

    const handleLangChange = (newLang: 'en' | 'si') => {
        setLang(newLang);
        sessionStorage.setItem('help_lang', newLang);
    };

    const branding = {
        logo: '/images/logo.png',
        institution: lang === 'en' ? 'Centre for Open & Distance Learning' : 'බාහිර හා දුරස්ථ අධ්‍යාපන මධ්‍යස්ථානය',
        university: lang === 'en' ? 'Sabaragamuwa University of Sri Lanka' : 'ශ්‍රී ලංකා සබරගමුව විශ්වවිද්‍යාලය',
        title: lang === 'en' ? 'CODL Student Help Center' : 'CODL ශිෂ්‍ය උපකාරක මධ්‍යස්ථානය',
        subtitle: lang === 'en' 
            ? 'Access step-by-step guides and documentation to navigate the educational portals easily.'
            : 'පාඨමාලා සහ විභාග ද්වාරයන් පහසුවෙන් භාවිතා කිරීමට උපදෙස් සහ පියවරෙන් පියවර මාර්ගෝපදේශ මෙතැනින් ලබාගන්න.',
        searchPlaceholder: lang === 'en' ? 'Search for guides, processes...' : 'මාර්ගෝපදේශ, ක්‍රියාවලීන් සොයන්න...',
        langLabel: lang === 'en' ? 'Language' : 'භාෂාව',
        backLabel: lang === 'en' ? 'Back to Login' : 'නැවත පුරනය වීමට',
        backToHubLabel: lang === 'en' ? 'Back to Help Center' : 'නැවත උපකාරක මධ්‍යස්ථානයට',
        categoriesTitle: lang === 'en' ? 'Guide Categories (Sinhala)' : 'මාර්ගෝපදේශ කාණ්ඩ',
        stepLabel: lang === 'en' ? 'Step' : 'පියවර',
        notesLabel: lang === 'en' ? 'Important Notes' : 'වැදගත් සටහන්',
        tipsLabel: lang === 'en' ? 'Helpful Tips' : 'ප්‍රයෝජනවත් උපදෙස්',
        noResults: lang === 'en' ? 'No guides match your search criteria.' : 'ඔබ සෙවූ තොරතුරු වලට ගැළපෙන උපදෙස් හමුනොවීය.',
        viewGuideLabel: lang === 'en' ? 'Watch Guide Video' : 'වීඩියෝව නරඹන්න'
    };

    // Main guide database structured in Sinhala with real video mappings
    const guides: Guide[] = [
        {
            id: 'create-account',
            title: 'ගිණුමක් සාදා ගන්නා ආකාරය',
            desc: 'අයදුම්කරුගේ නව ගිණුම සකසා සක්‍රිය කරන ආකාරය',
            icon: UserPlus,
            color: '#7C3AED',
            videoId: 'ezbJwaLmOeM', // Real testing video id
            intro: 'CODL ශිෂ්‍ය පහසුකම් භාවිතා කිරීමට සහ අයදුම්පත් ඉදිරිපත් කිරීමට, ඔබ ආරක්ෂිත පුද්ගලික ද්වාරයක් සෑදිය යුතුය. මේ සඳහා පහත වීඩියෝ මාර්ගෝපදේශය නරඹන්න.',
            notes: [
                'ලියාපදිංචි වීමේදී සැමවිටම ඔබගේ සක්‍රීය පුද්ගලික Gmail ගිණුම භාවිතා කරන්න.',
                'ආයතනික නිවේදන සියල්ල ඔබගේ මෙම විද්‍යුත් තැපෑලට එවනු ලැබේ.'
            ]
        },
        {
            id: 'course-registration',
            title: 'පාඨමාලාවකට ලියාපදිංචි වන ආකාරය',
            desc: 'පවතින අධ්‍යයන පාඨමාලා සඳහා අයදුම් කරන ආකාරය',
            icon: BookOpen,
            color: '#3B82F6',
            videoId: '', // Handled gracefully
            intro: 'බාහිර හා දුරස්ථ අධ්‍යාපන මධ්‍යස්ථානය මඟින් පිරිනමනු ලබන නව උපාධි, ඩිප්ලෝමා හෝ සහතික පත්‍ර පාඨමාලාවකට ලියාපදිංචි වීමට අදාළ උපදෙස් මාලාව පහත වීඩියෝවෙන් නරඹන්න.',
            notes: [
                'අයදුම්පත පුරවා අවසානයේ සහතික කරන ලද සාමාන්‍ය පෙළ සහ උසස් පෙළ සහතික පත් උඩුගත කරන්න.'
            ]
        },
        {
            id: 'exam-application',
            title: 'විභාගයක් සඳහා අයදුම් කරන ආකාරය',
            desc: 'වාර අවසාන විභාග ඇගයීම් සඳහා අයදුම්පත් ඉදිරිපත් කරන ආකාරය',
            icon: FileText,
            color: '#10B981',
            videoId: '', // Handled gracefully
            intro: 'ශිෂ්‍යයන් අධ්‍යයන කාලසීමාවන්ට පෙර තමන් ලියාපදිංචි විෂයයන් සඳහා වන විභාග අයදුම්පත් ඉදිරිපත් කිරීමේ ක්‍රියාවලිය පහත වීඩියෝවෙන් නරඹන්න.',
            notes: [
                'විභාගය සඳහා අවම වශයෙන් 80% ක පැමිණීමේ ප්‍රතිශතයක් සපුරා තිබිය යුතුය.'
            ]
        },
        {
            id: 'postponement-request',
            title: 'විභාගය කල් දැමීම සඳහා ඉල්ලීමක් කරන ආකාරය',
            desc: 'හදිසි අවස්ථාවන් හේතුවෙන් විභාග කල් දැමීම සඳහා ඉල්ලුම් කරන ආකාරය',
            icon: Calendar,
            color: '#F59E0B',
            videoId: '', // Handled gracefully
            intro: 'වෛද්‍යමය හේතූන් හෝ හදිසි පුද්ගලික අවශ්‍යතාවක් නිසා විභාගයකට පෙනී සිටීමට නොහැකි නම්, නිල කල් දැමීමේ ඉල්ලීමක් ඉදිරිපත් කිරීමේ ක්‍රියාවලිය පහත වීඩියෝවෙන් නරඹන්න.',
            notes: [
                'විභාගයට පෙනී නොසිටීමට හේතුව සනාථ කරන රජයේ ලියාපදිංචි වෛද්‍ය සහතිකය අයදුම්පත සමඟ ඉදිරිපත් කරන්න.'
            ]
        },
        {
            id: 'reattempt-request',
            title: 'නැවත විභාගයට පෙනී සිටීම සඳහා ඉල්ලීමක් කරන ආකාරය',
            desc: 'අසමත් වූ විෂයයන් සඳහා නැවත විභාග අයදුම් කරන ආකාරය',
            icon: RefreshCw,
            color: '#EC4899',
            videoId: '', // Handled gracefully
            intro: 'අධ්‍යයන ශ්‍රේණි වැඩි දියුණු කිරීම සඳහා අසමත් වූ විෂයයන් හෝ නැවත වාර සඳහා නැවත අයදුම් කිරීමේ පියවර පහත වීඩියෝවෙන් නරඹන්න.',
            notes: [
                'නැවත පෙනී සිටින සෑම විෂයයක් සඳහාම නියමිත ගාස්තුව බැංකුවට ගෙවා ලදුපත උඩුගත කරන්න.'
            ]
        },
        {
            id: 'letter-request',
            title: 'නිල ලිපි සඳහා ඉල්ලීමක් කරන ආකාරය',
            desc: 'ශිෂ්‍යභාවය තහවුරු කිරීමේ හෝ වීසා සහාය ලිපි ලබාගන්නා ආකාරය',
            icon: Mail,
            color: '#10B981',
            videoId: '', // Handled gracefully
            intro: 'ශිෂ්‍යභාවය තහවුරු කිරීමේ ලිපි, වීසා ආධාරක ලිපි හෝ විභාග සත්‍යාපන ලිපි වැනි නිල පරිපාලන ලිපි ඉල්ලා සිටීමේ ක්‍රියාවලිය පහත වීඩියෝවෙන් නරඹන්න.',
            notes: [
                'ඉල්ලුම් කරන ලද ලිපිය සූදානම් කිරීමට සාමාන්‍යයෙන් වැඩ කරන දින 2-3ක් ගතවේ.'
            ]
        }
    ];

    const currentGuide = guideId ? guides.find(g => g.id === guideId) : null;

    const filteredGuides = guides.filter(g => {
        return !searchTerm ||
            g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.desc.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="help-center-page">
            {/* Header Layout matches application layout */}
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
                   STATE B: GUIDE DETAIL PAGE (VIDEO BASED)
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
                                <h1>{currentGuide.title}</h1>
                                <p className="hc-detail-desc">{currentGuide.desc}</p>
                            </div>
                        </div>

                        <div className="hc-detail-content">
                            <p className="hc-intro-text">{currentGuide.intro}</p>

                            {/* Embed Video Player */}
                            {currentGuide.videoId ? (
                                <div className="hc-video-container">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${currentGuide.videoId}`}
                                        title={currentGuide.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            ) : (
                                <div className="hc-no-video-alert">
                                    <AlertTriangle size={28} />
                                    <p>මෙම මාර්ගෝපදේශය සඳහා වන උපදෙස් වීඩියෝව දැනට සූදානම් වෙමින් පවතී.</p>
                                </div>
                            )}

                            {currentGuide.notes && currentGuide.notes.length > 0 && (
                                <div className="hc-info-box note">
                                    <div className="hc-info-box-header">
                                        <Info size={16} />
                                        <h6>{branding.notesLabel}</h6>
                                    </div>
                                    <ul>
                                        {currentGuide.notes.map((n, i) => <li key={i}>{n}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* =========================================================
                   STATE A: HELP CENTER LANDING HUB (SINHALA CARDS GRID ONLY)
                   ========================================================= */
                <>
                    {/* Hero Section */}
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

                    {/* Guide categories displayed in Sinhala only */}
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
                                        <h4>{guide.title}</h4>
                                        <p>{guide.desc}</p>
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
