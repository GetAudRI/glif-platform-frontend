import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileSearch, FileText, DollarSign, ClipboardCheck, Factory,
    ArrowRight, Sparkles, CheckCircle2, Clock, LogOut, User
} from 'lucide-react';
import LoginModal from './LoginModal';
import { isAuthenticated, getUsername, clearAuth } from '../utils/auth';

declare const __BRANCH__: string;

interface UseCaseCard {
    id: string;
    title: string;
    description: string;
    icon: any;
    features: string[];
    status: 'active' | 'coming-soon';
    route?: string;
    externalUrl?: string;
}

const useCases: UseCaseCard[] = [
    {
        id: 'audit-oversight',
        title: 'AudRI Claims',
        description: 'Comprehensive batch claim auditing with AI-powered portfolio analysis',
        icon: FileSearch,
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
        id: 'vendor-audit',
        title: 'AudRI Compliance',
        description: 'GxP compliance auditing for Life Sciences vendors with automated document review',
        icon: Factory,
        features: [
            'Vendor management',
            'GxP rules library (49 rules)',
            'Compliance auditing',
            'CAPA management'
        ],
        status: 'active',
        route: '/vendor-audit'
    },
    {
        id: 'contract-review',
        title: 'AudRI Contracts',
        description: 'Intelligent contract validation against playbook standards',
        icon: FileText,
        features: [
            'Contract validation',
            'Playbook standards',
            'Clause compliance',
            'Risk scoring'
        ],
        status: 'active',
        route: '/contract-review'
    },
    {
        id: 'invoice-approval',
        title: 'AudRI Spend',
        description: 'Automated invoice validation against contract rules and compliance checking',
        icon: DollarSign,
        features: [
            'Invoice validation against contracts',
            'Automated compliance checking',
            'Approval/rejection recommendations',
            'Audit trail'
        ],
        status: 'active',
        route: '/invoice-approval'
    },
    {
        id: 'loan-covenant',
        title: 'AudRI Loan Covenant',
        description: 'Loan agreement validation and covenant compliance checking',
        icon: DollarSign,
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
        title: 'AudRI Underwriting',
        description: 'Underwriting decision audit and policy compliance verification',
        icon: ClipboardCheck,
        features: [
            'Underwriting audit',
            'Policy compliance',
            'Risk assessment',
            'Decision tracking'
        ],
        status: 'coming-soon'
    }
];

const branchLabel = import.meta.env.VITE_BRANCH_NAME || (typeof __BRANCH__ !== 'undefined' ? __BRANCH__ : 'unknown');
const branchBadgeClass = 'bg-gray-100 text-gray-700 border border-gray-200';

