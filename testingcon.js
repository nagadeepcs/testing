import React, { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Square, RefreshCw, Pause, MousePointerClick, Activity, CheckCircle2, Clock, MousePointer, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrowserCanvas from './BrowserCanvas';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExecutionConsoleProps {
  testId?: string;
  testName?: string;
  testPrompt?: string;
  onSave?: (name: string, prompt: string) => void;
}

interface LogEntry {
  type: 'info' | 'success' | 'error' | 'action';
  message: string;
  time: string;
}

interface ExecutionProgress {
  percentage: number;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
}

interface RecordedStep {
  id: string;
  action: string;
  element: string;
  timestamp: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({ testId, testName, testPrompt, onSave }) => {
  const [name, setName] = useState(testName || '');
  const [prompt, setPrompt] = useState(testPrompt || '');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isNew, setIsNew] = useState(!testId);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState('configuration');
  const [isAssertMode, setIsAssertMode] = useState(false);
  const [showSteps, setShowSteps] = useState(true);
  const [progress, setProgress] = useState<ExecutionProgress>({
    percentage: 0,
    currentStep: 'Idle',
    totalSteps: 0,
    completedSteps: 0
  });
  const [recordedSteps, setRecordedSteps] = useState<RecordedStep[]>([]);

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const runTest = () => {
    if (!prompt.trim()) return;
    
    setIsRunning(true);
    setActiveTab('execution'); // Switch to execution tab
    setLogs([
      { type: 'info', message: 'Starting test execution...', time: getCurrentTime() },
    ]);
    
    // Simulate browser spin-up and test execution
    setTimeout(() => {
      setLogs(prev => [...prev, { 
        type: 'info', 
        message: 'Initializing browser environment...', 
        time: getCurrentTime() 
      }]);
    }, 1000);
    
    setTimeout(() => {
      setLogs(prev => [...prev, { 
        type: 'info', 
        message: 'Browser ready. Beginning test steps...', 
        time: getCurrentTime() 
      }]);
    }, 2500);
    
    setTimeout(() => {
      setLogs(prev => [...prev, { 
        type: 'action', 
        message: 'Navigating to target website', 
        time: getCurrentTime() 
      }]);
    }, 3500);
    
    setTimeout(() => {
      setLogs(prev => [...prev, { 
        type: 'success', 
        message: 'Test completed successfully!', 
        time: getCurrentTime() 
      }]);
      setIsRunning(false);
    }, 5500);
  };

  const pauseTest = () => {
    setIsPaused(true);
    setLogs(prev => [...prev, { 
      type: 'info', 
      message: 'Test execution paused', 
      time: getCurrentTime() 
    }]);
  };

  const resumeTest = () => {
    setIsPaused(false);
    setLogs(prev => [...prev, { 
      type: 'info', 
      message: 'Test execution resumed', 
      time: getCurrentTime() 
    }]);
  };

  const stopTest = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsAssertMode(false);
    setRecordedSteps([]);
    setProgress({
      percentage: 0,
      currentStep: 'Idle',
      totalSteps: 0,
      completedSteps: 0
    });
    setLogs(prev => [...prev, { 
      type: 'error', 
      message: 'Test execution stopped by user', 
      time: getCurrentTime() 
    }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a test name');
      return;
    }
    
    if (!prompt.trim()) {
      toast.error('Please enter a test prompt');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (onSave) {
        onSave(name, prompt);
        setIsNew(false);
        toast.success('Test saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save test');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAssertMode = () => {
    if (!isRunning) {
      toast.error('Start execution to use assertion mode');
      return;
    }
    if (!isPaused) {
      toast.error('Pause execution to enable assertion mode');
      return;
    }
    setIsAssertMode(!isAssertMode);
    toast.success(isAssertMode ? 'Assertion mode disabled' : 'Assertion mode enabled - Click elements in the browser to create assertions');
  };

  const getStepIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'click':
        return <MousePointer className="h-3.5 w-3.5" />;
      case 'type':
        return <MousePointerClick className="h-3.5 w-3.5" />;
      case 'assert':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      default:
        return <Activity className="h-3.5 w-3.5" />;
    }
  };

  const getLogClass = (type: string) => {
    switch(type) {
      case 'info': return 'text-gray-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'action': return 'text-blue-600';
      default: return '';
    }
  };

  // Simulate polling for execution progress and recorded steps
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const pollInterval = setInterval(() => {
      setProgress(prev => {
        const newPercentage = Math.min(prev.percentage + 5, 100);
        const steps = [
          'Initializing browser',
          'Loading page',
          'Executing actions',
          'Running assertions',
          'Finalizing'
        ];
        const stepIndex = Math.floor((newPercentage / 100) * steps.length);
        
        return {
          percentage: newPercentage,
          currentStep: steps[stepIndex] || 'Completed',
          totalSteps: steps.length,
          completedSteps: stepIndex
        };
      });

      // Simulate recorded steps being added
      if (Math.random() > 0.7) {
        const actions = [
          { action: 'Click', element: 'button.submit' },
          { action: 'Type', element: 'input[name="email"]' },
          { action: 'Navigate', element: '/dashboard' },
          { action: 'Wait', element: '.loading-spinner' },
          { action: 'Assert', element: 'h1.title' }
        ];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        setRecordedSteps(prev => {
          if (prev.length >= 8) return prev;
          return [...prev, {
            id: `step-${Date.now()}`,
            action: randomAction.action,
            element: randomAction.element,
            timestamp: new Date().toLocaleTimeString(),
            status: 'completed'
          }];
        });
      }
    }, 800);

    return () => clearInterval(pollInterval);
  }, [isRunning, isPaused]);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left: Tabs for Config + Execution */}
        <div className="w-full lg:max-w-[28%] min-w-[260px] flex flex-col space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 h-12 rounded-lg border border-border">
              <TabsTrigger 
                value="configuration"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-md font-semibold"
              >
                Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="execution"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-md font-semibold"
              >
                Execution
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuration" className="flex-1 mt-4">
              <Card className="bg-white shadow-sm h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Test Setup</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="test-name">Test Name</Label>
                      <Input
                        id="test-name"
                        placeholder="Enter a name for your test"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-gray-300"
                        disabled={isRunning}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="test-prompt">Test Prompt (in plain English)</Label>
                      <Textarea
                        id="test-prompt"
                        placeholder="Describe what you want to test in plain English..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[120px] border-gray-300"
                        disabled={isRunning}
                      />
                      <p className="text-xs text-gray-500">
                        Be specific about what actions the browser should perform
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 pt-2">
                  {!isRunning && (
                    <Button
                      variant="outline"
                      onClick={handleSave}
                      disabled={isRunning || isSaving || (!name.trim() || !prompt.trim())}
                      className="text-gray-700"
                    >
                      {isSaving ? 'Saving...' : 'Save Test'}
                    </Button>
                  )}
                  <Button 
                    onClick={runTest} 
                    className="bg-[rgb(35,90,228)] hover:bg-[rgb(25,70,208)] flex items-center ml-auto"
                    disabled={!prompt.trim() || isRunning}
                  >
                    <Play className="mr-1 h-4 w-4" /> Run Test
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="execution" className="flex-1 mt-4">
              <Card className="bg-white shadow-sm h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Execution Controls</CardTitle>
                    <div className="flex items-center gap-2">
                      <Activity className={cn(
                        "h-4 w-4",
                        isRunning && !isPaused && "text-green-500 animate-pulse"
                      )} />
                      <Badge 
                        variant={isRunning ? (isPaused ? "secondary" : "default") : "outline"}
                        className={cn(
                          "text-xs font-medium",
                          isRunning && !isPaused && "bg-green-500 hover:bg-green-600"
                        )}
                      >
                        {isRunning ? (isPaused ? "Paused" : "Running") : "Idle"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {/* Control Buttons */}
                  <div className="flex gap-2">
                    {isRunning && (
                      <>
                        {!isPaused ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={pauseTest}
                            className="flex-1"
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resumeTest}
                            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={stopTest}
                          className="flex-1"
                        >
                          <Square className="h-3 w-3 mr-1" />
                          Stop
                        </Button>
                      </>
                    )}
                    {!isRunning && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Start a test to see execution controls
                      </p>
                    )}
                  </div>

                  {/* Progress Section */}
                  {isRunning && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{progress.currentStep}</span>
                          <span className="text-muted-foreground">{progress.percentage}%</span>
                        </div>
                        <Progress value={progress.percentage} className="h-2" />
                      </div>
                    </>
                  )}

                  {/* Assert Button */}
                  {isRunning && (
                    <>
                      <Separator />
                      <Button
                        variant={isAssertMode ? "default" : "outline"}
                        size="sm"
                        onClick={toggleAssertMode}
                        disabled={!isPaused}
                        className={cn(
                          "w-full",
                          isAssertMode && "bg-blue-600 hover:bg-blue-700"
                        )}
                      >
                        <MousePointerClick className="h-3.5 w-3.5 mr-1.5" />
                        {isAssertMode ? "Assertion Active" : "Enable Assertion Mode"}
                      </Button>
                      {isAssertMode && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 animate-fade-in">
                          <p className="text-xs text-blue-900">
                            🎯 Click elements in the browser to create assertions
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Recorded Steps */}
                  {recordedSteps.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Recorded Steps ({recordedSteps.length})</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSteps(!showSteps)}
                            className="h-6 text-xs"
                          >
                            {showSteps ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        </div>
                        {showSteps && (
                          <ScrollArea className="h-[200px] rounded border">
                            <div className="p-2 space-y-1.5">
                              {recordedSteps.map((step) => (
                                <div 
                                  key={step.id}
                                  className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50 border"
                                >
                                  <div className={cn(
                                    "flex items-center justify-center h-6 w-6 rounded-full flex-shrink-0",
                                    step.status === 'completed' && "bg-green-100 text-green-600"
                                  )}>
                                    {getStepIcon(step.action)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium">{step.action}</div>
                                    <code className="text-xs text-muted-foreground truncate block">
                                      {step.element}
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                                    <Clock className="h-3 w-3" />
                                    <span className="text-xs">{step.timestamp}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Console - Always visible below tabs */}
          <Card className="bg-white shadow-sm flex-1 flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Execution Console</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 h-8 w-8 p-0"
                onClick={clearLogs}
                disabled={isRunning}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="bg-gray-900 text-gray-200 rounded-md p-4 font-mono text-sm h-[300px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500 italic">Console output will appear here...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`mb-1 ${getLogClass(log.type)}`}>
                      <span className="text-gray-400">[{log.time}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Browser Preview */}
        <div className="w-full lg:max-w-[72%] min-w-0 flex flex-col">
          <BrowserCanvas testId={testId} isRunning={true} />
        </div>
      </div>
    </>
  );
};

export default ExecutionConsole;
