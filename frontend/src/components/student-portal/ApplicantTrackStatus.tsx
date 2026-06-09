import React, { useEffect, useState } from 'react';
import { FileText, Clock, ShieldAlert, CheckCircle2, ArrowLeft, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { courseApplicationService } from '../../services/apiService';
import './ApplicantDashboard.css';

export const ApplicantTrackStatus: React.FC = () => {
    const navigate = useNavigate();
    const [application, setApplication] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleDownloadApplication = async (app: any) => {
        if (!app) return;

        // Dynamically import jsPDF and html2canvas
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        const olRows = (app.ol_subjects || [])
            .map((sub: any) => `<tr><td>${sub.subject}</td><td style="text-align:center; font-weight:bold;">${sub.grade}</td></tr>`)
            .join('');

        const alRows = (app.al_subjects || [])
            .map((sub: any) => `<tr><td>${sub.subject}</td><td style="text-align:center; font-weight:bold;">${sub.grade}</td></tr>`)
            .join('');

        const olTableContent = olRows || `<tr><td colspan="2" style="text-align:center; color:#64748b;">No subjects recorded</td></tr>`;
        const alTableContent = alRows || `<tr><td colspan="2" style="text-align:center; color:#64748b;">No subjects recorded</td></tr>`;

        const otherQualificationsHTML = app.other_qualifications
            ? `
            <div class="section-title">Other Qualifications</div>
            <div class="value" style="border:none; padding:8px 0; line-height:1.6;">${app.other_qualifications}</div>
            `
            : '';

        const appId = `APP-${new Date(app.created_at).getFullYear()}-${app.id.toString().padStart(4, '0')}`;
        const submissionDate = new Date(app.created_at).toLocaleDateString();

        // Shared styles for both pages
        const sharedStyles = `
        .section-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 20px;
            margin-bottom: 12px;
            color: #1e293b;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 20px;
        }
        .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px 20px;
        }
        .field { margin-bottom: 6px; }
        .field.full-width { grid-column: span 2; }
        .label {
            font-weight: 600;
            color: #475569;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 2px;
            display: block;
        }
        .value {
            font-size: 12px;
            color: #0f172a;
            padding: 4px 0;
            border-bottom: 1px dotted #e2e8f0;
            min-height: 18px;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; font-size: 12px; }
        th { background-color: #f8fafc; font-weight: 600; color: #334155; font-size: 10px; text-transform: uppercase; }
        .qual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .declaration { margin-top: 30px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; background-color: #f8fafc; }
        .declaration p { margin: 0 0 12px 0; text-align: justify; font-size: 11px; color: #475569; line-height: 1.5; }
        .sig-block { display: flex; justify-content: space-between; margin-top: 25px; }
        .sig-line { width: 180px; border-top: 1px solid #0f172a; text-align: center; padding-top: 4px; font-size: 11px; font-weight: 500; }
        .office-use { margin-top: 30px; border: 2px dashed #cbd5e1; padding: 15px; border-radius: 6px; }
        .office-use h4 { margin: 0 0 12px 0; text-transform: uppercase; font-size: 11px; font-weight: 700; color: #1e293b; text-align: center; }
        `;

        // Helper to create a page container
        const createPageContainer = (htmlContent: string) => {
            const el = document.createElement('div');
            el.style.position = 'fixed';
            el.style.left = '-9999px';
            el.style.top = '0';
            el.style.width = '794px';
            el.style.background = '#fff';
            el.style.zIndex = '-1';
            el.innerHTML = `
<div style="font-family: 'Inter', Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.5; padding: 40px; font-size: 13px;">
    <style>${sharedStyles}</style>
    ${htmlContent}
</div>`;
            return el;
        };

        // ── PAGE 1: Header, Course Details, Personal Info, Employment ──
        const page1 = createPageContainer(`
    <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px;">
        <h1 style="font-size: 18px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Centre for Open and Distance Learning</h1>
        <h2 style="font-size: 13px; font-weight: 600; margin: 5px 0 0 0; color: #475569;">Sabaragamuwa University of Sri Lanka</h2>
        <h3 style="font-size: 11px; font-weight: 700; margin: 15px 0 0 0; text-transform: uppercase; color: #0f172a; background: #f1f5f9; display: inline-block; padding: 6px 16px; border-radius: 4px;">Application for Admission</h3>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #475569;">
        <div><strong>Application Ref:</strong> ${appId}</div>
        <div><strong>Date Submitted:</strong> ${submissionDate}</div>
    </div>

    <div class="section-title">Applied Course Details</div>
    <div class="grid-2">
        <div class="field full-width">
            <span class="label">Course Title</span>
            <div class="value">${app.course?.title || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Course Code</span>
            <div class="value">${app.course?.code || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Preferred Batch</span>
            <div class="value">${app.batch?.name || 'N/A'}</div>
        </div>
    </div>

    <div class="section-title">Personal Information</div>
    <div class="grid-2">
        <div class="field full-width">
            <span class="label">Full Name</span>
            <div class="value">${app.applicant_name || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Display Name</span>
            <div class="value">${app.display_name || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">NIC Number</span>
            <div class="value">${app.applicant_nic || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Email Address</span>
            <div class="value">${app.applicant_email || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Primary Phone</span>
            <div class="value">${app.phone || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">WhatsApp Number</span>
            <div class="value">${app.whatsapp || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Home Phone</span>
            <div class="value">${app.home_phone || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Guardian Phone</span>
            <div class="value">${app.guardian_phone || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Date of Birth</span>
            <div class="value">${app.dob ? app.dob.split('T')[0] : 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Gender / Sex</span>
            <div class="value">${app.sex || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">Civil Status</span>
            <div class="value">${app.civil_status || 'N/A'}</div>
        </div>
        <div class="field">
            <span class="label">District</span>
            <div class="value">${app.district || 'N/A'}</div>
        </div>
        <div class="field full-width">
            <span class="label">Home Address</span>
            <div class="value">${app.address || 'N/A'}</div>
        </div>
    </div>

    <div class="section-title">Employment Information</div>
    <div class="grid-2">
        <div class="field">
            <span class="label">Designation / Job Title</span>
            <div class="value">${app.employment_title || 'Not Employed'}</div>
        </div>
        <div class="field">
            <span class="label">Official Address</span>
            <div class="value">${app.official_address || 'N/A'}</div>
        </div>
    </div>
        `);

        // ── PAGE 2: Academic Qualifications, Declaration, Office Use ──
        const page2 = createPageContainer(`
    <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px;">
        <h1 style="font-size: 18px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Centre for Open and Distance Learning</h1>
        <h2 style="font-size: 13px; font-weight: 600; margin: 5px 0 0 0; color: #475569;">Sabaragamuwa University of Sri Lanka</h2>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px; color: #94a3b8;">
        <div>Application Ref: ${appId}</div>
        <div>Page 2</div>
    </div>

    <div class="section-title">Academic Qualifications</div>
    <div class="qual-grid">
        <div>
            <div style="font-weight:700; font-size:12px; margin-bottom:5px; color:#1e293b;">G.C.E. O/L Examination</div>
            <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Year: ${app.ol_year || 'N/A'} &nbsp;&bull;&nbsp; Index No: ${app.ol_index || 'N/A'}</div>
            <table>
                <thead><tr><th>Subject</th><th style="width:60px; text-align:center;">Grade</th></tr></thead>
                <tbody>${olTableContent}</tbody>
            </table>
        </div>
        <div>
            <div style="font-weight:700; font-size:12px; margin-bottom:5px; color:#1e293b;">G.C.E. A/L Examination</div>
            <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Year: ${app.al_year || 'N/A'} &nbsp;&bull;&nbsp; Index No: ${app.al_index || 'N/A'}</div>
            <table>
                <thead><tr><th>Subject</th><th style="width:60px; text-align:center;">Grade</th></tr></thead>
                <tbody>${alTableContent}</tbody>
            </table>
        </div>
    </div>

    ${otherQualificationsHTML}

    <div class="declaration">
        <p>
            I hereby certify that the details provided above are true, complete, and accurate to the best of my knowledge. I understand that any false or misleading statement on this form may result in the rejection of my application or cancellation of my registration with the Sabaragamuwa University of Sri Lanka.
        </p>
        <div class="sig-block">
            <div>
                <div style="height:35px;"></div>
                <div class="sig-line">Date</div>
            </div>
            <div>
                <div style="height:35px;"></div>
                <div class="sig-line">Applicant's Signature</div>
            </div>
        </div>
    </div>

    <div class="office-use">
        <h4>For CODL Office Use Only</h4>
        <div class="grid-2">
            <div class="field">
                <span class="label">Personal Documents Verified (NIC, Birth Cert)</span>
                <div class="value" style="font-size: 11px; font-weight: bold; color: #475569;">
                    [ &nbsp; ] YES &nbsp; &nbsp; &nbsp; [ &nbsp; ] NO
                </div>
            </div>
            <div class="field">
                <span class="label">Educational Certificates Verified (O/L, A/L)</span>
                <div class="value" style="font-size: 11px; font-weight: bold; color: #475569;">
                    [ &nbsp; ] YES &nbsp; &nbsp; &nbsp; [ &nbsp; ] NO
                </div>
            </div>
        </div>
        <div style="margin-top: 25px;" class="grid-3">
            <div class="field">
                <span class="label">Verified By (Course Secretary)</span>
                <div style="height:25px;" class="value"></div>
            </div>
            <div class="field">
                <span class="label">Recommended By (Course Coordinator)</span>
                <div style="height:25px;" class="value"></div>
            </div>
            <div class="field">
                <span class="label">Approved By (Director, CODL)</span>
                <div style="height:25px;" class="value"></div>
            </div>
        </div>
    </div>
        `);

        document.body.appendChild(page1);
        document.body.appendChild(page2);

        // Wait for fonts/styles to render
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const canvasOpts = { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' };

            const canvas1 = await html2canvas(page1, canvasOpts);
            const canvas2 = await html2canvas(page2, canvasOpts);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Page 1
            const img1 = canvas1.toDataURL('image/png');
            const img1Height = (canvas1.height * pdfWidth) / canvas1.width;
            pdf.addImage(img1, 'PNG', 0, 0, pdfWidth, Math.min(img1Height, pdfHeight));

            // Page 2
            pdf.addPage();
            const img2 = canvas2.toDataURL('image/png');
            const img2Height = (canvas2.height * pdfWidth) / canvas2.width;
            pdf.addImage(img2, 'PNG', 0, 0, pdfWidth, Math.min(img2Height, pdfHeight));

            pdf.save(`CODL_Application_${appId}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            document.body.removeChild(page1);
            document.body.removeChild(page2);
        }
    };

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                const apps = await courseApplicationService.getMyApplications();
                if (apps && apps.length > 0) {
                    // Usually there's only one pending application, or we track the latest
                    setApplication(apps[0]);
                }
            } catch (error) {
                console.error("Failed to fetch application", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchApplication();
    }, []);

    if (isLoading) {
        return <div className="applicant-view-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading status...</div>;
    }

    if (!application) {
        return (
            <div className="applicant-view-container">
                <button className="back-btn" onClick={() => navigate('/applicant-dashboard')}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="welcome-banner-applicant" style={{ marginTop: '20px' }}>
                    <h1>No Active Application Found</h1>
                    <p>You haven't submitted any course applications yet.</p>
                </div>
            </div>
        );
    }

    const approvalLevel = application.approval_level || 0;
    const isRejected = application.status === 'rejected';

    const getStatusText = () => {
        if (isRejected) return 'Rejected';
        if (approvalLevel === 3) return 'Approved';
        return 'In Review';
    };

    const getStatusStyle = () => {
        if (isRejected) return { backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#FECDD3' };
        if (approvalLevel === 3) return { backgroundColor: '#DCFCE7', color: '#16A34A', borderColor: '#BBF7D0' };
        return { backgroundColor: '#FEF9C3', color: '#CA8A04', borderColor: '#FEF08A' };
    };

    const steps = [
        {
            id: 1,
            title: 'Application Submitted',
            description: 'Your application has been received successfully.',
            date: new Date(application.created_at).toLocaleDateString(),
            status: 'completed',
            icon: <FileText size={20} />
        },
        {
            id: 2,
            title: 'Document Verification (Secretary)',
            description: 'Please bring original and verified copies of your NIC, Birth Certificate, and O/L & A/L certificates to the CODL branch.',
            date: approvalLevel >= 1 ? new Date(application.secretary_approved_at || Date.now()).toLocaleDateString() : 'Pending',
            status: isRejected && approvalLevel === 0 ? 'rejected' : (approvalLevel >= 1 ? 'completed' : 'pending'),
            icon: <Clock size={20} />,
            rejectReason: isRejected && approvalLevel === 0 ? application.secretary_comment : null
        },
        {
            id: 3,
            title: 'Coordinator Approval',
            description: 'Your qualifications are being reviewed by the Course Coordinator.',
            date: approvalLevel >= 2 ? new Date(application.coordinator_approved_at || Date.now()).toLocaleDateString() : 'Pending',
            status: isRejected && approvalLevel === 1 ? 'rejected' : (approvalLevel >= 2 ? 'completed' : 'pending'),
            icon: <Clock size={20} />,
            rejectReason: isRejected && approvalLevel === 1 ? application.coordinator_comment : null
        },
        {
            id: 4,
            title: 'Final Director Approval & Account Generation',
            description: 'Final review by the Director. Once approved, your student account will be generated.',
            date: approvalLevel >= 3 ? new Date(application.director_approved_at || Date.now()).toLocaleDateString() : 'Pending',
            status: isRejected && approvalLevel === 2 ? 'rejected' : (approvalLevel >= 3 ? 'completed' : 'pending'),
            icon: <ShieldAlert size={20} />,
            credentials: approvalLevel >= 3 ? {
                regNo: application.generated_student_number,
                password: application.applicant_nic
            } : null,
            rejectReason: isRejected && approvalLevel === 2 ? application.director_comment : null
        }
    ];

    return (
        <div className="applicant-view-container">
            <button className="back-btn" onClick={() => navigate('/applicant-dashboard')}>
                <ArrowLeft size={18} /> Back
            </button>
            <div className="welcome-banner-applicant">
                <h1>Track Application Status</h1>
                <p>Monitor the progress of your application and see what's coming next.</p>
            </div>

            <div className="content-grid">
                {/* Left Column - Tracking */}
                <div className="tracking-section card-box">
                    <div className="section-header">
                        <h3 className="section-title">Application Status</h3>
                        <span className="status-badge-inline" style={getStatusStyle()}>{getStatusText()}</span>
                    </div>

                    <div className="application-info-box">
                        <p className="info-row"><strong>Course:</strong> {application.course?.title || 'Unknown Course'}</p>
                        <p className="info-row"><strong>Batch:</strong> {application.batch?.name || 'Unknown Batch'}</p>
                        <p className="info-row"><strong>Application ID:</strong> APP-{new Date(application.created_at).getFullYear()}-{application.id.toString().padStart(4, '0')}</p>
                        <p className="info-row"><strong>Submitted On:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="timeline-container">
                        {steps.map((step, index) => (
                            <div className={`timeline-step ${step.status}`} key={step.id}>
                                <div className="step-indicator">
                                    <div className="step-icon">
                                        {step.status === 'completed' ? <CheckCircle2 size={20} /> : (step.status === 'rejected' ? <XCircle size={20} /> : step.icon)}
                                    </div>
                                    {index < steps.length - 1 && <div className="step-line"></div>}
                                </div>
                                <div className="step-content">
                                    <h4 className="step-title">{step.title}</h4>
                                    <p className="step-desc">{step.description}</p>

                                    {step.status === 'rejected' && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px 16px',
                                            backgroundColor: '#FEF2F2',
                                            border: '1px solid #FECDD3',
                                            borderRadius: '8px',
                                            color: '#9F1239',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            lineHeight: 1.5,
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                            textAlign: 'left'
                                        }}>
                                            <strong style={{ color: '#E11D48' }}>Rejection Reason:</strong> {step.rejectReason || 'No reason provided. Please contact the CODL registry for details.'}
                                        </div>
                                    )}

                                    {step.credentials && (
                                        <div className="credentials-box" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px', marginTop: '12px', marginBottom: '16px' }}>
                                            <h4 style={{ margin: '0 0 12px 0', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <CheckCircle2 size={18} /> Student Account Created!
                                            </h4>
                                            <p style={{ margin: '0 0 8px 0', color: '#0F172A' }}><strong>Reg no (Index No):</strong> {step.credentials.regNo}</p>
                                            <p style={{ margin: '0 0 12px 0', color: '#0F172A' }}><strong>Password:</strong> {step.credentials.password} <em>(Your NIC)</em></p>
                                            <p style={{ margin: '0', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                                                You can change your password in account settings after logging in.
                                            </p>

                                            <button
                                                className="btn-primary"
                                                onClick={() => {
                                                    // Clear temporary applicant tokens before redirecting
                                                    sessionStorage.removeItem('token');
                                                    sessionStorage.removeItem('user');
                                                    sessionStorage.removeItem('adminRole');
                                                    navigate('/login');
                                                }}
                                                style={{ marginTop: '16px', width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                            >
                                                Log into Student Portal
                                            </button>
                                        </div>
                                    )}

                                    <span className="step-date">{step.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column - Next Steps */}
                <div className="side-actions-section">
                    <div className="card-box info-card">
                        <h3>Next Steps</h3>
                        <p>Once your application is approved by all levels, your official <strong>Registration Number</strong> and <strong>Password</strong> will be issued.</p>
                        <p>You will use them to log into the main Registered Student portal.</p>

                        <div style={{ marginTop: '20px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#0F172A' }}>Required Documents (Verification)</h4>
                            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                                <li>National Identity Card (NIC)</li>
                                <li>Birth Certificate</li>
                                <li>O/L Certificate</li>
                                <li>A/L Certificate</li>
                                <li>Any other qualification certificates</li>
                            </ul>
                            <p style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>* Please bring originals and true copies to the CODL registry.</p>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={() => handleDownloadApplication(application)}
                            style={{
                                marginTop: '24px',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <FileText size={18} /> Download Filled Application (PDF)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
