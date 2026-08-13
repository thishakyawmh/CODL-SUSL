import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Database, RefreshCw, Trash2, Edit, GraduationCap, Building } from 'lucide-react';
import { studentInterestService, industryAnalysisService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './AIAnalytics.css'; 

export const ManageForms: React.FC = () => {
    const navigate = useNavigate();
    const [formType, setFormType] = useState<'student' | 'industry' | null>(null);
    const [manageTab, setManageTab] = useState<'interests' | 'methods' | 'opportunities'>('interests');
    const [industryTab, setIndustryTab] = useState<'sectors' | 'interests'>('sectors');




    const [configs, setConfigs] = useState<any[]>([]);
    const [configsLoading, setConfigsLoading] = useState(false);
    const [isEditingConfig, setIsEditingConfig] = useState(false);
    const [configForm, setConfigForm] = useState({
        id: undefined as number | undefined,
        interest_field: '',
        skills: ''
    });

    const [teachingMethodsList, setTeachingMethodsList] = useState<any[]>([]);
    const [methodsLoading, setMethodsLoading] = useState(false);
    const [isEditingMethod, setIsEditingMethod] = useState(false);
    const [methodForm, setMethodForm] = useState({
        id: undefined as number | undefined,
        method_name: ''
    });

    const [opportunitiesList, setOpportunitiesList] = useState<any[]>([]);
    const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
    const [isEditingOpportunity, setIsEditingOpportunity] = useState(false);
    const [opportunityForm, setOpportunityForm] = useState({
        id: undefined as number | undefined,
        opportunity_name: ''
    });




    const [sectors, setSectors] = useState<any[]>([]);
    const [sectorsLoading, setSectorsLoading] = useState(false);
    const [isEditingSector, setIsEditingSector] = useState(false);
    const [sectorForm, setSectorForm] = useState({
        id: undefined as number | undefined,
        sector_name: ''
    });

    const [indConfigs, setIndConfigs] = useState<any[]>([]);
    const [indConfigsLoading, setIndConfigsLoading] = useState(false);
    const [isEditingIndConfig, setIsEditingIndConfig] = useState(false);
    const [indConfigForm, setIndConfigForm] = useState({
        id: undefined as number | undefined,
        interest_field: '',
        skills: ''
    });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });




    const fetchConfigs = async () => {
        setConfigsLoading(true);
        try {
            const data = await studentInterestService.getConfig();
            setConfigs(data);
        } catch (err) {
            console.error('Failed to load configurations:', err);
        } finally {
            setConfigsLoading(false);
        }
    };

    const fetchTeachingMethods = async () => {
        setMethodsLoading(true);
        try {
            const data = await studentInterestService.getTeachingMethods();
            setTeachingMethodsList(data);
        } catch (err) {
            console.error('Failed to load teaching methods:', err);
        } finally {
            setMethodsLoading(false);
        }
    };

    const fetchUniversityOpportunities = async () => {
        setOpportunitiesLoading(true);
        try {
            const data = await studentInterestService.getUniversityOpportunities();
            setOpportunitiesList(data);
        } catch (err) {
            console.error('Failed to load university opportunities:', err);
        } finally {
            setOpportunitiesLoading(false);
        }
    };




    const fetchSectors = async () => {
        setSectorsLoading(true);
        try {
            const data = await industryAnalysisService.getSectors();
            setSectors(data);
        } catch (err) {
            console.error('Failed to load industry sectors:', err);
        } finally {
            setSectorsLoading(false);
        }
    };

    const fetchIndConfigs = async () => {
        setIndConfigsLoading(true);
        try {
            const data = await industryAnalysisService.getConfig();
            setIndConfigs(data);
        } catch (err) {
            console.error('Failed to load industry academic field configs:', err);
        } finally {
            setIndConfigsLoading(false);
        }
    };


    useEffect(() => {
        if (formType === 'student') {
            if (manageTab === 'interests') fetchConfigs();
            else if (manageTab === 'methods') fetchTeachingMethods();
            else if (manageTab === 'opportunities') fetchUniversityOpportunities();
        } else if (formType === 'industry') {
            if (industryTab === 'sectors') fetchSectors();
            else if (industryTab === 'interests') fetchIndConfigs();
        }
    }, [formType, manageTab, industryTab]);




    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!configForm.interest_field.trim() || !configForm.skills.trim()) {
            toast.error('Please fill out all fields.');
            return;
        }
        const skillsArray = configForm.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        try {
            await studentInterestService.saveConfig({
                id: configForm.id,
                interest_field: configForm.interest_field.trim(),
                skills: skillsArray
            });
            toast.success('Academic field saved successfully.');
            setIsEditingConfig(false);
            setConfigForm({ id: undefined, interest_field: '', skills: '' });
            fetchConfigs();
        } catch (err: any) {
            toast.error('Failed to save config: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteConfig = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Academic Interest',
            message: 'Are you sure you want to delete this academic interest area? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await studentInterestService.deleteConfig(id);
                    toast.success('Academic interest area deleted successfully.');
                    fetchConfigs();
                } catch (err: any) {
                    toast.error('Failed to delete config: ' + (err.response?.data?.message || err.message));
                }
            }
        });
    };

    const handleSaveMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!methodForm.method_name.trim()) {
            toast.error('Please enter a teaching method name.');
            return;
        }
        try {
            await studentInterestService.saveTeachingMethod({
                id: methodForm.id,
                method_name: methodForm.method_name.trim()
            });
            toast.success('Teaching method saved successfully.');
            setIsEditingMethod(false);
            setMethodForm({ id: undefined, method_name: '' });
            fetchTeachingMethods();
        } catch (err: any) {
            toast.error('Failed to save teaching method: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteMethod = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Teaching Method',
            message: 'Are you sure you want to delete this teaching method? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await studentInterestService.deleteTeachingMethod(id);
                    toast.success('Teaching method deleted successfully.');
                    fetchTeachingMethods();
                } catch (err: any) {
                    toast.error('Failed to delete teaching method: ' + (err.response?.data?.message || err.message));
                }
            }
        });
    };

    const handleSaveOpportunity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!opportunityForm.opportunity_name.trim()) {
            toast.error('Please enter a university opportunity name.');
            return;
        }
        try {
            await studentInterestService.saveUniversityOpportunity({
                id: opportunityForm.id,
                opportunity_name: opportunityForm.opportunity_name.trim()
            });
            toast.success('University opportunity saved successfully.');
            setIsEditingOpportunity(false);
            setOpportunityForm({ id: undefined, opportunity_name: '' });
            fetchUniversityOpportunities();
        } catch (err: any) {
            toast.error('Failed to save university opportunity: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteOpportunity = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete University Opportunity',
            message: 'Are you sure you want to delete this university opportunity? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await studentInterestService.deleteUniversityOpportunity(id);
                    toast.success('University opportunity deleted successfully.');
                    fetchUniversityOpportunities();
                } catch (err: any) {
                    toast.error('Failed to delete university opportunity: ' + (err.response?.data?.message || err.message));
                }
            }
        });
    };




    const handleSaveSector = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectorForm.sector_name.trim()) {
            toast.error('Please enter an industry sector name.');
            return;
        }
        try {
            await industryAnalysisService.saveSector({
                id: sectorForm.id,
                sector_name: sectorForm.sector_name.trim()
            });
            toast.success('Industry sector saved successfully.');
            setIsEditingSector(false);
            setSectorForm({ id: undefined, sector_name: '' });
            fetchSectors();
        } catch (err: any) {
            toast.error('Failed to save industry sector: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteSector = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Industry Sector',
            message: 'Are you sure you want to delete this industry sector? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await industryAnalysisService.deleteSector(id);
                    toast.success('Industry sector deleted successfully.');
                    fetchSectors();
                } catch (err: any) {
                    toast.error('Failed to delete industry sector: ' + (err.response?.data?.message || err.message));
                }
            }
        });
    };

    const handleSaveIndConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!indConfigForm.interest_field.trim() || !indConfigForm.skills.trim()) {
            toast.error('Please fill out all fields.');
            return;
        }
        const skillsArray = indConfigForm.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        try {
            await industryAnalysisService.saveConfig({
                id: indConfigForm.id,
                interest_field: indConfigForm.interest_field.trim(),
                skills: skillsArray
            });
            toast.success('Academic domain saved successfully.');
            setIsEditingIndConfig(false);
            setIndConfigForm({ id: undefined, interest_field: '', skills: '' });
            fetchIndConfigs();
        } catch (err: any) {
            toast.error('Failed to save academic domain: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteIndConfig = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Academic Domain',
            message: 'Are you sure you want to delete this primary academic domain configuration? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await industryAnalysisService.deleteConfig(id);
                    toast.success('Academic domain deleted successfully.');
                    fetchIndConfigs();
                } catch (err: any) {
                    toast.error('Failed to delete configuration: ' + (err.response?.data?.message || err.message));
                }
            }
        });
    };




    if (formType === null) {
        return (
            <div className="ai-analytics-page" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
                <div className="admin-page-header">
                    <div>
                        <button
                            className="cm-back-text-btn"
                            onClick={() => navigate('/admin/ai-analytics')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', fontWeight: 600, fontSize: '14px', marginBottom: '20px', padding: 0 }}
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <h1 className="admin-page-title">Manage Survey Configurations</h1>
                        <p className="admin-page-subtitle">Configure interest fields, capability requirements, and dynamic option lists for the public surveys.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '40px', maxWidth: '1100px', margin: '56px auto 0 auto', padding: '0 20px' }}>

                    { }
                    <div
                        className="ai-roadmap-card"
                        onClick={() => { setFormType('student'); setManageTab('interests'); }}
                        style={{ padding: '64px 44px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '28px', transition: 'transform 0.2s, box-shadow 0.2s', border: '1.5px solid #E2E8F0' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = '#7C3AED';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(124, 58, 237, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GraduationCap size={50} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '25px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>Student Interest Form</h2>
                            <p style={{ fontSize: '16px', color: '#64748B', lineHeight: '1.6' }}>
                                Manage academic interest areas, dynamic associated skill list, training methods, and university opportunities.
                            </p>
                        </div>
                    </div>

                    { }
                    <div
                        className="ai-roadmap-card"
                        onClick={() => { setFormType('industry'); setIndustryTab('sectors'); }}
                        style={{ padding: '64px 44px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '28px', transition: 'transform 0.2s, box-shadow 0.2s', border: '1.5px solid #E2E8F0' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = '#10B981';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building size={50} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '25px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>Industry Requirements Form</h2>
                            <p style={{ fontSize: '16px', color: '#64748B', lineHeight: '1.6' }}>
                                Manage industry sectors, primary academic domains of interest, and the associated sub-disciplines for employers.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        );
    }




    if (formType === 'student') {
        return (
            <div className="ai-analytics-page" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
                <div className="admin-page-header">
                    <div>
                        <button
                            className="cm-back-text-btn"
                            onClick={() => setFormType(null)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', fontWeight: 600, fontSize: '14px', marginBottom: '20px', padding: 0 }}
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <h1 className="admin-page-title">Configure Student Interest Form</h1>
                        <p className="admin-page-subtitle">Configure dynamic interest fields, associated skills, teaching methods, and student support opportunities.</p>
                    </div>

                    {!isEditingConfig && !isEditingMethod && !isEditingOpportunity && (
                        <button
                            className="admin-btn-primary"
                            onClick={() => {
                                if (manageTab === 'interests') {
                                    setIsEditingConfig(true);
                                    setConfigForm({ id: undefined, interest_field: '', skills: '' });
                                } else if (manageTab === 'methods') {
                                    setIsEditingMethod(true);
                                    setMethodForm({ id: undefined, method_name: '' });
                                } else {
                                    setIsEditingOpportunity(true);
                                    setOpportunityForm({ id: undefined, opportunity_name: '' });
                                }
                            }}
                        >
                            <Plus size={16} /> Add {manageTab === 'interests' ? 'Category' : (manageTab === 'methods' ? 'Method' : 'Opportunity')}
                        </button>
                    )}
                </div>

                <div className="ai-roadmap-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="manage-tabs" style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px', width: '100%' }}>
                        <button
                            className={`manage-tab-btn ${manageTab === 'interests' ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '12px 18px',
                                fontSize: '15px',
                                fontWeight: 600,
                                border: 'none',
                                borderBottom: manageTab === 'interests' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
                                backgroundColor: 'transparent',
                                color: manageTab === 'interests' ? '#7c3aed' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                            }}
                            onClick={() => setManageTab('interests')}
                        >
                            Interest Areas & Skills
                        </button>
                        <button
                            className={`manage-tab-btn ${manageTab === 'methods' ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '12px 18px',
                                fontSize: '15px',
                                fontWeight: 600,
                                border: 'none',
                                borderBottom: manageTab === 'methods' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
                                backgroundColor: 'transparent',
                                color: manageTab === 'methods' ? '#7c3aed' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                            }}
                            onClick={() => setManageTab('methods')}
                        >
                            Suggested Teaching Methods
                        </button>
                        <button
                            className={`manage-tab-btn ${manageTab === 'opportunities' ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '12px 18px',
                                fontSize: '15px',
                                fontWeight: 600,
                                border: 'none',
                                borderBottom: manageTab === 'opportunities' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
                                backgroundColor: 'transparent',
                                color: manageTab === 'opportunities' ? '#7c3aed' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                            }}
                            onClick={() => setManageTab('opportunities')}
                        >
                            University Opportunities
                        </button>
                    </div>

                    {manageTab === 'interests' && (
                        configsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#64748B', gap: '12px' }}>
                                <RefreshCw className="animate-spin" size={24} />
                                <span>Loading Academic Field Configurations...</span>
                            </div>
                        ) : isEditingConfig ? (
                            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', width: '100%', margin: '24px auto' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                                    {configForm.id ? 'Edit Academic Interest Area' : 'Add New Academic Interest Area'}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Academic Area Name</label>
                                    <input
                                        type="text"
                                        className="sync-modal-form-input"
                                        placeholder="e.g. Computing & Information Technology"
                                        value={configForm.interest_field}
                                        onChange={e => setConfigForm(prev => ({ ...prev, interest_field: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Associated Skills (Comma-separated)</label>
                                    <textarea
                                        className="sync-modal-form-input"
                                        style={{ minHeight: '120px', padding: '12px', resize: 'vertical' }}
                                        placeholder="e.g. Machine Learning, Neural Networks, PyTorch, TensorFlow"
                                        value={configForm.skills}
                                        onChange={e => setConfigForm(prev => ({ ...prev, skills: e.target.value }))}
                                        required
                                    />
                                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>Input a list of related skills separated by commas.</span>
                                </div>
                                <div className="sync-modal-form-actions" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    <button type="button" className="admin-btn-outline" onClick={() => setIsEditingConfig(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="admin-btn-primary">
                                        Save Configuration
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {configs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>No academic interest fields configured. Click "Add Category" to create one.</div>
                                ) : (
                                    configs.map(cfg => (
                                        <div key={cfg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', gap: '20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{cfg.interest_field}</span>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {cfg.skills.map((skill: string) => (
                                                        <span key={skill} style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', background: '#EDE9FE', color: '#7C3AED', borderRadius: '20px' }}>
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="admin-btn-outline"
                                                    style={{ padding: '6px 12px', fontSize: '12px', height: '34px' }}
                                                    onClick={() => {
                                                        setIsEditingConfig(true);
                                                        setConfigForm({
                                                            id: cfg.id,
                                                            interest_field: cfg.interest_field,
                                                            skills: cfg.skills.join(', ')
                                                        });
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="admin-btn-outline"
                                                    style={{ padding: '6px 12px', fontSize: '12px', height: '34px', color: '#EF4444', borderColor: '#FCA5A5' }}
                                                    onClick={() => handleDeleteConfig(cfg.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )
                    )}

                    {manageTab === 'methods' && (
                        methodsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#64748B', gap: '12px' }}>
                                <RefreshCw className="animate-spin" size={24} />
                                <span>Loading Teaching Methods...</span>
                            </div>
                        ) : isEditingMethod ? (
                            <form onSubmit={handleSaveMethod} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', width: '100%', margin: '24px auto' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                                    {methodForm.id ? 'Edit Teaching Method' : 'Add New Teaching Method'}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Teaching Method Name</label>
                                    <input
                                        type="text"
                                        className="sync-modal-form-input"
                                        placeholder="e.g. Practical Labs"
                                        value={methodForm.method_name}
                                        onChange={e => setMethodForm(prev => ({ ...prev, method_name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="sync-modal-form-actions" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    <button type="button" className="admin-btn-outline" onClick={() => setIsEditingMethod(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="admin-btn-primary">
                                        Save Method
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {teachingMethodsList.length === 0 ? (
                                    <div style={{ textAlign: 'center', width: '100%', padding: '40px 0', color: '#94A3B8' }}>No teaching methods configured. Click "Add Method" to create one.</div>
                                ) : (
                                    teachingMethodsList.map(method => (
                                        <div key={method.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#F0F4FF', border: '1px solid #C7D2FE', borderRadius: '100px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#3730A3' }}>{method.method_name}</span>
                                            <button
                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px', borderRadius: '50%' }}
                                                onClick={() => handleDeleteMethod(method.id)}
                                                title="Delete"
                                                onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )
                    )}

                    {manageTab === 'opportunities' && (
                        opportunitiesLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#64748B', gap: '12px' }}>
                                <RefreshCw className="animate-spin" size={24} />
                                <span>Loading Opportunities...</span>
                            </div>
                        ) : isEditingOpportunity ? (
                            <form onSubmit={handleSaveOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', width: '100%', margin: '24px auto' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                                    {opportunityForm.id ? 'Edit Opportunity Name' : 'Add New University Opportunity'}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Opportunity Title</label>
                                    <input
                                        type="text"
                                        className="sync-modal-form-input"
                                        placeholder="e.g. Industry Internships"
                                        value={opportunityForm.opportunity_name}
                                        onChange={e => setOpportunityForm(prev => ({ ...prev, opportunity_name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="sync-modal-form-actions" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    <button type="button" className="admin-btn-outline" onClick={() => setIsEditingOpportunity(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="admin-btn-primary">
                                        Save Opportunity
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {opportunitiesList.length === 0 ? (
                                    <div style={{ textAlign: 'center', width: '100%', padding: '40px 0', color: '#94A3B8' }}>No university opportunities configured. Click "Add Opportunity" to create one.</div>
                                ) : (
                                    opportunitiesList.map(opp => (
                                        <div key={opp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: '100px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#7C3AED' }}>{opp.opportunity_name}</span>
                                            <button
                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px', borderRadius: '50%' }}
                                                onClick={() => handleDeleteOpportunity(opp.id)}
                                                title="Delete"
                                                onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>
        );
    }




    return (
        <div className="ai-analytics-page" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <div className="admin-page-header">
                <div>
                    <button
                        className="cm-back-text-btn"
                        onClick={() => setFormType(null)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', fontWeight: 600, fontSize: '14px', marginBottom: '20px', padding: 0 }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h1 className="admin-page-title">Configure Industry Requirements Form</h1>
                    <p className="admin-page-subtitle">Configure industry sectors, primary academic domains, and associated sub-disciplines.</p>
                </div>

                {!isEditingSector && !isEditingIndConfig && (
                    <button
                        className="admin-btn-primary"
                        onClick={() => {
                            if (industryTab === 'sectors') {
                                setIsEditingSector(true);
                                setSectorForm({ id: undefined, sector_name: '' });
                            } else {
                                setIsEditingIndConfig(true);
                                setIndConfigForm({ id: undefined, interest_field: '', skills: '' });
                            }
                        }}
                        style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                    >
                        <Plus size={16} /> Add {industryTab === 'sectors' ? 'Sector' : 'Academic Domain'}
                    </button>
                )}
            </div>

            <div className="ai-roadmap-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="manage-tabs" style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px', width: '100%' }}>
                    <button
                        className={`manage-tab-btn ${industryTab === 'sectors' ? 'active' : ''}`}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '12px 18px',
                            fontSize: '15px',
                            fontWeight: 600,
                            border: 'none',
                            borderBottom: industryTab === 'sectors' ? '2.5px solid #10B981' : '2.5px solid transparent',
                            backgroundColor: 'transparent',
                            color: industryTab === 'sectors' ? '#10B981' : '#64748b',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'inherit'
                        }}
                        onClick={() => setIndustryTab('sectors')}
                    >
                        Industry Sectors
                    </button>
                    <button
                        className={`manage-tab-btn ${industryTab === 'interests' ? 'active' : ''}`}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '12px 18px',
                            fontSize: '15px',
                            fontWeight: 600,
                            border: 'none',
                            borderBottom: industryTab === 'interests' ? '2.5px solid #10B981' : '2.5px solid transparent',
                            backgroundColor: 'transparent',
                            color: industryTab === 'interests' ? '#10B981' : '#64748b',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'inherit'
                        }}
                        onClick={() => setIndustryTab('interests')}
                    >
                        Academic Domains & Sub-Disciplines
                    </button>
                </div>

                { }
                {industryTab === 'sectors' && (
                    sectorsLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#64748B', gap: '12px' }}>
                            <RefreshCw className="animate-spin" size={24} />
                            <span>Loading Industry Sectors...</span>
                        </div>
                    ) : isEditingSector ? (
                        <form onSubmit={handleSaveSector} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', width: '100%', margin: '24px auto' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                                {sectorForm.id ? 'Edit Industry Sector' : 'Add New Industry Sector'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Sector Name</label>
                                <input
                                    type="text"
                                    className="sync-modal-form-input"
                                    placeholder="e.g. Information Technology"
                                    value={sectorForm.sector_name}
                                    onChange={e => setSectorForm(prev => ({ ...prev, sector_name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="sync-modal-form-actions" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="button" className="admin-btn-outline" onClick={() => setIsEditingSector(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="admin-btn-primary" style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}>
                                    Save Sector
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {sectors.length === 0 ? (
                                <div style={{ textAlign: 'center', width: '100%', padding: '40px 0', color: '#94A3B8' }}>No industry sectors configured. Click "Add Sector" to create one.</div>
                            ) : (
                                sectors.map(sec => (
                                    <div key={sec.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '100px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#047857' }}>{sec.sector_name}</span>
                                        <button
                                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px', borderRadius: '50%' }}
                                            onClick={() => handleDeleteSector(sec.id)}
                                            title="Delete"
                                            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )
                )}

                { }
                {industryTab === 'interests' && (
                    indConfigsLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#64748B', gap: '12px' }}>
                            <RefreshCw className="animate-spin" size={24} />
                            <span>Loading Academic Field Configurations...</span>
                        </div>
                    ) : isEditingIndConfig ? (
                        <form onSubmit={handleSaveIndConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', width: '100%', margin: '24px auto' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                                {indConfigForm.id ? 'Edit Primary Academic Domain' : 'Add New Primary Academic Domain'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Academic Domain Area</label>
                                <input
                                    type="text"
                                    className="sync-modal-form-input"
                                    placeholder="e.g. Computing & Information Technology"
                                    value={indConfigForm.interest_field}
                                    onChange={e => setIndConfigForm(prev => ({ ...prev, interest_field: e.target.value }))}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Associated Sub-Disciplines (Comma-separated)</label>
                                <textarea
                                    className="sync-modal-form-input"
                                    style={{ minHeight: '120px', padding: '12px', resize: 'vertical' }}
                                    placeholder="e.g. Computer Science, Software Engineering, Cybersecurity, Data Science"
                                    value={indConfigForm.skills}
                                    onChange={e => setIndConfigForm(prev => ({ ...prev, skills: e.target.value }))}
                                    required
                                />
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Input a list of sub-disciplines separated by commas.</span>
                            </div>
                            <div className="sync-modal-form-actions" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="button" className="admin-btn-outline" onClick={() => setIsEditingIndConfig(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="admin-btn-primary" style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}>
                                    Save Configuration
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {indConfigs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>No academic fields configured. Click "Add Academic Domain" to create one.</div>
                            ) : (
                                indConfigs.map(cfg => (
                                    <div key={cfg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', gap: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{cfg.interest_field}</span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {cfg.skills.map((skill: string) => (
                                                    <span key={skill} style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', background: '#D1FAE5', color: '#047857', borderRadius: '20px' }}>
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="admin-btn-outline"
                                                style={{ padding: '6px 12px', fontSize: '12px', height: '34px' }}
                                                onClick={() => {
                                                    setIsEditingIndConfig(true);
                                                    setIndConfigForm({
                                                        id: cfg.id,
                                                        interest_field: cfg.interest_field,
                                                        skills: cfg.skills.join(', ')
                                                    });
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="admin-btn-outline"
                                                style={{ padding: '6px 12px', fontSize: '12px', height: '34px', color: '#EF4444', borderColor: '#FCA5A5' }}
                                                onClick={() => handleDeleteIndConfig(cfg.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )
                )}
            </div>
            {confirmModal.isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes scaleIn {
                            from { transform: scale(0.95); opacity: 0; }
                            to { transform: scale(1); opacity: 1; }
                        }
                    `}</style>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '20px',
                        padding: '32px',
                        maxWidth: '440px',
                        width: '100%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>{confirmModal.title}</h3>
                            <p style={{ margin: 0, fontSize: '15px', color: '#64748B', lineHeight: 1.5 }}>{confirmModal.message}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                className="admin-btn-outline"
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    confirmModal.onConfirm();
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                }}
                                style={{ backgroundColor: '#EF4444', border: 'none', color: '#FFFFFF', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
