import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle2, XCircle, Clock, FileText, MessageSquare } from 'lucide-react';

export default function ControlVerification() {
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // Mock data - replace with real data from your hooks
  const pendingReviews = [
    { id: 1, client: "ABC Foods", control: "2.5.1.1 - Management Commitment", submitted: "2024-05-04", status: "pending" },
    { id: 2, client: "XYZ Manufacturing", control: "1.1.1 - Senior Management", submitted: "2024-05-03", status: "reviewing" },
    { id: 3, client: "Fresh Produce Ltd", control: "2.1 - HACCP Plan", submitted: "2024-05-02", status: "pending" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Control Verification</h1>
        <p className="text-muted-foreground mt-2">
          Review and verify client-submitted evidence against compliance frameworks
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Review ({pendingReviews.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{review.client}</CardTitle>
                    <CardDescription>{review.control}</CardDescription>
                  </div>
                  <Badge variant={review.status === 'pending' ? 'default' : 'secondary'}>
                    {review.status === 'pending' ? 'Pending' : 'In Review'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Submitted: {review.submitted}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        View Evidence
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Request Changes
                      </Button>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="destructive" size="sm">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button variant="default" size="sm">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
