import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Search, HelpCircle, BookOpen, FileText, Calendar,
    RefreshCw, Mail, UserPlus, AlertTriangle, Info, CheckCircle
} from 'lucide-react';
import './HelpCenter.css';

interface GuideStep {
    number: number;
    text: string;
}

interface GuideContent {
    intro: string;
    steps: GuideStep[];
    notes: string[];
    tips?: string[];
    warnings?: string[];
}

interface Guide {
    id: string;
    title: string;
    desc: string;
    icon: any;
    color: string;
    content: GuideContent;
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
        categoriesTitle: lang === 'en' ? 'Guide Categories' : 'මාර්ගෝපදේශ කාණ්ඩ',
        stepLabel: lang === 'en' ? 'Step' : 'පියවර',
        notesLabel: lang === 'en' ? 'Important Notes' : 'වැදගත් සටහන්',
        tipsLabel: lang === 'en' ? 'Helpful Tips' : 'ප්‍රයෝජනවත් උපදෙස්',
        warningsLabel: lang === 'en' ? 'Critical Warnings' : 'अත්‍යවශ්‍ය අවවාද',
        noResults: lang === 'en' ? 'No guides match your search criteria.' : 'ඔබ සෙවූ තොරතුරු වලට ගැළපෙන උපදෙස් හමුනොවීය.',
        viewGuideLabel: lang === 'en' ? 'View Guide' : 'මාර්ගෝපදේශය බලන්න'
    };

    const guides: Guide[] = [
        {
            id: 'create-account',
            title: lang === 'en' ? 'Create an Account' : 'ගිණුමක් සාදන්න',
            desc: lang === 'en' ? 'Setup and activate your new applicant workspace' : 'ඔබගේ අයදුම්කරුගේ නව ගිණුම සකසා සක්‍රිය කරන්න',
            icon: UserPlus,
            color: '#7C3AED',
            content: {
                intro: lang === 'en' 
                    ? 'To access CODL student features and submit applications, you need to create a secure personal portal.'
                    : 'CODL ශිෂ්‍ය පහසුකම් භාවිතා කිරීමට සහ අයදුම්පත් ඉදිරිපත් කිරීමට, ඔබ ආරක්ෂිත පුද්ගලික ද්වාරයක් සෑදිය යුතුය.',
                steps: [
                    { number: 1, text: lang === 'en' ? 'Click on the "New Applicants" option on the CODL landing portal.' : 'CODL මුල් පිටුවේ ඇති "New Applicants" තෝරන්න.' },
                    { number: 2, text: lang === 'en' ? 'Click on the "Sign in with Google" button.' : '"Sign in with Google" බොත්තම ක්ලික් කරන්න.' },
                    { number: 3, text: lang === 'en' ? 'Authenticate using your active Gmail address.' : 'ඔබගේ සක්‍රීය Gmail ලිපිනය භාවිතා කර ඔබව සත්‍යාපනය කරන්න.' },
                    { number: 4, text: lang === 'en' ? 'Fill in the profile creation form with your accurate national details (NIC, phone number).' : 'ඔබගේ නිවැරදි ජාතික තොරතුරු (ජා.හැ.අංකය, දුරකථන) සමඟ පැතිකඩ පෝරමය පුරවන්න.' },
                    { number: 5, text: lang === 'en' ? 'Complete the validation to activate your applicant workspace.' : 'ඔබගේ අයදුම්කරුගේ ගිණුම සක්‍රිය කිරීමට තහවුරු කිරීමේ පියවර සම්පූර්ණ කරන්න.' }
                ],
                notes: [
                    lang === 'en' ? 'Your email must match your primary email for institutional notifications.' : 'ආයතනික දැනුම්දීම් සඳහා ඔබගේ විද්‍යුත් තැපෑල නිවැරදිව ඇතුළත් කළ යුතුය.'
                ],
                tips: [
                    lang === 'en' ? 'Bookmark this portal URL to check your application status updates easily.' : 'පසුව ඔබගේ අයදුම්පතේ තත්ත්වය පරීක්ෂා කිරීම සඳහා මෙම සබැඳිය සුරැකීමට (Bookmark) මතක තබා ගන්න.'
                ],
                warnings: [
                    lang === 'en' ? 'Do not create duplicate applicant accounts; this will delay the verification process.' : 'අනුපිටපත් හෝ ව්‍යාජ අයදුම්කරු ගිණුම් සෑදීමෙන් වළකින්න; එය ඔබගේ සත්‍යාපන ක්‍රියාවලිය ප්‍රමාද කරනු ඇත.'
                ]
            }
        },
        {
            id: 'course-registration',
            title: lang === 'en' ? 'Register for a Course' : 'පාඨමාලාවක් සඳහා ලියාපදිංචි වන්න',
            desc: lang === 'en' ? 'Search and apply for available academic programs' : 'පවතින අධ්‍යයන පාඨමාලා සඳහා අයදුම් කරන්න',
            icon: BookOpen,
            color: '#3B82F6',
            content: {
                intro: lang === 'en'
                    ? 'Enroll in a new academic degree, diploma, or certificate program offered by the Centre for Distance Learning.'
                    : 'බාහිර හා දුරස්ථ අධ්‍යාපන මධ්‍යස්ථානය මඟින් පිරිනමනු ලබන නව උපාධි, ඩිප්ලෝමා හෝ සහතික පත්‍ර පාඨමාලාවකට ලියාපදිංචි වන්න.',
                steps: [
                    { number: 1, text: lang === 'en' ? 'Log into your Applicant Workspace.' : 'ඔබගේ අයදුම්කරුගේ ද්වාරයට පිවිසෙන්න.' },
                    { number: 2, text: lang === 'en' ? 'Navigate to "New Course Application" from your dashboard.' : 'උපකරණ පුවරුවේ (Dashboard) ඇති "New Course Application" වෙත යන්න.' },
                    { number: 3, text: lang === 'en' ? 'Search and select your preferred qualification tier (e.g. Degree, Diploma).' : 'ඔබ කැමති සුදුසුකම් මට්ටම (උදා: උපාධි, ඩිප්ලෝමා) සොයා තෝරාගන්න.' },
                    { number: 4, text: lang === 'en' ? 'Review eligibility prerequisites, duration, and batch intake deadlines.' : 'සුදුසුකම් සීමාවන්, කාලසීමාව සහ අයදුම්පත් කැඳවීමේ අවසන් දිනයන් සමාලෝචනය කරන්න.' },
                    { number: 5, text: lang === 'en' ? 'Fill in the online registration form and upload certified copies of OL/AL certificates.' : 'මාර්ගගත ලියාපදිංචි පෝරමය පුරවා, සහතික කරන ලද සා.පෙළ/උ.පෙළ සහතික පත් උඩුගත (Upload) කරන්න.' },
                    { number: 6, text: lang === 'en' ? 'Submit the form and wait for Secretary/Coordinator approval.' : 'අයදුම්පත ඉදිරිපත් කර ලේකම්/සම්බන්ධීකාරක අනුමැතිය ලැබෙන තෙක් රැඳී සිටින්න.' }
                ],
                notes: [
                    lang === 'en' ? 'Uploaded document copies must be clearly readable and verified.' : 'උඩුගත කරනු ලබන සහතික පත් පැහැදිලිව කියවිය හැකි සහ තහවුරු කරන ලද ඒවා විය යුතුය.'
                ],
                tips: [
                    lang === 'en' ? 'Check the status tracking section daily to see review stages.' : 'අනුමත කිරීමේ අදියර පරීක්ෂා කිරීම සඳහා දිනපතා ලුහුබැඳීමේ කොටස පරීක්ෂා කරන්න.'
                ]
            }
        },
        {
            id: 'exam-application',
            title: lang === 'en' ? 'Apply for an Examination' : 'විභාගයක් සඳහා අයදුම් කරන්න',
            desc: lang === 'en' ? 'Register for end-of-semester subject evaluations' : 'වාර අවසාන විභාග ඇගයීම් සඳහා අයදුම් කරන්න',
            icon: FileText,
            color: '#10B981',
            content: {
                intro: lang === 'en'
                    ? 'Students must register and apply for registered subject examinations before academic deadlines.'
                    : 'ශිෂ්‍යයන් අධ්‍යයන කාලසීමාවන්ට පෙර තමන් ලියාපදිංචි විෂයයන් සඳහා වන විභාග අයදුම්පත් ඉදිරිපත් කළ යුතුය.',
                steps: [
                    { number: 1, text: lang === 'en' ? 'Log into the Student Workspace.' : 'ශිෂ්‍ය ද්වාරය (Student Workspace) වෙත පිවිසෙන්න.' },
                    { number: 2, text: lang === 'en' ? 'Click on your active course card, then navigate to "Examinations" -> "Apply for Exams".' : 'ඔබගේ සක්‍රීය පාඨමාලා කාඩ්පත මත ක්ලික් කර "Examinations" -> "Apply for Exams" වෙත යන්න.' },
                    { number: 3, text: lang === 'en' ? 'Ensure you have met the minimum attendance requirements for eligibility.' : 'ඔබ අවම පැමිණීමේ ප්‍රතිශතය සපුරා ඇති බව සහතික කරගන්න.' },
                    { number: 4, text: lang === 'en' ? 'Select the specific subject codes and exam titles you intend to sit for.' : 'ඔබ පෙනී සිටීමට බලාපොරොත්තු වන අදාළ විෂය කේත සහ විභාග මාතෘකා තෝරන්න.' },
                    { number: 5, text: lang === 'en' ? 'Review the details, submit your examination application form, and save the confirmation receipt.' : 'තොරතුරු සමාලෝචනය කර විභාග අයදුම්පත ඉදිරිපත් කර, තහවුරු කිරීමේ ලදුපත සුරැකීමට පියවර ගන්න.' }
                ],
                notes: [
                    lang === 'en' ? 'Ensure you submit before the portal shuts down for the batch.' : 'අදාළ කණ්ඩායම සඳහා ද්වාරය වසා දැමීමට පෙර අයදුම්පත ඉදිරිපත් කිරීමට වගබලා ගන්න.'
                ],
                tips: [
                    lang === 'en' ? 'Save the confirmation PDF in case of exam entry inquiries.' : 'විභාග ප්‍රවේශ පත්‍ර ගැටළු වලදී ඉදිරිපත් කිරීමට තහවුරු කිරීමේ PDF එක ළඟ තබාගන්න.'
                ],
                warnings: [
                    lang === 'en' ? 'Late submissions will not be processed, resulting in automatic attempt loss.' : 'ප්‍රමාද වී ඉදිරිපත් කරන අයදුම්පත් සැකසෙන්නේ නැති අතර, විභාග අවස්ථාව අහිමි වීමට හේතු වේ.'
                ]
            }
        },
        {
            id: 'postponement-request',
            title: lang === 'en' ? 'Submit a Postponement Request' : 'කල් දැමීමේ ඉල්ලීමක් ඉදිරිපත් කරන්න',
            desc: lang === 'en' ? 'Request exam deferrals due to medical or personal emergencies' : 'හදිසි අවස්ථාවන් හේතුවෙන් විභාග කල් දැමීම සඳහා අයදුම් කරන්න',
            icon: Calendar,
            color: '#F59E0B',
            content: {
                intro: lang === 'en'
                    ? 'If you cannot sit for an exam due to medical issues or personal emergencies, request an official postponement.'
                    : 'වෛද්‍යමය හේතූන් හෝ හදිසි පුද්ගලික අවශ්‍යතාවක් නිසා විභාගයකට පෙනී සිටීමට නොහැකි නම්, නිල කල් දැමීමේ ඉල්ලීමක් ඉදිරිපත් කරන්න.',
                steps: [
                    { number: 1, text: lang === 'en' ? 'Access the Student Portal and enter your active course dashboard.' : 'ශිෂ්‍ය ද්වාරය වෙත පිවිස ඔබගේ ක්‍රියාකාරී පාඨමාලා උපකරණ පුවරුවට යන්න.' },
                    { number: 2, text: lang === 'en' ? 'Go to "Examinations" and select "Request Postponement".' : '"Examinations" වෙත ගොස් "Request Postponement" තෝරන්න.' },
                    { number: 3, text: lang === 'en' ? 'Upload valid supporting documentation (e.g. Government Medical Certificate).' : 'අදාළ සහතික ලේඛන (උදා: රජයේ වෛද්‍ය සහතිකය) උඩුගත කරන්න.' },
                    { number: 4, text: lang === 'en' ? 'Specify the exam subjects and select a reason from the options list.' : 'අදාළ විභාග විෂයයන් සඳහන් කර හේතුව තෝරාගන්න.' },
                    { number: 5, text: lang === 'en' ? 'Submit the application for evaluation by the Director/Board.' : 'අධ්‍යක්ෂ/මණ්ඩල අනුමැතිය සඳහා අයදුම්පත ඉදිරිපත් කරන්න.' }
                ],
                notes: [
                    lang === 'en' ? 'Postponement counts as a pending attempt if approved with medical certificates.' : 'වෛද්‍ය සහතික සහිතව අනුමත වුවහොත්, කල් දැමීම නැවත පෙනී සිටීමේ අවස්ථාවක් ලෙස සලකනු ලැබේ.'
                ],
                tips: [
                    lang === 'en' ? 'Upload medical certificates certified by a registered government practitioner.' : 'රජයේ ලියාපදිංචි වෛද්‍යවරයෙකු විසින් සහතික කරන ලද වෛද්‍ය සහතික පමණක් ඉදිරිපත් කරන්න.'
                ],
                warnings: [
                    lang === 'en' ? "Unapproved absences will be graded as 'F' (Fail) and count as an attempt." : "අනුමැතියක් නොමැතිව විභාගයට පෙනී නොසිටීම අසමත් (F) වීමක් ලෙස සලකා අවස්ථාවක් අහිමි වේ."
                ]
            }
        },
        {
            id: 'reattempt-request',
            title: lang === 'en' ? 'Submit a Reattempt Request' : 'නැවත පෙනී සිටීමේ ඉල්ලීමක් ඉදිරිපත් කරන්න',
            desc: lang === 'en' ? 'Re-register for repeat exams or semester completions' : 'අසමත් වූ විෂයයන් සඳහා නැවත විභාග අයදුම් කරන්න',
            icon: RefreshCw,
            color: '#EC4899',
            content: {
                intro: lang === 'en'
                    ? 'Re-apply for failed subjects or repeat semesters to improve academic grading.'
                    : 'අධ්‍යයන ශ්‍රේණි වැඩි දියුණු කිරීම සඳහා අසමත් වූ විෂයයන් හෝ නැවත වාර සඳහා නැවත අයදුම් කරන්න.',
                steps: [
                    { number: 1, text: lang === 'en' ? 'Enter the course view in the Student portal.' : 'ශිෂ්‍ය ද්වාරයේ පාඨමාලා දර්ශනයට ඇතුළු වන්න.' },
                    { number: 2, text: lang === 'en' ? 'Go to "Examinations" and click "Reattempt Request".' : '"Examinations" වෙත ගොස් "Reattempt Request" ක්ලික් කරන්න.' },
                    { number: 3, text: lang === 'en' ? 'Select your previously failed subjects from the list.' : 'ලැයිස්තුවෙන් ඔබ කලින් අසමත් වූ විෂයයන් තෝරන්න.' },
                    { number: 4, text: lang === 'en' ? 'Pay the required exam repeat fees at the bank and collect the payment slip.' : 'අදාළ විභාග නැවත පෙනී සිටීමේ ගාස්තුව බැංකුවට ගෙවා ලදුපත ලබාගන්න.' },
                    { number: 5, text: lang === 'en' ? 'Upload the scanned receipt of your payment slip.' : 'ඔබගේ ගෙවීම් ලදුපතේ ස්කෑන් පිටපතක් උඩුගත කරන්න.' },
                    { number: 6, text: lang === 'en' ? 'Submit the repeat request for staff validation.' : 'කාර්ය මණ්ඩල අනුමැතිය සඳහා ඉල්ලීම ඉදිරිපත් කරන්න.' }
                ],
                notes: [
                    lang === 'en' ? 'A nominal fee applies per repeat subject code.' : 'නැවත පෙනී සිටින සෑම විෂය කේතයක් සඳහාම නියමිත ගාස්තුවක් අය කෙරේ.'
                ],
                tips: [
                    lang === 'en' ? 'Ensure the bank deposit receipt shows your registration number clearly.' : 'බැංකු තැන්පතු රිසිට්පතෙහි ඔබගේ ලියාපදිංචි අංකය පැහැදිලිව සඳහන් කර ඇති බව සහතික කරගන්න.'
                ]
            }
        },
        {
            id: 'letter-request',
            title: lang === 'en' ? 'Request Official Letters' : 'නිල ලිපි ඉල්ලා සිටින්න',
            desc: lang === 'en' ? 'Apply for status, visa, or examination verification letters' : 'ශිෂ්‍යභාවය තහවුරු කිරීමේ හෝ වීසා සහාය ලිපි ලබාගන්න',
            icon: Mail,
            color: '#10B981',
            content: {
                intro: lang === 'en'
                    ? 'Request administrative student status confirmation letters, visa letters, or exam verification letters.'
                    : 'ශිෂ්‍යභාවය තහවුරු කිරීමේ ලිපි, වීසා ආධාරක ලිපි හෝ විභාග සත්‍යාපන ලිපි වැනි නිල පරිපාලන ලිපි ඉල්ලා සිටින්න.',
                steps: [
                    { number: 1, text: lang === 'en' ? 'Select "Request Letters" in your active student dashboard.' : 'ඔබගේ සක්‍රීය ශිෂ්‍ය උපකරණ පුවරුවේ "Request Letters" තෝරන්න.' },
                    { number: 2, text: lang === 'en' ? 'Choose the letter template type (e.g. Student Status, Visa Support).' : 'ලිපි ආකෘති වර්ගය තෝරන්න (උදා: ශිෂ්‍යභාවය තහවුරු කිරීම, වීසා සහය).' },
                    { number: 3, text: lang === 'en' ? 'Enter the specific reason for your request and select delivery preferences (Download PDF or Physical Collection).' : 'ඔබගේ ඉල්ලීම සඳහා නිශ්චිත හේතුව ඇතුළත් කර ලබාගැනීමේ ක්‍රමය තෝරන්න (PDF බාගත කිරීම හෝ කාර්යාලයෙන් ලබාගැනීම).' },
                    { number: 4, text: lang === 'en' ? 'Click "Submit Request".' : '"Submit Request" ක්ලික් කරන්න.' },
                    { number: 5, text: lang === 'en' ? 'Once the Secretary approves, download the digitally signed PDF or collect the hard copy from the CODL counter.' : 'ලේකම් අනුමත කළ පසු, ඩිජිටල් ලෙස අත්සන් කරන ලද PDF ලිපිය බාගත කරගන්න හෝ CODL කවුන්ටරයෙන් ලබාගන්න.' }
                ],
                notes: [
                    lang === 'en' ? 'Letter processing typically takes 2-3 working days.' : 'ලිපි සකස් කිරීම සඳහා සාමාන්‍යයෙන් වැඩ කරන දින 2-3 ක් ගතවේ.'
                ],
                tips: [
                    lang === 'en' ? 'State the target embassy or organization name clearly in the reasons field.' : 'ලිපිය ඉදිරිපත් කරන තානාපති කාර්යාලය හෝ ආයතනයේ නම පැහැදිලිව හේතු කොටසේ සඳහන් කරන්න.'
                ]
            }
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
                    {/* Always display standard navigation actions in the header */}
                    <Link to="/login" className="hc-back-btn">
                        <ArrowLeft size={16} /> {branding.backLabel}
                    </Link>
                </div>
            </div>

            {currentGuide ? (
                /* =========================================================
                   STATE B: GUIDE DETAIL PAGE
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
                            <p className="hc-intro-text">{currentGuide.content.intro}</p>

                            <div className="hc-steps-section">
                                <h5>{branding.stepLabel}s</h5>
                                <div className="hc-steps-list">
                                    {currentGuide.content.steps.map(step => (
                                        <div key={step.number} className="hc-step-item">
                                            <div className="hc-step-badge">{step.number}</div>
                                            <p className="hc-step-text">{step.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {currentGuide.content.notes && currentGuide.content.notes.length > 0 && (
                                <div className="hc-info-box note">
                                    <div className="hc-info-box-header">
                                        <Info size={16} />
                                        <h6>{branding.notesLabel}</h6>
                                    </div>
                                    <ul>
                                        {currentGuide.content.notes.map((n, i) => <li key={i}>{n}</li>)}
                                    </ul>
                                </div>
                            )}

                            {currentGuide.content.tips && currentGuide.content.tips.length > 0 && (
                                <div className="hc-info-box tip">
                                    <div className="hc-info-box-header">
                                        <CheckCircle size={16} />
                                        <h6>{branding.tipsLabel}</h6>
                                    </div>
                                    <ul>
                                        {currentGuide.content.tips.map((t, i) => <li key={i}>{t}</li>)}
                                    </ul>
                                </div>
                            )}

                            {currentGuide.content.warnings && currentGuide.content.warnings.length > 0 && (
                                <div className="hc-info-box warning">
                                    <div className="hc-info-box-header">
                                        <AlertTriangle size={16} />
                                        <h6>{branding.warningsLabel}</h6>
                                    </div>
                                    <ul>
                                        {currentGuide.content.warnings.map((w, i) => <li key={i}>{w}</li>)}
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

                    {/* Guide categories displayed as home page grid cards only */}
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
