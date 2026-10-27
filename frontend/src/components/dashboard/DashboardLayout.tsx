import AreaChart01 from "@/features/template/component/ReCharts/AreaCharts/AreaChart01";
import BarChart01 from "@/features/template/component/ReCharts/BarCharts/BarChart01";
import BarChart08 from "@/features/template/component/ReCharts/BarCharts/BarChart08";
import PieChart11 from "@/features/template/component/ReCharts/PieCharts/PieChart11";

interface Props {
  dataType?: "complaint" | "feedback";
}

const DashboardLayout = ({ dataType = "complaint" }: Props) => {
  return (
    <div className="gap-10 rounded-xl flex flex-col justify-between bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
        <div className="lg:col-span-3 min-w-0">
          <AreaChart01 dataType={dataType} />
        </div>
        <div className="lg:col-span-2 min-w-0">
          <BarChart08 dataType={dataType} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
        <div className="lg:col-span-3 min-w-0">
          <BarChart01 dataType={dataType} />
        </div>
        <div className="lg:col-span-2 min-w-0">
          <PieChart11 dataType={dataType} />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
