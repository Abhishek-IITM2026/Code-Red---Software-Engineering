import ScheduleView from '../../administration/components/ScheduleView';
import ChildSelector from "../components/ChildSelector";
import { useParentChildren } from "../useParentChildren";

const ParentTimetable = function() {
  const { children, selectedChild, selectedChildId, setSelectedChildId } = useParentChildren();

  return (
    <div className="space-y-6">
      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />
      <ScheduleView
        userRole="parent"
        classId={selectedChild.classId}
        sectionId={selectedChild.sectionId}
      />
    </div>
  );
};

export default ParentTimetable;
