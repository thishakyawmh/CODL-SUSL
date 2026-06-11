import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calculator, Award, Info } from 'lucide-react';
import './GradingScale.css';

interface GradingScaleProps {
    isEmbedded?: boolean;
    onBack?: () => void;
}

export const GradingScale: React.FC<GradingScaleProps> = ({ isEmbedded }) => {
    const navigate = useNavigate();

    const gradingScale = [
        { grade: 'A+', gpa: '4.00', description: 'Exceptional Performance' },
        { grade: 'A', gpa: '4.00', description: 'Excellent Performance' },
        { grade: 'A-', gpa: '3.70', description: 'Very Good Performance' },
        { grade: 'B+', gpa: '3.30', description: 'Good Performance' },
        { grade: 'B', gpa: '3.00', description: 'Satisfactory Performance' },
        { grade: 'B-', gpa: '2.70', description: 'Fairly Satisfactory' },
        { grade: 'C+', gpa: '2.30', description: 'Pass (Upper)' },
        { grade: 'C', gpa: '2.00', description: 'Pass (Lower)' },
        { grade: 'D', gpa: '1.00', description: 'Poor Performance' },
        { grade: 'E', gpa: '0.50', description: 'Weak Performance' },
        { grade: 'F', gpa: '0.00', description: 'Academic Failure' }
    ];

    return (
        <div className={`grading-scale-wrapper ${isEmbedded ? 'embedded' : ''}`}>
            {!isEmbedded && (
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Back
                </button>
            )}

            {/* Removed Back button as requested */}

            {!isEmbedded && (
                <div className="grading-header">
                    <div className="header-icon">
                        <BookOpen size={32} />
                    </div>
                    <div className="header-info">
                        <h1>Academic Grading System</h1>
                        <p>Standardized grading scale and GPA calculation rules for degree programs.</p>
                    </div>
                </div>
            )}

            <div className="grading-content-grid">
                <div className="main-scale-card card">
                    <div className="section-title">
                        <Award size={22} />
                        <h2>Grading Matrix</h2>
                    </div>
                    <div className="scale-table-container">
                        <table className="scale-table">
                            <thead>
                                <tr>
                                    <th>Letter Grade</th>
                                    <th>Grade Point</th>
                                    <th>Interpretation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gradingScale.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <span className={`grade-label ${item.grade.startsWith('A') ? 'excellent' : item.grade.startsWith('B') ? 'good' : item.grade.startsWith('C') ? 'average' : 'poor'}`}>
                                                {item.grade}
                                            </span>
                                        </td>
                                        <td className="gpa-cell">{item.gpa}</td>
                                        <td className="desc-cell">{item.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="calculation-rules-column">
                    <div className="rule-card card">
                        <div className="section-title">
                            <Calculator size={20} />
                            <h3>GPA Calculation</h3>
                        </div>
                        <p className="rule-text">
                            The Grade Point Average (GPA) is calculated based on the grade points earned and the credit value of each subject.
                        </p>
                        <div className="formula-box">
                            GPA = Σ (Grade Points × Credits) / Σ Credits
                        </div>
                    </div>

                    <div className="note-card card">
                        <div className="section-title">
                            <Info size={20} />
                            <h3>Important Notes</h3>
                        </div>
                        <ul className="notes-list">
                            <li>"Not Released" indicates grades currently under evaluation.</li>
                            <li>A minimum grade of "C" is required for core subject competency.</li>
                            <li>Repeat examinations follow the same grading scale but may have capped points.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
