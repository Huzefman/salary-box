import { PendingLeaveQueue } from '@/features/leave/components/PendingLeaveQueue'
import { TeamLeaveCalendar } from '@/features/leave/components/TeamLeaveCalendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TeamLeavePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team Leave</h1>
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Pending Reviews</TabsTrigger>
          <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="mt-4">
          <PendingLeaveQueue />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <TeamLeaveCalendar />
        </TabsContent>
      </Tabs>
    </div>
  )
}
