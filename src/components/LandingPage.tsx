import { useNavigate } from 'react-router-dom';
import {
    FileSearch, Car, FileText, DollarSign, ClipboardCheck,
    ArrowRight, Sparkles, CheckCircle2, Clock
} from 'lucide-react';

interface UseCaseCard {
    id: string;
    title: string;
    description: string;
    icon: any;
    gradient: string;
    features: string[];
    status: 'active' | 'coming-soon';
    route?: string;
    externalUrl?: string;
}

const useCases: UseCaseCard[] = [
    {
        id: 'audit-oversight',
        title: 'GLIF Audit Oversight',
        description: 'Comprehensive batch claim auditing with AI-powered portfolio analysis',
        icon: FileSearch,
        gradient: 'from-blue-600 to-blue-800',
        features: [
            'Batch claim auditing',
            'Portfolio view & analytics',
            'Single file audit',
            'Real-time monitoring'
        ],
        status: 'active',
        route: '/audit-oversight'
    },
    {
        id: 'auto-claims',
        title: 'GLIF Auto Claims',
        description: 'Automated claims validation against policy SOPs and standards',
        icon: Car,
        gradient: 'from-sky-500 to-blue-600',
        features: [
            'Claims validation',
            'SOP management',
            'Checkpost linking',
            'Compliance tracking'
        ],
        status: 'active',
        externalUrl: 'http://localhost:5002/rules-engine/auto-claims/'
    },
    {
        id: 'contract-review',
        title: 'GLIF Contract Review',
        description: 'Intelligent contract validation against playbook standards',
        icon: FileText,
        gradient: 'from-emerald-500 to-green-600',
        features: [
            'Contract validation',
            'Playbook standards',
            'Clause compliance',
            'Risk scoring'
        ],
        status: 'active',
        externalUrl: 'http://localhost:5002/rules-engine/contract-review/'
    },
    {
        id: 'loan-covenant',
        title: 'GLIF Loan Covenant',
        description: 'Loan agreement validation and covenant compliance checking',
        icon: DollarSign,
        gradient: 'from-purple-500 to-indigo-600',
        features: [
            'Loan agreement validation',
            'Covenant compliance',
            'Financial ratio checks',
            'Alert management'
        ],
        status: 'coming-soon'
    },
    {
        id: 'underwriting',
        title: 'GLIF Underwriting',
        description: 'Underwriting decision audit and policy compliance verification',
        icon: ClipboardCheck,
        gradient: 'from-orange-500 to-red-600',
        features: [
            'Underwriting audit',
            'Policy compliance',
            'Risk assessment',
            'Decision tracking'
        ],
        status: 'coming-soon'
    }
];

export default function LandingPage() {
    const navigate = useNavigate();

    const handleCardClick = (useCase: UseCaseCard) => {
        if (useCase.status === 'coming-soon') return;

        if (useCase.route) {
            navigate(useCase.route);
        } else if (useCase.externalUrl) {
            window.location.href = useCase.externalUrl;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                                <Sparkles className="w-8 h-8 text-blue-600" />
                                GLIF Platform
                            </h1>
                            <p className="text-sm text-gray-600 mt-2">
                                AI-Powered Insurance Intelligence Suite
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                Documentation
                            </button>
                            <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg">
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Choose Your Use Case
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Select from our suite of AI-powered tools designed to streamline insurance operations,
                        ensure compliance, and accelerate decision-making.
                    </p>
                </div>

                {/* Use Case Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {useCases.map((useCase) => {
                        const Icon = useCase.icon;
                        const isComingSoon = useCase.status === 'coming-soon';

                        return (
                            <div
                                key={useCase.id}
                                onClick={() => handleCardClick(useCase)}
                                className={`
                  relative bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden
                  transition-all duration-300 group
                  ${isComingSoon
                                        ? 'opacity-75 cursor-not-allowed'
                                        : 'cursor-pointer hover:shadow-2xl hover:-translate-y-2 hover:border-blue-300'
                                    }
                `}
                            >
                                {/* Gradient Header */}
                                <div className={`h-32 bg-gradient-to-br ${useCase.gradient} relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/10"></div>
                                    <div className="absolute top-4 right-4">
                                        {isComingSoon ? (
                                            <span className="px-3 py-1 bg-white/90 text-gray-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Coming Soon
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-white/90 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute bottom-4 left-6">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 pt-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {useCase.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                        {useCase.description}
                                    </p>

                                    {/* Features */}
                                    <ul className="space-y-2 mb-6">
                                        {useCase.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${useCase.gradient}`}></div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Action Button */}
                                    {!isComingSoon && (
                                        <button
                                            className={`
                        w-full py-3 px-4 rounded-lg font-medium text-white
                        bg-gradient-to-r ${useCase.gradient}
                        hover:shadow-lg transition-all duration-300
                        flex items-center justify-center gap-2
                        group-hover:gap-3
                      `}
                                        >
                                            Launch Module
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    )}
                                </div>

                                {/* Hover Effect Overlay */}
                                {!isComingSoon && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Stats Section */}
                <div className="grid md:grid-cols-4 gap-6 mt-12">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                        <div className="text-3xl font-bold text-blue-600 mb-1">3</div>
                        <div className="text-sm text-gray-600">Active Modules</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                        <div className="text-3xl font-bold text-green-600 mb-1">2</div>
                        <div className="text-sm text-gray-600">Coming Soon</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                        <div className="text-3xl font-bold text-purple-600 mb-1">100%</div>
                        <div className="text-sm text-gray-600">AI-Powered</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                        <div className="text-3xl font-bold text-orange-600 mb-1">24/7</div>
                        <div className="text-sm text-gray-600">Availability</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