export default function LandingPage() {
    const navigate = useNavigate();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [selectedUseCase, setSelectedUseCase] = useState<UseCaseCard | null>(null);
    const [authenticated, setAuthenticated] = useState(isAuthenticated());
    const [username, setUsername] = useState(getUsername());

    const handleCardClick = (useCase: UseCaseCard) => {
        if (useCase.status === 'coming-soon') return;

        // Check if user is authenticated
        if (!isAuthenticated()) {
            setSelectedUseCase(useCase);
            setShowLoginModal(true);
            return;
        }

        // User is authenticated, proceed to use case
        if (useCase.route) {
            navigate(useCase.route);
        } else if (useCase.externalUrl) {
            window.location.href = useCase.externalUrl;
        }
    };

    const handleLogin = (loggedInUsername: string) => {
        setAuthenticated(true);
        setUsername(loggedInUsername);
        
        // If there was a selected use case, navigate to it
        if (selectedUseCase) {
            if (selectedUseCase.route) {
                navigate(selectedUseCase.route);
            } else if (selectedUseCase.externalUrl) {
                window.location.href = selectedUseCase.externalUrl;
            }
            setSelectedUseCase(null);
        }
    };

    const handleLogout = () => {
        clearAuth();
        setAuthenticated(false);
        setUsername(null);
    };

    return (
        <div className="min-h-screen bg-page text-neutral-950">
            {/* Header */}
            <div className="bg-white border-b border-hair sticky top-0 z-50">
                <div className="px-8 md:px-12 py-4">
                    <div className="flex items-center justify-between gap-8">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-4 text-left hover:opacity-80 transition-opacity"
                        >
                            <img
                                src="/audri-logo.png"
                                alt="AudRI Platform"
                                className="h-14 w-fit"
                            />
                            <div>
                                <div className="overline mb-1">The Audit Platform</div>
                                <h1 className="heading text-3xl tracking-tight">AudRI</h1>
                            </div>
                        </button>

                        {/* Right - Auth buttons and branch badge */}
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3">
                                {authenticated ? (
                                    <>
                                        <div className="pill border-hair text-neutral-700">
                                            <User className="w-3 h-3" strokeWidth={1.75} />
                                            {username}
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="btn-secondary"
                                        >
                                            <LogOut className="w-4 h-4" strokeWidth={1.75} />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn-secondary">
                                            Documentation
                                        </button>
                                        <button
                                            onClick={() => setShowLoginModal(true)}
                                            className="btn-primary"
                                        >
                                            Login
                                        </button>
                                    </>
                                )}
                            </div>
                            <span className={`pill ${branchBadgeClass}`}>
                                {`Branch: ${branchLabel}`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="px-8 md:px-12 py-12">
                <div className="mb-10 max-w-5xl">
                    <div className="overline mb-4">Workspace · Compliance</div>
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <h2 className="heading text-4xl md:text-6xl tracking-tighter">
                                Choose Your Audit Use Case
                            </h2>
                            <p className="text-base md:text-lg text-neutral-600 max-w-3xl mt-4 leading-relaxed">
                                Select from a suite of inspection-grade workflows designed to streamline operations,
                                preserve auditability, and accelerate regulated decisions.
                            </p>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 border border-hair bg-white px-4 py-3 rounded-sm">
                            <Sparkles className="w-4 h-4 text-rust" strokeWidth={1.75} />
                            <span className="mono text-xs text-neutral-600">Swiss control room pilot</span>
                        </div>
                    </div>
                </div>

                {/* Use Case Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 border-l border-t border-hair bg-white mb-12">
                    {useCases.map((useCase) => {
                        const Icon = useCase.icon;
                        const isComingSoon = useCase.status === 'coming-soon';

                        return (
                            <div
                                key={useCase.id}
                                onClick={() => handleCardClick(useCase)}
                                className={`
                                    relative border-r border-b border-hair p-6 transition-colors group
                                    ${isComingSoon
                                        ? 'opacity-70 cursor-not-allowed bg-neutral-50'
                                        : 'cursor-pointer hover:bg-neutral-50'
                                    }
                                `}
                            >
                                <div className="flex items-start justify-between gap-4 mb-8">
                                    <div className="w-11 h-11 border border-hair rounded-sm flex items-center justify-center bg-white text-neutral-900">
                                        <Icon className="w-5 h-5" strokeWidth={1.75} />
                                    </div>
                                    {isComingSoon ? (
                                        <span className="status-badge status-na">
                                            <Clock className="w-3 h-3" strokeWidth={1.75} />
                                            Coming Soon
                                        </span>
                                    ) : (
                                        <span className="status-badge status-pass">
                                            <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
                                            Active
                                        </span>
                                    )}
                                </div>

                                <div className="overline mb-3">{useCase.id.replace(/-/g, ' ')}</div>
                                <h3 className="heading text-2xl text-neutral-950 mb-3">
                                    {useCase.title}
                                </h3>
                                <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                                    {useCase.description}
                                </p>

                                <ul className="space-y-2 mb-8">
                                    {useCase.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-neutral-700">
                                            <span className="w-1.5 h-1.5 bg-rust rounded-sm"></span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {!isComingSoon && (
                                    <button className="btn-primary w-full">
                                        Launch Module
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Stats Section */}
                <div className="grid md:grid-cols-4 border-l border-t border-hair bg-white">
                    {[
                        ['3', 'Active Modules'],
                        ['2', 'Coming Soon'],
                        ['100%', 'AI-Powered'],
                        ['24/7', 'Availability'],
                    ].map(([value, label]) => (
                        <div key={label} className="p-6 border-r border-b border-hair">
                            <div className="heading text-4xl font-medium tracking-tighter leading-none text-neutral-950 num">{value}</div>
                            <div className="overline mt-4">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => {
                    setShowLoginModal(false);
                    setSelectedUseCase(null);
                }}
                onLogin={handleLogin}
                useCaseName={selectedUseCase?.title}
            />
        </div>
    );
}
