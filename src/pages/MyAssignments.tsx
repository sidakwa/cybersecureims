import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, AlertTriangle, Shield, Bug, Building2, Calendar, User, Target, Clock, CheckCircle, AlertCircle, ArrowRight, Filter, Search, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Assignment {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  due_date: string;
  priority: string;
  severity: string;
  owner: string;
  link: string;
  created_at?: string;
}

export default function MyAssignments() {
  const navigate = useNavigate();
  const { user, organizationId } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const userEmail = user?.email || '';

  useEffect(() => {
    if (organizationId && userEmail) {
      fetchAssignments();
    }
  }, [organizationId, userEmail]);

  const fetchAssignments = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      
      // Fetch risks assigned to user
      const { data: risks } = await supabase
        .from('cyber_risks')
        .select('id, risk_title, risk_description, status, risk_level, owner, created_at')
        .eq('organization_id', organizationId)
        .eq('owner', userEmail);
      
      // Fetch vulnerabilities assigned to user
      const { data: vulnerabilities } = await supabase
        .from('vulnerabilities')
        .select('id, title, severity, status, due_date, remediation_plan, discovered_date')
        .eq('organization_id', organizationId);
      
      // Fetch work packages assigned to user
      const { data: workPackages } = await supabase
        .from('work_package_register')
        .select('wp_id, wp_name, status, priority, planned_end_date, owner')
        .eq('organization_id', organizationId)
        .eq('owner', userEmail);
      
      // Fetch audit findings assigned to user
      const { data: findings } = await supabase
        .from('audit_findings')
        .select('id, finding_title, severity, finding_status, due_date, owner')
        .eq('organization_id', organizationId)
        .eq('owner', userEmail);
      
      // Fetch actions assigned to user
      const { data: actions } = await supabase
        .from('audit_actions')
        .select('id, action_title, description, status, priority, due_date, assigned_to')
        .eq('organization_id', organizationId)
        .eq('assigned_to', userEmail);
      
      const allAssignments: Assignment[] = [];
      
      // Add risks
      risks?.forEach(risk => {
        allAssignments.push({
          id: risk.id,
          type: 'Risk',
          title: risk.risk_title,
          description: risk.risk_description || '',
          status: risk.status,
          due_date: risk.created_at,
          priority: risk.risk_level,
          severity: risk.risk_level,
          owner: risk.owner,
          link: '/risk-assessment',
          created_at: risk.created_at
        });
      });
      
      // Add vulnerabilities (filter by those that might affect user's assets)
      vulnerabilities?.forEach(vuln => {
        allAssignments.push({
          id: vuln.id,
          type: 'Vulnerability',
          title: vuln.title,
          description: vuln.remediation_plan || '',
          status: vuln.status,
          due_date: vuln.due_date,
          priority: vuln.severity,
          severity: vuln.severity,
          owner: userEmail,
          link: '/vulnerabilities',
          created_at: vuln.discovered_date
        });
      });
      
      // Add work packages
      workPackages?.forEach(wp => {
        allAssignments.push({
          id: wp.wp_id,
          type: 'Work Package',
          title: wp.wp_name,
          description: '',
          status: wp.status,
          due_date: wp.planned_end_date,
          priority: wp.priority,
          severity: wp.priority,
          owner: wp.owner,
          link: '/work-packages'
        });
      });
      
      // Add findings
      findings?.forEach(finding => {
        allAssignments.push({
          id: finding.id,
          type: 'Audit Finding',
          title: finding.finding_title,
          description: '',
          status: finding.finding_status,
          due_date: finding.due_date,
          priority: finding.severity,
          severity: finding.severity,
          owner: finding.owner,
          link: '/audits/findings'
        });
      });
      
      // Add actions
      actions?.forEach(action => {
        allAssignments.push({
          id: action.id,
          type: 'Action Item',
          title: action.action_title,
          description: action.description || '',
          status: action.status,
          due_date: action.due_date,
          priority: action.priority,
          severity: action.priority,
          owner: action.assigned_to,
          link: '/audits/actions'
        });
      });
      
      // Sort by due date (closest first)
      allAssignments.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
      
      setAssignments(allAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Completed': 'bg-green-100 text-green-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Remediated': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'In_Progress': 'bg-blue-100 text-blue-800',
      'Open': 'bg-red-100 text-red-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Planned': 'bg-yellow-100 text-yellow-800',
      'Blocked': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status?.replace('_', ' ') || 'Unknown'}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800',
      'High': 'bg-orange-100 text-orange-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800'
    };
    return <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-100'}>{priority || 'Medium'}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Risk': return <div className="p-2 rounded-lg bg-red-100"><AlertTriangle className="h-4 w-4 text-red-600" /></div>;
      case 'Vulnerability': return <div className="p-2 rounded-lg bg-orange-100"><Bug className="h-4 w-4 text-orange-600" /></div>;
      case 'Work Package': return <div className="p-2 rounded-lg bg-purple-100"><Target className="h-4 w-4 text-purple-600" /></div>;
      case 'Audit Finding': return <div className="p-2 rounded-lg bg-yellow-100"><AlertCircle className="h-4 w-4 text-yellow-600" /></div>;
      case 'Action Item': return <div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-4 w-4 text-green-600" /></div>;
      default: return <div className="p-2 rounded-lg bg-gray-100"><Shield className="h-4 w-4 text-gray-600" /></div>;
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    
    if (activeTab === 'all') return matchesSearch && matchesPriority && matchesType;
    if (activeTab === 'open') return (a.status !== 'Completed' && a.status !== 'Resolved' && a.status !== 'Remediated') && matchesSearch && matchesPriority && matchesType;
    if (activeTab === 'completed') return (a.status === 'Completed' || a.status === 'Resolved' || a.status === 'Remediated') && matchesSearch && matchesPriority && matchesType;
    if (activeTab === 'overdue') return isOverdue(a.due_date) && a.status !== 'Completed' && matchesSearch && matchesPriority && matchesType;
    return a.type === activeTab && matchesSearch && matchesPriority && matchesType;
  });

  const stats = {
    total: assignments.length,
    open: assignments.filter(a => a.status !== 'Completed' && a.status !== 'Resolved' && a.status !== 'Remediated').length,
    completed: assignments.filter(a => a.status === 'Completed' || a.status === 'Resolved' || a.status === 'Remediated').length,
    overdue: assignments.filter(a => isOverdue(a.due_date) && a.status !== 'Completed').length,
    byType: {
      risks: assignments.filter(a => a.type === 'Risk').length,
      vulns: assignments.filter(a => a.type === 'Vulnerability').length,
      workPackages: assignments.filter(a => a.type === 'Work Package').length,
      findings: assignments.filter(a => a.type === 'Audit Finding').length,
      actions: assignments.filter(a => a.type === 'Action Item').length
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Assignments" 
        description={`Items assigned to ${userEmail}`}
        icon={<User className="h-6 w-6" />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-4">
            <p className="text-blue-100 text-sm">Total Assignments</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="pt-4">
            <p className="text-yellow-100 text-sm">Open</p>
            <p className="text-3xl font-bold">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-4">
            <p className="text-green-100 text-sm">Completed</p>
            <p className="text-3xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="pt-4">
            <p className="text-red-100 text-sm">Overdue</p>
            <p className="text-3xl font-bold">{stats.overdue}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-4">
            <p className="text-purple-100 text-sm">Completion Rate</p>
            <p className="text-3xl font-bold">{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</p>
            <Progress value={stats.total ? (stats.completed / stats.total) * 100 : 0} className="mt-2 h-1 bg-purple-400" />
          </CardContent>
        </Card>
      </div>

      {/* Type Breakdown Pills */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 px-3 py-1 bg-red-50 rounded-full">
          <AlertTriangle className="h-3 w-3 text-red-600" />
          <span className="text-xs text-red-600">Risks: {stats.byType.risks}</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full">
          <Bug className="h-3 w-3 text-orange-600" />
          <span className="text-xs text-orange-600">Vulns: {stats.byType.vulns}</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 rounded-full">
          <Target className="h-3 w-3 text-purple-600" />
          <span className="text-xs text-purple-600">Work Packages: {stats.byType.workPackages}</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 rounded-full">
          <AlertCircle className="h-3 w-3 text-yellow-600" />
          <span className="text-xs text-yellow-600">Findings: {stats.byType.findings}</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-xs text-green-600">Actions: {stats.byType.actions}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search assignments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Risk">Risks</SelectItem>
            <SelectItem value="Vulnerability">Vulnerabilities</SelectItem>
            <SelectItem value="Work Package">Work Packages</SelectItem>
            <SelectItem value="Audit Finding">Audit Findings</SelectItem>
            <SelectItem value="Action Item">Action Items</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || priorityFilter !== 'all' || typeFilter !== 'all') && (
          <Button variant="ghost" onClick={() => { setSearchTerm(''); setPriorityFilter('all'); setTypeFilter('all'); }} className="gap-1">
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap gap-2 bg-transparent">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">All ({filteredAssignments.length})</TabsTrigger>
          <TabsTrigger value="open" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Open ({stats.open})</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overdue ({stats.overdue})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <Card><CardContent className="pt-12 pb-12 text-center"><CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" /><p className="text-gray-500">No assignments found</p><p className="text-sm text-gray-400">You're all caught up!</p></CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b text-sm font-medium text-gray-600">
                <div className="col-span-4">Assignment</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-1">Due Date</div>
                <div className="col-span-1 text-center">Action</div>
              </div>
              
              {/* Table Rows */}
              <div className="divide-y">
                {filteredAssignments.map((item) => (
                  <div 
                    key={`${item.type}-${item.id}`} 
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer items-start md:items-center"
                    onClick={() => navigate(item.link)}
                  >
                    {/* Assignment Info */}
                    <div className="col-span-4 flex gap-3">
                      {getTypeIcon(item.type)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
                      </div>
                    </div>
                    
                    {/* Type */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">{item.type}</span>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="col-span-2">
                      {getStatusBadge(item.status)}
                    </div>
                    
                    {/* Priority */}
                    <div className="col-span-2">
                      {getPriorityBadge(item.priority)}
                    </div>
                    
                    {/* Due Date */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className={isOverdue(item.due_date) && item.status !== 'Completed' ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action */}
                    <div className="col-span-1 text-center">
                      <ArrowRight className="h-4 w-4 text-gray-400 inline" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
