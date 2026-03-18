import { ChartAreaInteractive } from "@/components/ui/shadcn-io/area-chart-01";

function AreaChart01({ dataType }: { dataType?: "complaint" | "feedback" }) {
  return <ChartAreaInteractive dataType={dataType} />;
}

export default AreaChart01;
