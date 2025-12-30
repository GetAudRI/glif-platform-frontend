/**
 * Single Vendor Audit Workflow
 * 5-step compliance audit process
 */

import React, { useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { number: 1, title: 'Select Vendor', description: 'Choose vendor to audit' },
  { number: 2, title: 'Upload Documents', description: 'Add vendor documentation' },
  { number: 3, title: 'Select Standards', description: 'Choose GxP compliance rules' },
  { number: 4, title: 'Run Check', description: 'Execute compliance validation' },
  { number: 5, title: 'Review Findings', description: 'Analyze results and CAPAs' }
];

const SingleVendorAuditWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select or Create Vendor</h3>
            <p className="text-gray-600">Choose an existing vendor or create a new vendor profile</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Vendor selection UI to be implemented</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Vendor Documents</h3>
            <p className="text-gray-600">Upload validation reports, SOPs, and compliance documentation</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Document upload UI to be implemented</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Compliance Standards</h3>
            <p className="text-gray-600">Choose which GxP rules to validate against</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Rule selection UI to be implemented</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Run Compliance Check</h3>
            <p className="text-gray-600">Review summary and execute compliance validation</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Compliance check UI to be implemented</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Findings</h3>
            <p className="text-gray-600">Analyze compliance findings and manage CAPAs</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Findings results UI to be implemented</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-cyan-600 border-cyan-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-900">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-cyan-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as Step)}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="text-sm text-gray-600">
          Step {currentStep} of {STEPS.length}
        </div>
        <button
          onClick={() => setCurrentStep(Math.min(5, currentStep + 1) as Step)}
          disabled={currentStep === 5}
          className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 5 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default SingleVendorAuditWorkflow;
