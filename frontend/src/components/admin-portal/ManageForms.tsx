import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Database, RefreshCw, Trash2, Edit } from 'lucide-react';
import { studentInterestService } from '../../services/apiService';
import './AIAnalytics.css'; // Leverage existing dashboard styles and variables

export const ManageForms: React.FC = () => {
    const navigate = useNavigate();
    const [manageTab, setManageTab] = useState<'interests' | 'methods' | 'opportunities'>('interests');

    // Academic fields states
    const [configs, setConfigs] = useState<any[]>([]);
    const [configsLoading, setConfigsLoading] = useState(false);
    const [isEditingConfig, setIsEditingConfig] = useState(false);
    const [configForm, setConfigForm] = useState({
        id: undefined as number | undefined,
        interest_field: '',
        skills: ''
    });

    // Teaching methods states
    const [teachingMethodsList, setTeachingMethodsList] = useState<any[]>([]);
    const [methodsLoading, setMethodsLoading] = useState(false);
    const [isEditingMethod, setIsEditingMethod] = useState(false);
    const [methodForm, setMethodForm] = useState({
        id: undefined as number | undefined,
        method_name: ''
    });

    // University opportunities states
    const [opportunitiesList, setOpportunitiesList] = useState<any[]>([]);
    const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
    const [isEditingOpportunity, setIsEditingOpportunity] = useState(false);
    const [opportunityForm, setOpportunityForm] = useState({
        id: undefined as number | undefined,
        opportunity_name: ''
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

    useEffect(() => {
        if (manageTab === 'interests') {
            fetchConfigs();
        } else if (manageTab === 'methods') {
            fetchTeachingMethods();
        } else if (manageTab === 'opportunities') {
            fetchUniversityOpportunities();
        }
    }, [manageTab]);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!configForm.interest_field.trim() || !configForm.skills.trim()) {
            alert('Please fill out all fields.');
            return;
        }

        const skillsArray = configForm.skills
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        try {
            await studentInterestService.saveConfig({
                id: configForm.id,
                interest_field: configForm.interest_field.trim(),
                skills: skillsArray
            });
            alert('Academic field saved successfully.');
            setIsEditingConfig(false);
            setConfigForm({ id: undefined, interest_field: '', skills: '' });
            fetchConfigs();
        } catch (err: any) {
            alert('Failed to save config: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteConfig = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this academic interest area?')) return;
        try {
            await studentInterestService.deleteConfig(id);
            alert('Academic interest area deleted successfully.');
            fetchConfigs();
        } catch (err: any) {
            alert('Failed to delete config: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleSaveMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!methodForm.method_name.trim()) {
            alert('Please enter a teaching method name.');
            return;
        }

        try {
            await studentInterestService.saveTeachingMethod({
                id: methodForm.id,
                method_name: methodForm.method_name.trim()
            });
            alert('Teaching method saved successfully.');
            setIsEditingMethod(false);
            setMethodForm({ id: undefined, method_name: '' });
            fetchTeachingMethods();
        } catch (err: any) {
            alert('Failed to save teaching method: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteMethod = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this teaching method?')) return;
        try {
            await studentInterestService.deleteTeachingMethod(id);
            alert('Teaching method deleted successfully.');
            fetchTeachingMethods();
        } catch (err: any) {
            alert('Failed to delete teaching method: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleSaveOpportunity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!opportunityForm.opportunity_name.trim()) {
            alert('Please enter a university opportunity name.');
            return;
        }

        try {
            await studentInterestService.saveUniversityOpportunity({
                id: opportunityForm.id,
                opportunity_name: opportunityForm.opportunity_name.trim()
            });
            alert('University opportunity saved successfully.');
            setIsEditingOpportunity(false);
            setOpportunityForm({ id: undefined, opportunity_name: '' });
            fetchUniversityOpportunities();
        } catch (err: any) {
            alert('Failed to save university opportunity: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteOpportunity = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this university opportunity?')) return;
        try {
            await studentInterestService.deleteUniversityOpportunity(id);
            alert('University opportunity deleted successfully.');
            fetchUniversityOpportunities();
        } catch (err: any) {
            alert('Failed to delete university opportunity: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="ai-analytics-page" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            {/* Header Section */}
            <div className="admin-page-header">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <button
                        className="cm-back-text-btn"
                        onClick={() => navigate('/admin/ai-analytics')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', fontWeight: 600, fontSize: '14px', marginBottom: '8px', padding: 0 }}
                    >
                        <ArrowLeft size={16} /> Back to AI Analytics
                    </button>
                    <h1 className="admin-page-title">Manage Survey Configurations</h1>
                    <p className="admin-page-subtitle">Configure interest areas, custom skills, teaching methods, and student support opportunities.</p>
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

            {/* Main Panel Content Card */}
            <div className="ai-roadmap-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Tab Controls */}
                {!isEditingConfig && !isEditingMethod && !isEditingOpportunity && (
                    <div className="manage-tabs" style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px' }}>
                        <button
                            className={`manage-tab-btn ${manageTab === 'interests' ? 'active' : ''}`}
                            style={{
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
                )}

                {/* Tab 1 Content: Academic Fields & Skills */}
                {manageTab === 'interests' && (
                    configsLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#64748B', gap: '12px' }}>
                            <RefreshCw className="animate-spin" size={24} />
                            <span>Loading Academic Field Configurations...</span>
                        </div>
                    ) : isEditingConfig ? (
                        <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                                {configForm.id ? 'Edit Academic Interest Area' : 'Add New Academic Interest Area'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Academic Area Name</label>
                                <input
                                    type="text"
                                    className="sync-modal-form-input"
                                    placeholder="e.g. Artificial Intelligence"
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

                {/* Tab 2 Content: Suggested Teaching Methods */}
                {manageTab === 'methods' && (
                    methodsLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#64748B', gap: '12px' }}>
                            <RefreshCw className="animate-spin" size={24} />
                            <span>Loading Teaching Methods...</span>
                        </div>
                    ) : isEditingMethod ? (
                        <form onSubmit={handleSaveMethod} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
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
                                    <div key={method.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#F0F4FF', border: '1px solid #C7D2FE', borderRadius: '100px', transition: 'all 0.2s' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#3730A3' }}>{method.method_name}</span>
                                        <button
                                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px', borderRadius: '50%', transition: 'color 0.2s' }}
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

                {/* Tab 3 Content: University Opportunities */}
                {manageTab === 'opportunities' && (
                    opportunitiesLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#64748B', gap: '12px' }}>
                            <RefreshCw className="animate-spin" size={24} />
                            <span>Loading Opportunities...</span>
                        </div>
                    ) : isEditingOpportunity ? (
                        <form onSubmit={handleSaveOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
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
                                    <div key={opp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: '100px', transition: 'all 0.2s' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#7C3AED' }}>{opp.opportunity_name}</span>
                                        <button
                                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px', borderRadius: '50%', transition: 'color 0.2s' }}
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
};
