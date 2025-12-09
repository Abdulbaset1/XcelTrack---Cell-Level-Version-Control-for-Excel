import React from 'react';
import { FaChartLine, FaChartPie, FaChartBar, FaDownload } from 'react-icons/fa';

const AnalyticsPage: React.FC = () => {
    return (
        <div className="analytics-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">System Analytics</h1>
                        <p className="header-subtitle">Real-time system performance and usage metrics</p>
                    </div>
                    <div className="header-right">
                        <button className="action-btn neu-button" title="Export Report">
                            {/* @ts-ignore */}
                            <FaDownload className="action-icon" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '100%' }}>

                {/* Key Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div className="content-panel glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</h3>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>$124,500</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                                {/* @ts-ignore */}
                                <FaChartLine size={20} />
                            </div>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>↗ +15.3%</span>
                            <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
                        </div>
                    </div>

                    <div className="content-panel glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Projects</h3>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>45</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                                {/* @ts-ignore */}
                                <FaChartBar size={20} />
                            </div>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>↗ +5 new</span>
                            <span style={{ color: 'var(--text-muted)' }}>this week</span>
                        </div>
                    </div>

                    <div className="content-panel glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Storage Used</h3>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>850 GB</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: '#f59e0b' }}>
                                {/* @ts-ignore */}
                                <FaChartPie size={20} />
                            </div>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>⚠ 85% full</span>
                            <span style={{ color: 'var(--text-muted)' }}>upgrade needed</span>
                        </div>
                    </div>
                </div>

                {/* Charts Placeholder */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <div className="content-panel glass-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                        {/* @ts-ignore */}
                        <FaChartLine size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>User Activity Chart Area</p>
                        <span style={{ fontSize: '0.8rem' }}>(Chart integration coming soon)</span>
                    </div>

                    <div className="content-panel glass-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                        {/* @ts-ignore */}
                        <FaChartPie size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Storage Distribution</p>
                        <span style={{ fontSize: '0.8rem' }}>(Chart integration coming soon)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;