#!/bin/bash
PAGES="src/pages"

add_import() {
  local file=$1
  local icon=$2
  if ! grep -q "import PageHeader" "$file"; then
    sed -i '' "1s/^/import PageHeader from '@\/components\/PageHeader';\n/" "$file"
  fi
  if [ -n "$icon" ] && ! grep -q "\"$icon\"" "$file" && ! grep -q " $icon," "$file" && ! grep -q " $icon " "$file" && ! grep -q "{$icon}" "$file"; then
    sed -i '' "1s/^/import { $icon } from 'lucide-react';\n/" "$file"
  fi
}

echo "🔵 Applying blue PageHeader to all pages..."

# ComplianceScorecard
sed -i '' 's|<h1 className="text-3xl font-bold">Compliance Scorecard</h1>|<PageHeader title="Compliance Scorecard" description="Track compliance metrics across frameworks" icon={<CheckCircle className="h-6 w-6" \/>} \/>|g' "$PAGES/ComplianceScorecard.tsx"
add_import "$PAGES/ComplianceScorecard.tsx" "CheckCircle"

# CyberRiskAssessment
sed -i '' 's|<h1 className="text-3xl font-bold">Cyber Risk Register</h1>|<PageHeader title="Cyber Risk Register" description="Identify, assess, and manage cybersecurity risks" icon={<AlertTriangle className="h-6 w-6" \/>} \/>|g' "$PAGES/CyberRiskAssessment.tsx"
add_import "$PAGES/CyberRiskAssessment.tsx" "AlertTriangle"

# SecurityIncidents
sed -i '' 's|<h1 className="text-3xl font-bold">Security Incidents</h1>|<PageHeader title="Security Incidents" description="Track and manage security incidents and responses" icon={<AlertOctagon className="h-6 w-6" \/>} \/>|g' "$PAGES/SecurityIncidents.tsx"
add_import "$PAGES/SecurityIncidents.tsx" "AlertOctagon"

# StatementOfApplicability
sed -i '' 's|<h1 className="text-3xl font-bold">Statement of Applicability</h1>|<PageHeader title="Statement of Applicability" description="ISO 27001 control applicability and justification" icon={<FileCheck className="h-6 w-6" \/>} \/>|g' "$PAGES/StatementOfApplicability.tsx"
add_import "$PAGES/StatementOfApplicability.tsx" "FileCheck"

# BulkImport
sed -i '' 's|<h1 className="text-3xl font-bold">Bulk Import</h1>|<PageHeader title="Bulk Import" description="Import data in bulk across modules" icon={<Upload className="h-6 w-6" \/>} \/>|g' "$PAGES/BulkImport.tsx"
add_import "$PAGES/BulkImport.tsx" "Upload"

# VulnerabilityTracker
sed -i '' 's|<h1 className="text-3xl font-bold">Vulnerability Tracker</h1>|<PageHeader title="Vulnerability Tracker" description="Track and remediate security vulnerabilities" icon={<Bug className="h-6 w-6" \/>} \/>|g' "$PAGES/VulnerabilityTracker.tsx"
add_import "$PAGES/VulnerabilityTracker.tsx" "Bug"

# RiskMapping
sed -i '' 's|<h1 className="text-3xl font-bold">Risk-to-Control Mapping</h1>|<PageHeader title="Risk-to-Control Mapping" description="Map identified risks to framework controls" icon={<GitMerge className="h-6 w-6" \/>} \/>|g' "$PAGES/RiskMapping.tsx"
add_import "$PAGES/RiskMapping.tsx" "GitMerge"

# PriorityActionDashboard (has inline p tag)
sed -i '' 's|<div><h1 className="text-3xl font-bold">Priority Action Dashboard</h1><p className="text-gray-600">Based on Compliance Audits and Risk Assessment</p></div>|<PageHeader title="Priority Action Dashboard" description="Based on Compliance Audits and Risk Assessment" icon={<AlertCircle className="h-6 w-6" \/>} \/>|g' "$PAGES/PriorityActionDashboard.tsx"
add_import "$PAGES/PriorityActionDashboard.tsx" "AlertCircle"

# ProgrammeDashboard (has inline p tag)
sed -i '' 's|<div><h1 className="text-3xl font-bold">CSI Programme Dashboard</h1><p className="text-gray-600">SEACOM Continuous Security Improvement Programme</p></div>|<PageHeader title="CSI Programme Dashboard" description="Continuous Security Improvement Programme" icon={<Target className="h-6 w-6" \/>} \/>|g' "$PAGES/ProgrammeDashboard.tsx"
add_import "$PAGES/ProgrammeDashboard.tsx" "Target"

# ReportPortal (has inline p tag)
sed -i '' 's|<div><h1 className="text-3xl font-bold">Report Portal</h1><p className="text-gray-600">Generate, schedule, and manage compliance reports</p></div>|<PageHeader title="Report Portal" description="Generate, schedule, and manage compliance reports" icon={<FileBarChart className="h-6 w-6" \/>} \/>|g' "$PAGES/ReportPortal.tsx"
add_import "$PAGES/ReportPortal.tsx" "FileBarChart"

