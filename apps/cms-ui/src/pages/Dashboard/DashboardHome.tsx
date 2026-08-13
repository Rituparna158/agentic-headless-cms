import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Typography,
  Button,
} from '@repo/shared-ui';
import {
  Users,
  FileText,
  Eye,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Plus,
} from 'lucide-react';

export const DashboardHome = () => {
  const stats = [
    {
      title: 'Total Posts',
      value: '248',
      icon: <FileText size={20} className="text-blue-500" />,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Members',
      value: '41,040',
      icon: <Users size={20} className="text-green-500" />,
      trend: '+5.2%',
      trendUp: true,
    },
    {
      title: 'Total Views',
      value: '1.2M',
      icon: <Eye size={20} className="text-purple-500" />,
      trend: '+18.4%',
      trendUp: true,
    },
    {
      title: 'Engagement Rate',
      value: '24%',
      icon: <Activity size={20} className="text-orange-500" />,
      trend: '-2.1%',
      trendUp: false,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Published a new post',
      target: 'Top 10 Web Trends 2026',
      time: '2 hours ago',
      user: 'Admin',
    },
    {
      id: 2,
      action: 'Updated page',
      target: 'About Us',
      time: '4 hours ago',
      user: 'Jane Doe',
    },
    {
      id: 3,
      action: 'New member joined',
      target: 'alice@example.com',
      time: '5 hours ago',
      user: 'System',
    },
    {
      id: 4,
      action: 'Draft created',
      target: 'Understanding AI Agents',
      time: '1 day ago',
      user: 'Admin',
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Typography
            variant="h2"
            className="text-3xl font-bold tracking-tight mb-1 text-foreground"
          >
            Dashboard Overview
          </Typography>
          <Typography variant="body" className="text-muted-foreground">
            Here&apos;s what&apos;s happening in your CMS today.
          </Typography>
        </div>
        <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
          <Plus size={16} />
          New Post
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-card border-border/40 hover:border-border/80 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                  {stat.icon}
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${stat.trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                >
                  {stat.trendUp ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingUp size={14} className="transform rotate-180" />
                  )}
                  {stat.trend}
                </div>
              </div>
              <Typography
                variant="h3"
                className="text-2xl font-bold text-foreground mb-1"
              >
                {stat.value}
              </Typography>
              <Typography
                variant="label"
                className="text-muted-foreground font-medium"
              >
                {stat.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border/40 flex flex-col min-h-[400px]">
          <CardHeader className="border-b border-border/40 px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Traffic Overview
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Last 30 Days
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col items-center justify-center">
            {/* Placeholder for a chart */}
            <div className="w-full h-64 bg-black/20 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <Typography
                variant="body"
                className="text-muted-foreground flex items-center gap-2"
              >
                <Activity size={18} />
                Traffic chart visualization (Placeholder)
              </Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40">
          <CardHeader className="border-b border-border/40 px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Activity
            </CardTitle>
            <ArrowUpRight
              size={18}
              className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            />
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/40">
              {recentActivity.map((activity) => (
                <li
                  key={activity.id}
                  className="p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <Typography
                      variant="label"
                      className="font-semibold text-foreground group-hover:text-primary transition-colors"
                    >
                      {activity.action}
                    </Typography>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                  <Typography
                    variant="body"
                    className="text-sm text-secondary-foreground truncate"
                  >
                    {activity.target}
                  </Typography>
                  <Typography
                    variant="body"
                    className="text-xs text-muted-foreground mt-2"
                  >
                    by {activity.user}
                  </Typography>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
