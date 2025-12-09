import React from 'react';
import { FaFilePdf, FaFileCsv, FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaDownload } from 'react-icons/fa';

const Compliance: React.FC = () => {
    // Mock Compliance Data
    const reports = [
        { id: 1, name: 'Monthly User Access Review', type: 'PDF', date: '2025-12-01', size: '1.2 MB', status: 'Generated' },
        { id: 2, name: 'System Security Audit', type: 'PDF', date: '2025-11-28', size: '4.5 MB', status: 'Generated' },
        { id: 3, name: 'Data Privacy Compliance (GDPR)', type: 'CSV', date: '2025-11-15', size: '2.8 MB', status: 'Generated' },
        { id: 4, name: 'Failed Login Attempts Report', type: 'CSV', date: '2025-12-09', size: '0.4 MB', status: 'Generated' },
    ];

    const cardStyle = "bg-white backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl overflow-hidden p-6 transition-all duration-300 hover:shadow-2xl";

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-[#051747]">Compliance & Reports</h2>
                <p className="text-[#535F80]">Generate and download system reports for internal audits and regulatory compliance.</p>
            </div>

            {/* Compliance Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${cardStyle} flex items-start justify-between border-l-4 border-green-500`}>
                    <div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Overall Status</p>
                        <h3 className="text-2xl font-bold text-[#051747] mt-1">Compliant</h3>
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                            {/* @ts-ignore */}
                            <FaCheckCircle /> System Secure
                        </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                        {/* @ts-ignore */}
                        <FaShieldAlt className="text-green-600 text-xl" />
                    </div>
                </div>

                <div className={`${cardStyle} flex items-start justify-between border-l-4 border-blue-500`}>
                    <div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Last Audit</p>
                        <h3 className="text-2xl font-bold text-[#051747] mt-1">12 Days Ago</h3>
                        <p className="text-sm text-blue-600 mt-2">Nov 28, 2025</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                        {/* @ts-ignore */}
                        <FaCheckCircle className="text-blue-600 text-xl" />
                    </div>
                </div>

                <div className={`${cardStyle} flex items-start justify-between border-l-4 border-yellow-500`}>
                    <div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pending Reviews</p>
                        <h3 className="text-2xl font-bold text-[#051747] mt-1">3 Alerts</h3>
                        <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                            {/* @ts-ignore */}
                            <FaExclamationTriangle /> Action Required
                        </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-xl">
                        {/* @ts-ignore */}
                        <FaExclamationTriangle className="text-yellow-600 text-xl" />
                    </div>
                </div>
            </div>

            {/* Reports Section */}
            <div className="bg-white backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[#051747]">Available Reports</h3>
                    <button className="text-sm text-blue-600 font-semibold hover:text-blue-800">
                        View Archive →
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {reports.map((report) => (
                        <div key={report.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${report.type === 'PDF' ? 'bg-red-50' : 'bg-green-50'}`}>
                                    {report.type === 'PDF' ? (
                                        // @ts-ignore
                                        <FaFilePdf className="text-red-500 text-xl" />
                                    ) : (
                                        // @ts-ignore
                                        <FaFileCsv className="text-green-600 text-xl" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">{report.name}</h4>
                                    <p className="text-sm text-gray-500">Generated on {report.date} • {report.size}</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                                {/* @ts-ignore */}
                                <FaDownload className="text-sm" />
                                Download
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-gray-50">
                    <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all">
                        Generate New Compliance Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Compliance;