# WorkPackageManagement (has inline p tag)
sed -i '' 's|<div><h1 className="text-3xl font-bold">Work Package Management</h1><p className="text-gray-600">Track and manage programme work packages</p></div>|<PageHeader title="Work Package Management" description="Track and manage programme work packages" icon={<Package className="h-6 w-6" \/>} \/>|g' "$PAGES/WorkPackageManagement.tsx"
add_import "$PAGES/WorkPackageManagement.tsx" "Package"

# UCIControlsFull (has inline p tag with dynamic count - use simplified description)
sed -i '' 's|<div><h1 className="text-3xl font-bold">UCI Controls Full Register</h1><p className="text-gray-600">Complete control library - {controls.length} security controls across all work packages</p></div>|<PageHeader title="UCI Controls Full Register" description="Complete control library across all work packages" icon={<Shield className="h-6 w-6" \/>} \/>|g' "$PAGES/UCIControlsFull.tsx"
add_import "$PAGES/UCIControlsFull.tsx" "Shield"

# CSIItems (has inline Button — only replace the h1, leave the Button in place)
sed -i '' 's|<h1 className="text-3xl font-bold">CSI Items</h1>|<PageHeader title="CSI Items" description="Manage Continuous Security Improvement items" icon={<ListChecks className="h-6 w-6" \/>} \/>|g' "$PAGES/CSIItems.tsx"
add_import "$PAGES/CSIItems.tsx" "ListChecks"

# AuditMaster (text-[#0D2240] variant)
sed -i '' 's|<h1 className="text-2xl font-bold text-\[#0D2240\]">Audit Manager</h1>|<PageHeader title="Audit Manager" description="Audit workpaper engine with findings tracking" icon={<ClipboardList className="h-6 w-6" \/>} \/>|g' "$PAGES/AuditMaster.tsx"
add_import "$PAGES/AuditMaster.tsx" "ClipboardList"

# BcDrPlans
sed -i '' 's|<h1 className="text-2xl font-bold text-\[#0D2240\]">BC\/DR Plans</h1>|<PageHeader title="BC\/DR Plans" description="Business continuity and disaster recovery plans" icon={<ShieldAlert className="h-6 w-6" \/>} \/>|g' "$PAGES/BcDrPlans.tsx"
add_import "$PAGES/BcDrPlans.tsx" "ShieldAlert"

# HumanResources
sed -i '' 's|<h1 className="text-2xl font-bold text-\[#0D2240\]">Security Training \& Personnel</h1>|<PageHeader title="Security Training \& Personnel" description="Manage security awareness and personnel records" icon={<Users className="h-6 w-6" \/>} \/>|g' "$PAGES/HumanResources.tsx"
add_import "$PAGES/HumanResources.tsx" "Users"

# LegalRegisters
sed -i '' 's|<h1 className="text-2xl font-bold text-\[#0D2240\]">Regulatory Register</h1>|<PageHeader title="Regulatory Register" description="Track legal and regulatory compliance obligations" icon={<Scale className="h-6 w-6" \/>} \/>|g' "$PAGES/LegalRegisters.tsx"
add_import "$PAGES/LegalRegisters.tsx" "Scale"

# PenTestTracker
sed -i '' 's|<h1 className="text-2xl font-bold text-\[#0D2240\]">Penetration Test Tracker</h1>|<PageHeader title="Penetration Test Tracker" description="Track penetration tests and remediation status" icon={<Crosshair className="h-6 w-6" \/>} \/>|g' "$PAGES/PenTestTracker.tsx"
add_import "$PAGES/PenTestTracker.tsx" "Crosshair"

# UCIControls
sed -i '' 's|<h1 className="text-2xl font-bold text-\[#0D2240\]">UCI Controls Validation Program</h1>|<PageHeader title="UCI Controls Validation Program" description="Validate and track UCI control compliance" icon={<CheckSquare className="h-6 w-6" \/>} \/>|g' "$PAGES/UCIControls.tsx"
add_import "$PAGES/UCIControls.tsx" "CheckSquare"

# VendorRiskManagement
sed -i '' 's|<h1 className="text-2xl font-bold text-\[#0D2240\]">Vendor Risk Management</h1>|<PageHeader title="Vendor Risk Management" description="Assess and manage third-party vendor risks" icon={<Building2 className="h-6 w-6" \/>} \/>|g' "$PAGES/VendorRiskManagement.tsx"
add_import "$PAGES/VendorRiskManagement.tsx" "Building2"

# EvidenceCollection (line 304 — the real header, not the error state)
sed -i '' 's|<h1 className="text-2xl font-bold">Evidence Collection \& Audit Trail</h1>|<PageHeader title="Evidence Collection \& Audit Trail" description="Collect and manage audit evidence" icon={<FolderSearch className="h-6 w-6" \/>} \/>|g' "$PAGES/EvidenceCollection.tsx"
add_import "$PAGES/EvidenceCollection.tsx" "FolderSearch"

# AssetInventory (white text on coloured bg — replace just the h1)
sed -i '' 's|<h1 className="text-2xl font-bold text-white">Asset Inventory</h1>|<PageHeader title="Asset Inventory" description="Manage and track organisational assets" icon={<Server className="h-6 w-6" \/>} \/>|g' "$PAGES/AssetInventory.tsx"
add_import "$PAGES/AssetInventory.tsx" "Server"

echo ""
echo "✅ All done! Verify with:"
echo "   grep -rn 'PageHeader' src/pages/ | wc -l"
echo "   npm run dev"
