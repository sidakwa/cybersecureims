import { useState, useEffect } from 'react';
import { FileCheck, Link, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

interface EvidenceLinkProps {
  auditId: string;
  auditNumber: string;
}

export function EvidenceLink({ auditId, auditNumber }: EvidenceLinkProps) {
  const [hasEvidence, setHasEvidence] = useState(false);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEvidence();
  }, [auditId]);

  const checkEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from('evidence_records')
        .select('id')
        .eq('audit_id', auditId)
        .maybeSingle();
      
      if (!error && data) {
        setHasEvidence(true);
        setEvidenceId(data.id);
      }
    } catch (error) {
      console.error('Error checking evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  if (hasEvidence && evidenceId) {
    return (
      <a 
        href={`/#/evidence-collection`}
        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
      >
        <FileCheck className="h-3 w-3" />
        Evidence Linked
        <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    );
  }

  return (
    <Badge variant="outline" className="text-xs bg-gray-50">
      No evidence yet
    </Badge>
  );
}
