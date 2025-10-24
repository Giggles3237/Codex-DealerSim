import { Achievement, Notification } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface Props {
  achievements: Achievement[];
  storedNotifications: Notification[];
}

export const AchievementsView = ({ achievements, storedNotifications }: Props) => {
  // Safety check for backwards compatibility
  const safeAchievements = achievements || [];
  const safeStoredNotifications = storedNotifications || [];
  
  const completedAchievements = safeAchievements.filter(a => a.completed);
  const completedCount = completedAchievements.length;
  const totalCount = safeAchievements.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Filter achievement notifications
  const achievementNotifications = safeStoredNotifications.filter(n => n.type === 'achievement');
  
  // Only show completed achievements - this creates a surprise element!
  const visibleAchievements = safeAchievements.filter(a => a.completed);
  
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/30 to-slate-900/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Achievements</span>
            <Badge variant="secondary" className="font-mono text-lg">
              {completedCount} Unlocked
            </Badge>
          </CardTitle>
          <CardDescription>
            {completedCount === 0 
              ? "Start playing to unlock achievements!"
              : `Progress: ${completedCount} achievement${completedCount > 1 ? 's' : ''} earned`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedCount > 0 && (
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          )}
          {completedCount === 0 && (
            <div className="text-center py-4 text-slate-400">
              <p className="text-lg">🔒</p>
              <p className="text-sm mt-2">Keep playing to discover achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements List */}
      {visibleAchievements.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleAchievements.map((achievement) => (
          <Card 
            key={achievement.id}
            className={`${
              achievement.completed 
                ? 'border-green-500/30 bg-gradient-to-r from-green-950/30 to-slate-900/30' 
                : 'border-slate-600/30 bg-slate-900/30'
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className={achievement.completed ? 'text-green-400' : 'text-slate-400'}>
                  {achievement.completed ? '🏆' : '🔒'} {achievement.name}
                </span>
                {achievement.completed && (
                  <Badge variant="default" className="bg-green-600">
                    Completed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {achievement.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Requirement:</span>
                  <span className="font-mono">
                    {achievement.requirements.type === 'revenue' && '$'}
                    {achievement.requirements.type === 'sales' && ''}
                    {achievement.requirements.type === 'csi' && ''}
                    {achievement.requirements.type === 'cash' && '$'}
                    {achievement.requirements.type === 'service_ros' && ''}
                    {achievement.requirements.value.toLocaleString()}
                    {achievement.requirements.type === 'revenue' && ''}
                    {achievement.requirements.type === 'sales' && ' vehicles'}
                    {achievement.requirements.type === 'csi' && ' CSI'}
                    {achievement.requirements.type === 'cash' && ''}
                    {achievement.requirements.type === 'service_ros' && ' ROs'}
                  </span>
                </div>
                {achievement.completed && achievement.completedDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Unlocked:</span>
                    <span className="text-green-400 font-mono">
                      {new Date(achievement.completedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      ) : (
        <Card className="border-slate-600/30 bg-slate-900/30">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400 text-lg">No achievements unlocked yet</p>
            <p className="text-slate-500 text-sm mt-2">Keep playing to discover what achievements await!</p>
          </CardContent>
        </Card>
      )}

      {/* Achievement History */}
      {achievementNotifications.length > 0 && (
        <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-950/30 to-slate-900/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🏆 Achievement History</span>
              <Badge variant="secondary">{achievementNotifications.length}</Badge>
            </CardTitle>
            <CardDescription>
              All achievements you've unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {achievementNotifications.slice().reverse().map((notification) => (
                <div 
                  key={notification.id}
                  className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-yellow-400">{notification.message}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

