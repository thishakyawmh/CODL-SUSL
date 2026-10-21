import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, Plus, Trash2, Search, Check, X, Loader,
    ChevronRight, CheckSquare, Square, RefreshCw, ArrowLeftRight
} from 'lucide-react';
import { courseService, batchService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './CourseManagement.css';

interface EnrolledStudent {
    id: string;
    real_id?: number | string;
    student_number?: string;
    name: string;
    displayName?: string;
    email: string;
    batch?: string;
    group?: string | null;
    enrollmentDate?: string;
}

interface BatchInfo {
    id: number;
    name: string;
    status?: string;
    groups?: string[];
}

export const BatchGroupManagement: React.FC = () => {
    const { id, batchId } = useParams<{ id: string; batchId: string }>();
    const navigate = useNavigate();

    const [courseTitle, setCourseTitle] = useState<string>('');
    const [currentBatch, setCurrentBatch] = useState<BatchInfo | null>(null);
    const [students, setStudents] = useState<EnrolledStudent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Group editing state
    const [groupList, setGroupList] = useState<string[]>([]);
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [studentGroupAssignments, setStudentGroupAssignments] = useState<{ [studentId: string]: string | null }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGroup, setFilterGroup] = useState<string>('all');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [bulkTargetGroup, setBulkTargetGroup] = useState<string>('');
    const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);

    const checkBatchMatch = (s: EnrolledStudent, b: BatchInfo, totalBatches: number): boolean => {
        if (!s) return false;
        if (s.batch) {
            const sb = s.batch.toString().trim().toLowerCase();
            const tbName = b.name.toString().trim().toLowerCase();
            const tbId = b.id.toString();
            if (sb === tbName || sb === tbId) return true;

            const cleanSb = sb.replace(/\s+/g, '').replace(/batch0*/i, 'batch');
            const cleanTb = tbName.replace(/\s+/g, '').replace(/batch0*/i, 'batch');
            if (cleanSb === cleanTb) return true;
        }
        if (!s.batch && totalBatches === 1) {
            return true;
        }
        return false;
    };

    const loadData = async () => {
        if (!id || !batchId) return;
        try {
            setIsLoading(true);
            const data = await courseService.getManageCourseData(id, { refresh: true });
            if (data?.course) {
                setCourseTitle(data.course.title || 'Course');
            }

            const rawBatches: BatchInfo[] = (data?.batches || []).map((b: any) => {
                let parsedGroups: string[] = [];
                if (Array.isArray(b.groups)) {
                    parsedGroups = b.groups;
                } else if (typeof b.groups === 'string') {
                    try {
                        const parsed = JSON.parse(b.groups);
                        if (Array.isArray(parsed)) parsedGroups = parsed;
                    } catch (e) {
                        parsedGroups = [];
                    }
                }
                return {
                    id: b.id,
                    name: b.name,
                    status: b.status,
                    groups: parsedGroups
                };
            });

            // Match target batch by ID or by name
            const foundBatch = rawBatches.find(b => b.id.toString() === batchId.toString() || b.name === batchId);
            if (!foundBatch) {
                toast.error(`Batch not found for this course.`);
                navigate(`/admin/courses/manage/${id}`);
                return;
            }
            setCurrentBatch(foundBatch);
            setGroupList(foundBatch.groups || []);
            if (foundBatch.groups && foundBatch.groups.length > 0) {
                setBulkTargetGroup(foundBatch.groups[0]);
            }

            // Extract students belonging to THIS batch safely
            const allEnrolled: EnrolledStudent[] = data?.enrolled_students || data?.students || [];
            const rawStudents: EnrolledStudent[] = allEnrolled.filter(s =>
                checkBatchMatch(s, foundBatch, rawBatches.length)
            );
            setStudents(rawStudents);

            // Populate initial assignments
            const initialMap: { [studentId: string]: string | null } = {};
            rawStudents.forEach(s => {
                initialMap[s.id] = s.group || null;
            });
            setStudentGroupAssignments(initialMap);

            // Fetch pending group exchange requests count for this batch
            try {
                const reqRes = await batchService.getGroupRequests(id, foundBatch.id);
                const pCount = (reqRes.requests || []).filter((r: any) => r.status === 'pending').length;
                setPendingRequestsCount(pCount);
            } catch (err) {
                console.warn('Could not load group exchange requests count:', err);
            }

        } catch (err: any) {
            console.error('Failed to load batch group data:', err);
            toast.error(err.response?.data?.message || 'Failed to load batch groups data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id, batchId]);

    const handleAddGroup = () => {
        const trimmed = newGroupName.trim();
        if (!trimmed) {
            toast.error('Please enter a group name (e.g. Group A)');
            return;
        }
        if (groupList.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
            toast.error(`Group "${trimmed}" already exists.`);
            return;
        }
        const updated = [...groupList, trimmed];
        setGroupList(updated);
        setNewGroupName('');
        setIsAddingGroup(false);
        if (!bulkTargetGroup) setBulkTargetGroup(trimmed);
        toast.success(`Group "${trimmed}" added.`);
    };

    const handleRemoveGroup = (groupToRemove: string) => {
        const countUsing = Object.values(studentGroupAssignments).filter(g => g === groupToRemove).length;
        if (countUsing > 0) {
            if (!window.confirm(`There are ${countUsing} student(s) currently assigned to "${groupToRemove}". Removing this group will set them to Unassigned. Continue?`)) {
                return;
            }
            setStudentGroupAssignments(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(stId => {
                    if (next[stId] === groupToRemove) next[stId] = null;
                });
                return next;
            });
        }
        setGroupList(prev => prev.filter(g => g !== groupToRemove));
        toast.info(`Group "${groupToRemove}" removed.`);
    };

    const handleBulkAssign = () => {
        if (selectedStudentIds.length === 0) {
            toast.error('Please select at least one student.');
            return;
        }
        setStudentGroupAssignments(prev => {
            const next = { ...prev };
            selectedStudentIds.forEach(stId => {
                next[stId] = bulkTargetGroup || null;
            });
            return next;
        });
        toast.success(`Moved ${selectedStudentIds.length} student(s) to ${bulkTargetGroup || 'Unassigned'}.`);
        setSelectedStudentIds([]);
    };

    const handleToggleSelectAll = (filteredIds: string[]) => {
        const allSelected = filteredIds.length > 0 && filteredIds.every(stId => selectedStudentIds.includes(stId));
        if (allSelected) {
            setSelectedStudentIds(prev => prev.filter(stId => !filteredIds.includes(stId)));
        } else {
            setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
        }
    };

    const handleSave = async () => {
        if (!currentBatch || !id) return;
        try {
            setIsSaving(true);
            const assignments = students.map(s => ({
                student_id: s.real_id ? s.real_id.toString() : s.id,
                group: studentGroupAssignments[s.id] || null,
                set_batch: true
            }));

            await batchService.manageGroups(id, currentBatch.id, {
                groups: groupList,
                assignments: assignments
            });

            toast.success(`Groups for batch "${currentBatch.name}" saved successfully!`);
            await loadData();
        } catch (err: any) {
            console.error('Failed to save batch groups:', err);
            toast.error(err.response?.data?.message || 'Failed to save batch groups.');
        } finally {
            setIsSaving(false);
        }
    };

    // Filtered student list by search & group filter
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const currentG = studentGroupAssignments[s.id] || null;
            const matchesSearch = !searchQuery.trim() ||
                (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.displayName && s.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.id && s.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.student_number && s.student_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesGroup = filterGroup === 'all' ||
                (filterGroup === 'unassigned' ? !currentG : currentG === filterGroup);

            return matchesSearch && matchesGroup;
        });
    }, [students, studentGroupAssignments, searchQuery, filterGroup]);

    const totalStudents = students.length;
    const assignedStudentsCount = Object.values(studentGroupAssignments).filter(Boolean).length;
    const unassignedStudentsCount = Math.max(0, totalStudents - assignedStudentsCount);

    if (isLoading) {
        return (
            <div className="cm-container" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <Loader size={36} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--primary-color)' }} />
                <p style={{ color: '#64748B', fontSize: '15px', fontWeight: 600 }}>Loading Batch Group Management...</p>
            </div>
        );
    }

    if (!currentBatch) {
        return null;
    }

    return (
        <div className="cm-container" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* Top Navigation & Breadcrumb */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    className="am-back-btn"
                    onClick={() => navigate(`/admin/courses/manage/${id}`)}
                    title="Back to Course Management"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="admin-breadcrumb">
                    <span onClick={() => navigate('/admin/courses')}>Course Management</span>
                    <ChevronRight size={14} />
                    <span onClick={() => navigate(`/admin/courses/manage/${id}`)}>{courseTitle}</span>
                    <ChevronRight size={14} />
                    <span onClick={() => navigate(`/admin/courses/manage/${id}?batch=${encodeURIComponent(currentBatch.name)}`)}>{currentBatch.name}</span>
                    <ChevronRight size={14} />
                    <span className="current">Batch Groups Management</span>
                </div>
            </div>

            {/* Page Header */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '28px 32px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#F5F3FF', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={28} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                {currentBatch.name} — Group Management
                            </h1>
                            <p style={{ color: '#64748B', fontSize: '14px', margin: '4px 0 0 0' }}>
                                Create groups for this batch, assign students, and exchange students between groups.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {/* View Exchange Requests Button */}
                        <button
                            type="button"
                            className="admin-btn-outline"
                            onClick={() => navigate(`/admin/courses/manage/${id}/batches/${currentBatch.id}/exchange-requests`)}
                            title="View student group exchange requests"
                            style={{
                                height: '42px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                borderColor: pendingRequestsCount > 0 ? '#F59E0B' : '#E2E8F0',
                                background: pendingRequestsCount > 0 ? '#FFFBEB' : '#FFFFFF',
                                color: pendingRequestsCount > 0 ? '#B45309' : '#334155'
                            }}
                        >
                            <ArrowLeftRight size={16} />
                            <span>View Exchange Requests</span>
                            {pendingRequestsCount > 0 && (
                                <span style={{
                                    background: '#EF4444',
                                    color: '#FFFFFF',
                                    padding: '2px 7px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: 800
                                }}>
                                    {pendingRequestsCount}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            className="admin-btn-outline"
                            onClick={() => loadData()}
                            title="Refresh Data"
                            style={{ height: '42px', padding: '0 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <RefreshCw size={15} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            className="admin-btn-primary"
                            style={{
                                height: '42px',
                                padding: '0 24px',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 700,
                                background: 'var(--primary-color)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                border: 'none',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.7 : 1
                            }}
                            disabled={isSaving}
                            onClick={handleSave}
                        >
                            {isSaving ? (
                                <>
                                    <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    <span>Save Group Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Summary Cards (Course Enrolled removed per request) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '24px' }}>
                    <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '16px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Batch Students</span>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{totalStudents}</div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '16px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Defined Groups</span>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-color)', marginTop: '4px' }}>{groupList.length}</div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '16px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned</span>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>{assignedStudentsCount}</div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '16px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unassigned</span>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: unassignedStudentsCount > 0 ? '#F59E0B' : '#64748B', marginTop: '4px' }}>{unassignedStudentsCount}</div>
                    </div>
                </div>
            </div>

            {/* Section 1: Manage Groups Creation */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '24px 28px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                marginBottom: '24px'
            }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} style={{ color: 'var(--primary-color)' }} />
                    Groups in this Batch
                </h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    {groupList.map(g => {
                        const count = Object.values(studentGroupAssignments).filter(val => val === g).length;
                        return (
                            <span
                                key={g}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 14px',
                                    borderRadius: '12px',
                                    background: '#F5F3FF',
                                    color: 'var(--primary-color)',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    border: '1px solid #DDD6FE'
                                }}
                            >
                                <span>{g}</span>
                                <span style={{ background: '#EDE9FE', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', color: '#6D28D9' }}>
                                    {count} {count === 1 ? 'student' : 'students'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveGroup(g)}
                                    title={`Remove ${g}`}
                                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </span>
                        );
                    })}

                    {groupList.length === 0 && !isAddingGroup && (
                        <span style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic', marginRight: '6px' }}>
                            No groups defined yet.
                        </span>
                    )}

                    {/* Clean + Add Group Button & Inline Form */}
                    {!isAddingGroup ? (
                        <button
                            type="button"
                            className="admin-btn-secondary"
                            onClick={() => setIsAddingGroup(true)}
                            style={{
                                height: '36px',
                                padding: '0 14px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Plus size={16} /> Add Group
                        </button>
                    ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '4px 6px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                            <input
                                type="text"
                                autoFocus
                                placeholder="e.g. Group A"
                                className="admin-input"
                                style={{
                                    height: '34px',
                                    width: '180px',
                                    fontSize: '13px',
                                    borderRadius: '8px',
                                    padding: '0 12px',
                                    boxSizing: 'border-box'
                                }}
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddGroup();
                                    } else if (e.key === 'Escape') {
                                        setIsAddingGroup(false);
                                        setNewGroupName('');
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="admin-btn-primary"
                                style={{ height: '34px', padding: '0 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={handleAddGroup}
                            >
                                <Check size={14} /> Add
                            </button>
                            <button
                                type="button"
                                className="admin-btn-outline"
                                style={{ height: '34px', padding: '0 10px', borderRadius: '8px', fontSize: '12px' }}
                                onClick={() => { setIsAddingGroup(false); setNewGroupName(''); }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 2: Student Allocation Table & Bulk Controls */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '24px 28px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                            Student Group Allocation & Exchange
                        </h3>
                        <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
                            Assign students to groups, or move students between groups with the dropdown selectors.
                        </p>
                    </div>

                    {/* Filter and Search Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Search Input with Proper Line Height & Box-Sizing */}
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Search by name, ID, email..."
                                className="admin-input"
                                style={{
                                    paddingLeft: '36px',
                                    paddingRight: '14px',
                                    height: '42px',
                                    width: '260px',
                                    fontSize: '13px',
                                    borderRadius: '10px',
                                    boxSizing: 'border-box'
                                }}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter by Group */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Filter:</span>
                            <select
                                className="admin-input"
                                style={{ height: '42px', minWidth: '140px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', boxSizing: 'border-box' }}
                                value={filterGroup}
                                onChange={e => setFilterGroup(e.target.value)}
                            >
                                <option value="all">All Groups ({students.length})</option>
                                {groupList.map(g => (
                                    <option key={g} value={g}>
                                        {g} ({Object.values(studentGroupAssignments).filter(v => v === g).length})
                                    </option>
                                ))}
                                <option value="unassigned">
                                    Unassigned ({Object.values(studentGroupAssignments).filter(v => !v).length})
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar (HIDDEN BY DEFAULT; ONLY SHOWN IF AT LEAST 1 STUDENT IS SELECTED) */}
                {selectedStudentIds.length > 0 && groupList.length > 0 && (
                    <div style={{
                        background: '#F5F3FF',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        border: '1px solid #DDD6FE',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                            <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{selectedStudentIds.length}</span> of {filteredStudents.length} students selected
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Assign selected to:</span>
                            <select
                                className="admin-input"
                                style={{ height: '38px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', boxSizing: 'border-box' }}
                                value={bulkTargetGroup}
                                onChange={e => setBulkTargetGroup(e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {groupList.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="admin-btn-primary"
                                style={{ height: '38px', padding: '0 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
                                onClick={handleBulkAssign}
                            >
                                Apply to Selected
                            </button>
                        </div>
                    </div>
                )}

                {/* Student Table */}
                <div className="cm-table-container premium-table-wrapper" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table className="cm-table interactive-table">
                        <thead>
                            <tr>
                                <th style={{ width: '48px', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                                        onClick={() => handleToggleSelectAll(filteredStudents.map(s => s.id))}
                                        title={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id)) ? "Deselect All" : "Select All"}
                                    >
                                        {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id)) ? (
                                            <CheckSquare size={18} style={{ color: 'var(--primary-color)' }} />
                                        ) : (
                                            <Square size={18} style={{ color: '#94A3B8' }} />
                                        )}
                                    </button>
                                </th>
                                <th style={{ width: '38%' }}>Student Details</th>
                                <th style={{ width: '22%' }}>Student ID / Reg No</th>
                                <th style={{ width: '20%' }}>Assigned Group</th>
                                <th style={{ width: '20%' }}>Assign / Exchange Group</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => {
                                const isSelected = selectedStudentIds.includes(student.id);
                                const currentG = studentGroupAssignments[student.id] || null;

                                return (
                                    <tr key={student.id} style={{ background: isSelected ? '#F5F3FF' : 'transparent' }}>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                                                onClick={() => {
                                                    setSelectedStudentIds(prev =>
                                                        isSelected ? prev.filter(id => id !== student.id) : [...prev, student.id]
                                                    );
                                                }}
                                            >
                                                {isSelected ? (
                                                    <CheckSquare size={18} style={{ color: 'var(--primary-color)' }} />
                                                ) : (
                                                    <Square size={18} style={{ color: '#CBD5E1' }} />
                                                )}
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                                                    {(student.displayName || student.name || 'S').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="student-name-bold">{student.displayName || student.name}</div>
                                                    <div className="student-email-muted">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="id-badge-minimal">{student.student_number || student.id}</span>
                                        </td>
                                        <td>
                                            {currentG ? (
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    background: '#F5F3FF',
                                                    color: 'var(--primary-color)',
                                                    border: '1px solid #DDD6FE'
                                                }}>
                                                    {currentG}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Unassigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <select
                                                className="admin-input"
                                                style={{
                                                    height: '38px',
                                                    padding: '0 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    background: currentG ? '#FFFFFF' : '#F8FAFC',
                                                    border: currentG ? '1px solid var(--primary-color)' : '1px solid #CBD5E1',
                                                    cursor: 'pointer',
                                                    minWidth: '150px',
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                                value={currentG || ''}
                                                onChange={e => {
                                                    const val = e.target.value || null;
                                                    setStudentGroupAssignments(prev => ({ ...prev, [student.id]: val }));
                                                }}
                                            >
                                                <option value="">Unassigned</option>
                                                {groupList.map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredStudents.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                        <Users size={44} style={{ opacity: 0.25, marginBottom: '12px' }} />
                        <p style={{ fontWeight: 600, margin: 0 }}>No students found in this batch matching your search or group filter.</p>
                    </div>
                )}

                {/* Bottom Action Footer */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                    <button
                        type="button"
                        className="admin-btn-outline"
                        style={{ height: '42px', padding: '0 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                        onClick={() => navigate(`/admin/courses/manage/${id}`)}
                    >
                        ← Back to Course Management
                    </button>

                    <button
                        type="button"
                        className="admin-btn-primary"
                        style={{
                            height: '42px',
                            padding: '0 28px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 700,
                            background: 'var(--primary-color)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: 'none',
                            cursor: isSaving ? 'not-allowed' : 'pointer'
                        }}
                        disabled={isSaving}
                        onClick={handleSave}
                    >
                        {isSaving ? (
                            <>
                                <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                                <span>Saving Changes...</span>
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                <span>Save Group Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
