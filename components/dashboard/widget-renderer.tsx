'use client';

import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Users,
  Activity,
  Shield,
  Heart,
  TrendingUp,
  Zap,
  ListTodo,
} from 'lucide-react';

interface WidgetProps {
  widgetKey: string;
  data?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

const WIDGET_ICONS: Record<string, React.ReactNode> = {
  compliance_score: <Shield className="h-4 w-4" />,
  framework_progress: <BarChart3 className="h-4 w-4" />,
  control_status: <CheckCircle2 className="h-4 w-4" />,
  evidence_freshness: <FileText className="h-4 w-4" />,
  task_summary: <ListTodo className="h-4 w-4" />,
  overdue_tasks: <AlertTriangle className="h-4 w-4" />,
  my_tasks: <ListTodo className="h-4 w-4" />,
  incidents_open: <Zap className="h-4 w-4" />,
  care_plan_status: <Heart className="h-4 w-4" />,
  recent_activity: <Activity className="h-4 w-4" />,
  team_activity: <Users className="h-4 w-4" />,
  churn_risk: <TrendingUp className="h-4 w-4" />,
  trial_funnel: <TrendingUp className="h-4 w-4" />,
  policy_compliance: <FileText className="h-4 w-4" />,
  upcoming_reviews: <Clock className="h-4 w-4" />,
};

const WIDGET_LABELS: Record<string, string> = {
  compliance_score: 'Compliance Score',
  framework_progress: 'Framework Progress',
  control_status: 'Control Status',
  evidence_freshness: 'Evidence Freshness',
  task_summary: 'Task Summary',
  overdue_tasks: 'Overdue Tasks',
  my_tasks: 'My Tasks',
  incidents_open: 'Open Incidents',
  care_plan_status: 'Care Plans',
  recent_activity: 'Recent Activity',
  team_activity: 'Team Activity',
  churn_risk: 'Churn Risk',
  trial_funnel: 'Trial Funnel',
  policy_compliance: 'Policy Compliance',
  upcoming_reviews: 'Upcoming Reviews',
};

function ComplianceScoreWidget({ data }: { data?: Record<string, unknown> }) {
  const score = (data?.score as number) || 0;
  const color =
    score >= 80
      ? 'text-green-600'
      : score >= 50
        ? 'text-yellow-600'
        : 'text-red-600';
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className={`text-4xl font-bold ${color}`}>{score}%</p>
      <p className="text-xs text-muted-foreground mt-1">Overall Compliance</p>
    </div>
  );
}

function TaskSummaryWidget({ data }: { data?: Record<string, unknown> }) {
  const statuses = (data?.statuses as Record<string, number>) || {
    to_do: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
  };
  return (
    <div className="space-y-2">
      {Object.entries(statuses).map(([status, count]) => (
        <div key={status} className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground capitalize">
            {status.replace('_', ' ')}
          </span>
          <span className="text-sm font-bold text-foreground">{count}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityWidget({ data }: { data?: Record<string, unknown> }) {
  const items = (data?.items as Array<{ text: string; time: string }>) || [];
  return (
    <div className="space-y-2 overflow-y-auto max-h-full">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <span className="text-muted-foreground whitespace-nowrap">
            {item.time}
          </span>
          <span className="text-foreground">{item.text}</span>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          No recent activity
        </p>
      )}
    </div>
  );
}

function GenericCountWidget({
  data,
  label,
}: {
  data?: Record<string, unknown>;
  label: string;
}) {
  const count = (data?.count as number) || 0;
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-3xl font-bold text-foreground">{count}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export function WidgetRenderer({
  widgetKey,
  data,
  config: _config,
}: WidgetProps) {
  const icon = WIDGET_ICONS[widgetKey];
  const label = WIDGET_LABELS[widgetKey] || widgetKey;

  const renderContent = () => {
    switch (widgetKey) {
      case 'compliance_score':
        return <ComplianceScoreWidget data={data} />;
      case 'task_summary':
        return <TaskSummaryWidget data={data} />;
      case 'recent_activity':
        return <ActivityWidget data={data} />;
      case 'overdue_tasks':
        return <GenericCountWidget data={data} label="Overdue" />;
      case 'incidents_open':
        return <GenericCountWidget data={data} label="Open Incidents" />;
      default:
        return <GenericCountWidget data={data} label={label} />;
    }
  };

  return (
    <div className="h-full flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
        {icon}
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      <div className="flex-1 p-3">{renderContent()}</div>
    </div>
  );
}

interface WidgetPickerProps {
  widgets: Array<{
    widget_key: string;
    name: string;
    description: string;
    category: string;
    default_width: number;
    default_height: number;
  }>;
  onAdd: (widgetKey: string) => void;
}

export function WidgetPicker({ widgets, onAdd }: WidgetPickerProps) {
  const categories = [...new Set(widgets.map((w) => w.category))];

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            {cat}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {widgets
              .filter((w) => w.category === cat)
              .map((w) => (
                <button
                  key={w.widget_key}
                  onClick={() => onAdd(w.widget_key)}
                  className="text-left p-2 rounded border border-border hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {WIDGET_ICONS[w.widget_key]}
                    <span className="text-xs font-medium text-foreground">
                      {w.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {w.description}
                  </p>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
